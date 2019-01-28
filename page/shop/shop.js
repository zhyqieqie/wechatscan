/*----------------------------------------------------------------
    Copyright (C) 2019 筱程 wechatscan.com 
  
    文件名：shop/index
    文件功能描述：首页
    
----------------------------------------------------------------*/
// page/shop/index.js
var imageUtil = require('../../util/autoheight.js')
var util = require('../../util/util.js')
var qcloud = require('../../util/vendor/qcloud-weapp-client-sdk/index')
var config = require('../../config')
var app = getApp()
Page({
  data: {
    kaishishijian: '',
    jieshushijian: '',
    aFendian: {},//分店对象
    aZhuozi: {},//桌子对象
    aKehu: {},//分店对象
    yincangZhuce: true //隐藏注册窗体 
  },
  makeCall: function () {
    wx.makePhoneCall({
      phoneNumber: this.data.aFendian.dianhua
    })
  },
  openLocation: function () {
    wx.openLocation({
      latitude: app.globalData.aFendian.lat,
      longitude: app.globalData.aFendian.lng,
      scale: 28
    })
  },

  hideZhuce: function () {
    this.setData({
      yincangZhuce: true
    });
  },
  showZhuce: function () {
    this.setData({
      yincangZhuce: false
    });
  },
  getFirstPage: function (event) {
    var that = this
    qcloud.request({
      url: config.service.getFirstPageUrl,
      hasLogin: app.globalData.hasLogin,
      data: {
        zhuoziid: app.globalData.zhuoziid,
        hasLogin: app.globalData.hasLogin,
        userInfo: JSON.stringify(app.globalData.userInfo)
      },
      success: function (requestResult) {
        if (requestResult.data.code == '200') {
          that.setData({
            kaishishijian: requestResult.data.kaishishijian,
            jieshushijian: requestResult.data.jieshushijian,
            aFendian: requestResult.data.aFendian,
            aZhuozi: requestResult.data.aZhuozi,
            aKehu: requestResult.data.aKehu
          });
          app.globalData.userInfo.openId = app.globalData.userInfo.openId ? app.globalData.userInfo.openId : requestResult.data.openId;
          app.globalData.userInfo.session_key = app.globalData.userInfo.session_key ? app.globalData.userInfo.session_key : requestResult.data.session_key;
          app.globalData.aFendian = requestResult.data.aFendian;
          app.globalData.aZhuozi = requestResult.data.aZhuozi;
          app.globalData.aKehu = requestResult.data.aKehu;
          if (app.globalData.aFendian.zhifu && (!(requestResult.data.aKehu && requestResult.data.aKehu.dianhua)) && app.globalData.userInfo && app.globalData.userInfo.openId && wx.canIUse('button.open-type.getPhoneNumber')) {
            that.setData({
              yincangZhuce: false
            });
          }
          wx.setNavigationBarTitle({
            title: '欢迎光临：' + app.globalData.aFendian.fendianmingcheng
          });
          util.hideBusy();
        }
        else {
          util.hideBusy();
          util.showFailModal('处理结果', '请求失败，请稍候再试。' + requestResult);
        }
      },
      fail: function (requestResult) {
        util.hideBusy();
        util.showFailModal('处理结果', '请求失败，请稍候再试。' + requestResult);
      },
      complete: wx.stopPullDownRefresh()
    });
  },
  onLoad: function (params) {
    util.showBusy('请稍候。。。')
    var that = this
    if (params.zhuoziid) {
      app.globalData.zhuoziid = params.zhuoziid;
    }
    if (!app.globalData.hasLogin) {
      wx.login({
        success: function (loginResult) {

          wx.getUserInfo({
            success: function (userResult) {
              console.log('userResult:', userResult)
              app.globalData.hasLogin = true;
              userResult.userInfo.code = loginResult.code;
              app.globalData.userInfo = userResult.userInfo;
              that.getFirstPage();
            },
            fail: function (userError) {
              util.hideBusy();
              app.globalData.hasLogin = false;
              that.getFirstPage();
            },
          });
        },
        fail: function (loginError) {
          util.hideBusy();
          app.globalData.hasLogin = false;
          util.showFailModal('微信登陆失败，原因可能是首次登陆本门店，请关闭程序后重新扫描登陆。', loginError);
        },
        complete: function () {
        }
      });
    }
    else
      that.getFirstPage();
  },
  onReady: function () {
    // 页面渲染完成
  },
  onShow: function () {
    // 页面显示

  },
  onHide: function () {
    // 页面隐藏
  },
  onUnload: function () {
    // 页面关闭
  },
  onShareAppMessage: function () {
    return {
      title: app.globalData.aFendian.fendianmingcheng + '-' + app.globalData.aZhuozi.zhuozimingcheng,
      path: '/page/shop/shop?zhuoziid=' + app.globalData.zhuoziid
    }
  },
  getPhoneNumber: function (e) {
    var that = this
    if (!e.detail.encryptedData) return
    var tempdata = {
      zhuoziid: app.globalData.zhuoziid,
      iv: e.detail.iv,
      encryptedData: e.detail.encryptedData,
      userInfo: JSON.stringify(app.globalData.userInfo),
    };

    qcloud.request({
      url: config.service.getPhoneNumberUrl,
      hasLogin: app.globalData.hasLogin,
      data: tempdata,
      success(result) {
        if (result.statusCode == "200") {
          if (result.data.code == "200") {
            let ret = true;
            let msg = result.data.message;
            wx.showModal({
              title: '',
              content: msg,
              showCancel: false,
              complete: function (res) {
                if (ret) {
                  wx.switchTab({
                    url: '/page/my/my'
                  })
                }
              }
            })
            that.hideZhuce()
          }
          else {
            let ret = false;
            let msg = '出现异常，错误代码：' + result.data.code;
            wx.showModal({
              title: '订单处理结果：',
              content: msg,
              showCancel: false,
              complete: function (res) {
                if (ret) {
                  wx.switchTab({
                    url: '/page/my/my'
                  })
                }
                else {
                  util.navigateBack1;
                }
              }
            })
            //directret(false, '下单出现异常，请联系客服！' + '错误代码：' + result.data.code);
          }
        }
        else {
          let ret = false;
          let msg = '请求失败，' + '错误代码：' + result.statusCode;
          console.log(msg);
          console.log(result);
          wx.showModal({
            title: '订单处理结果：',
            content: msg,
            showCancel: false,
            complete: function (res) {
              if (ret) {
                wx.switchTab({
                  url: '/page/my/my'
                })
              }
              else {
                util.navigateBack1;
              }
            }
          })
        }
      },
      fail(error) {
        let ret = false;
        let msg = '请求失败' + error;
        wx.showModal({
          title: '订单处理结果：',
          content: msg,
          showCancel: false,
          complete: function (res) {
            if (ret) {
              wx.switchTab({
                url: '/page/my/my'
              })
            }
            else {
              util.navigateBack1;
            }
          }
        })
      }
    });
  }

})