var constants = require('./constants');
var utils = require('./utils');
var Session = require('./session');
var loginLib = require('./login');

var noop = function noop() { };

var buildAuthHeader = function buildAuthHeader(session) {
    var header = {};

    if (session && session.id && session.skey) {
        header[constants.WX_HEADER_ID] = session.id;
        header[constants.WX_HEADER_SKEY] = session.skey;
    }
    return header;
};

/***
 * @class
 * 表示请求过程中发生的异常
 */
var RequestError = (function () {
    function RequestError(type, message) {
        Error.call(this, message);
        this.type = type;
        this.message = message;
    }

    RequestError.prototype = new Error();
    RequestError.prototype.constructor = RequestError;

    return RequestError;
})();

var defaultOptions = {
    method: 'POST',
    header: {  
        "content-type": "application/x-www-form-urlencoded"  
      }, 
    success: noop,
    fail: noop,
    url: null,
};
function request(options) {
    options = utils.extend({}, defaultOptions, options);
    if (typeof options !== 'object') {
        var message = '请求传参应为 object 类型，但实际传了 ' + (typeof options) + ' 类型';
        throw new RequestError(constants.ERR_INVALID_PARAMS, message);
    }
    //options.url = defaultOptions.url;
    //options.data = defaultOptions.data;
    console.log('options.url:' + options.url);
    var requireLogin = options.login;
    var success = options.success || noop;
    var fail = options.fail || noop;
    var complete = options.complete || noop;
    var originHeader = options.header || {};

    // 成功回调
    var callSuccess = function () {
        success.apply(null, arguments);
        complete.apply(null, arguments);
    };

    // 失败回调
    var callFail = function (error) {
        fail.call(null, error);
        complete.call(null, error);
    };
    // 是否已经进行过重试
    var hasRetried = false;

    if (requireLogin) {
        doRequestWithLogin();
    } else {
        doRequest();
    }

    // 登录后再请求
    function doRequestWithLogin() {
        loginLib.login({ success: doRequest, fail: callFail });
    }

    // 实际进行请求的方法
    function doRequest() {
        var authHeader = buildAuthHeader(Session.get());
        wx.request(utils.extend({}, options, {
            header: utils.extend({}, originHeader, authHeader),
            success: function (response) {
                var data = response.data;
                callSuccess.apply(null, arguments);
            },
            fail: callFail,
            complete: noop,
        }));
    };
};

var setRequestUrl = function (requestUrl) {
    defaultOptions.url = requestUrl;
};
var setRequestData = function (data) {
    defaultOptions.data = data;
};

module.exports = {
    RequestError: RequestError,
    request: request,
    setRequestUrl: setRequestUrl,
    setRequestData: setRequestData,
};