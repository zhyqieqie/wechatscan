/*----------------------------------------------------------------
    Copyright (C) 2019 筱程 wechatscan.com 
  
    文件名：diancan/index
    文件功能描述：lib/index.js
    
----------------------------------------------------------------*/
var constants = require('./lib/constants');
var login = require('./lib/login');
var Session = require('./lib/session');
var request = require('./lib/request');

var exports = module.exports = {
    login: login.login,
    setLoginUrl: login.setLoginUrl,
    LoginError: login.LoginError,

    clearSession: Session.clear,

    request: request.request,
    setRequestUrl: request.setRequestUrl,
    RequestError: request.RequestError,
    setRequestData: request.setRequestData
};

// 导出错误类型码
Object.keys(constants).forEach(function (key) {
    if (key.indexOf('ERR_') === 0) {
        exports[key] = constants[key];
    }
});