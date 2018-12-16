//var host = 'weixincaidan.xyz/Xiaochengxu';
var host = 'wechatscan.com/Xiaochengxu';
var config = {
    service: {
        host,
        // 登录地址，用于建立会话 
        loginUrl: `https://${host}`,
        getMenuUrl: `https://${host}/GetMenu`,
        getOrderUrl: `https://${host}/GetOrder`,
        submitOrderUrl: `https://${host}/submitOrder`,
        CancelItemUrl: `https://${host}/CancelItem`,
        getFirstPageUrl: `https://${host}/firstPage`,
        fuwuyuanUrl: `https://${host}/fuwu`,
        errorUrl: `https://${host}/error`,
        chongzhiUrl: `https://${host}/chongzhi`,
        getPhoneNumberUrl: `https://${host}/getPhoneNumber`,
        saveClientInfoUrl: `https://${host}/saveClientInfo`,
        keyongYouhuiquanUrl: `https://${host}/keyongYouhuiquan`,
        // 测试的信道服务地址
        tunnelUrl: `https://${host}/tunnel`,
    }
};

module.exports = config;