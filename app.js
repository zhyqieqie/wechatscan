/*----------------------------------------------------------------
    Copyright (C) 2019 筱程 wechatscan.com 
  
    文件名：app
    文件功能描述：全局js
    
----------------------------------------------------------------*/
//import allmenu from 'page/resources/json/menus.js'
var qcloud = require('./util/vendor/qcloud-weapp-client-sdk/index');
var util = require('./util/util.js')
var config = require('./config');

App({
  globalData: {
    hasLogin: false,
    userInfo: {},
    zhuoziid: '262',//7826 pipi //256凯旋  //201赣水肴 //5873 诸葛烤鱼 272鱼你相约 //肥子汤馆 //262青春里  //8120聚朋酒家 8133大秦小厨 
                    //8178阿辉生煎
    menus: null,
    dingdanno: '',
    total: {
      count: 0,
      money: 0
    },
    hasGeo: false,
    phonemodel: '',
    phonesystem: '',
    networkType: '',
    scene: 1000,
    moshi: '',//加菜模式
    jiacaiDingdanno: '',
    aFendian:{},//分店对象
    aZhuozi: {},//桌子对象
    aKehu: {}//分店对象
  },
  onLaunch: function (options) {
    var that = this
    console.log('App onLaunch');
    wx.getSystemInfo({
      success: function (res) {
        that.globalData.phonemodel = res.model
        that.globalData.phonesystem = res.system + '-' + res.version + '-' + res.platform
      }
    });
    wx.getNetworkType({
      success: function (res) {
        that.globalData.networkType = res.networkType
      }
    });
    if (options != undefined && options.scene != undefined) {
      that.globalData.scene = options.scene
    }
  },
  onHide: function () {
    console.log('App Hide')
  },
  onShow: function () {
    console.log('onShow');
  },
  //记录手机端错误
  onError: function (msg) {
    var that = this
    qcloud.request({
      url: config.service.errorUrl,
      hasLogin: that.globalData.hasLogin,
      data: {
        fendianid: that.globalData.aFendian.fendianid,
        zhuoziid: that.globalData.zhuoziid,
        hasLogin: that.globalData.hasLogin,
        userInfo: JSON.stringify(that.globalData.userInfo),
        phonemodel: that.globalData.phonemodel,
        phonesystem: that.globalData.phonesystem,
        networkType: that.globalData.networkType,
        scene: that.globalData.scene,
        msg:msg
      }        
    });
  },
})