// page/shop/index.js
var imageUtil = require('../../util/autoheight.js')
var util = require('../../util/util.js')
var qcloud = require('../../util/vendor/qcloud-weapp-client-sdk/index')
var config = require('../../config')
var app = getApp()
Page({
  data: {
    focus:false,
    fuwuNeirong:'',
    fuwuBeizhu:'',
    items: [
      { name: '餐巾纸', value: '餐巾纸' },
      { name: '茶水', value: '茶水' },      
      { name: '牙签', value: '牙签' },
      { name: '打包', value: '打包' },
      { name: '起菜', value: '起菜' },
      { name: '米饭', value: '米饭' },
      { name: '其他', value: '其他' },
    ]
  },
  radioChange: function (e) {
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    this.data.fuwuNeirong = e.detail.value
    if (e.detail.value == '其他')
    {
      this.setData({
        focus: true
      })
    }
  },
  bindback: function (event) {
    wx.navigateBack({
      delta: 1, // 回退前 delta(默认为1) 页面
      success: function (res) {
        console.log('返回ok')
      },
      fail: function () {
        console.log('返回fail')
      },
      complete: function () {
        // complete
      }
    })
  },
  charChange: function (e) {
    this.setData({
      fuwuBeizhu: e.detail.value
    });
  },
  bindsubmit: function (event) {
    var that = this
    var beizhu=''
    if (that.data.fuwuNeirong == '' && that.data.fuwuBeizhu =='')
    {
      util.showFailModal('发送内容不能为空')
      return;
    }
    if (that.data.fuwuBeizhu !='')
      beizhu = ' ' + that.data.fuwuBeizhu
    var fuwuContent = app.globalData.aZhuozi.zhuozimingcheng + '需要：' + that.data.fuwuNeirong + beizhu
    wx.showModal({
      title: '即将发商户处理：',
      content: fuwuContent,
      confirmText: "确定",
      cancelText: "取消",
      success: function (res) {
        console.log('that.fuwuContent:',fuwuContent);
        if (res.confirm) {
          var ret = true;
          var msg = '';
          var tempdata = {
            fuwuContent: fuwuContent,             
            zhuoziid: app.globalData.zhuoziid,
            hasLogin: app.globalData.hasLogin,
            userInfo: JSON.stringify(app.globalData.userInfo),             
          };
          util.showBusy;
          qcloud.request({
            url: config.service.fuwuyuanUrl,
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
              app.globalData.moshi = ''
              app.globalData.jiacaiDingdanno = ''
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
        } else {
          console.log('用户点击辅助操作')
        }
      },
      fail: function (error) {
        util.showFailModel('调用模式窗体失败', error);
      }
    });
  },
  onLoad: function (params) {
     
  },
  onReady: function () {
    wx.setNavigationBarTitle({
      title: app.globalData.aZhuozi.zhuozimingcheng +'-呼叫服务员'
    });
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
  }
})