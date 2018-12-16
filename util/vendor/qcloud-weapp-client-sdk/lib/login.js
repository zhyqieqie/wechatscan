var utils = require('./utils');
var constants = require('./constants');
var Session = require('./session');

/***
 * @class
 * 表示登录过程中发生的异常
 */
var LoginError = (function () {
    function LoginError(type, message) {
        Error.call(this, message);
        this.type = type;
        this.message = message;
    }

    LoginError.prototype = new Error();
    LoginError.prototype.constructor = LoginError;

    return LoginError;
})();

/**
 * 微信登录，获取 code 和 encryptedData
 */
var getWxLoginResult = function getLoginCode(callback) {
    wx.login({
        success: function (loginResult) {
            wx.getUserInfo({
                success: function (userResult) {
                    callback(null, {
                        code: loginResult.code,
                        encryptedData: userResult.encryptedData,
                        iv: userResult.iv,
                        userInfo: userResult.userInfo,
                    });
                },

                fail: function (userError) {
                    var error = new LoginError(constants.ERR_WX_GET_USER_INFO, '获取微信用户信息失败。');
                    error.detail = userError;
                    //重新登陆
                    wx.getUserInfo({
                        success: function (userResult) {
                            callback(null, {
                                code: loginResult.code,
                                encryptedData: userResult.encryptedData,
                                iv: userResult.iv,
                                userInfo: userResult.userInfo,
                            });
                        },
                        fail: function () { callback(error, null); }
                    });
                },
            });
        },

        fail: function (loginError) {
            var error = new LoginError(constants.ERR_WX_LOGIN_FAILED, '微信登录失败，请检查网络状态');
            error.detail = loginError;
            callback(error, null);
        },
    });
};

var noop = function noop() { };
var defaultOptions = {
    method: 'GET',
    success: noop,
    fail: noop,
    //loginUrl: null,
    data: {
        x: 'xxxx',
        y: 'yyyy'
    },
};

/**
 * @method
 * 进行服务器登录，以获得登录会话 
 *
 * @param {Object} options 登录配置
 * @param {string} options.loginUrl 登录使用的 URL，服务器应该在这个 URL 上处理登录请求
 * @param {string} [options.method] 请求使用的 HTTP 方法，默认为 "GET"
 * @param {Function} options.success(userInfo) 登录成功后的回调函数，参数 userInfo 微信用户信息
 * @param {Function} options.fail(error) 登录失败后的回调函数，参数 error 错误信息
 */
var login = function login(options) {
    options = utils.extend({}, defaultOptions, options);

    var doLogin = () => getWxLoginResult(function (wxLoginError, wxLoginResult) {
        if (wxLoginError) {
            options.fail(wxLoginError);
            return;
        }
        var userInfo = wxLoginResult.userInfo;

        userInfo.requestcode = wxLoginResult.code;
        options.success(userInfo);
    });
    doLogin();
};

var setLoginUrl = function (loginUrl) {
    defaultOptions.loginUrl = loginUrl;
};

module.exports = {
    LoginError: LoginError,
    login: login,
    setLoginUrl: setLoginUrl,
};