var util = require('../../util/util.js')
var qcloud = require('../../util/vendor/qcloud-weapp-client-sdk/index');
var config = require('../../config');
var app = getApp()
Page({
  data: {
    userInfo: {},
    orderList: {},
    aKehu: {},
    yincangXiaofeiJilu: true,
    yincangChongzhi: true,
    yincangHuiyuanLeibie: true,
    yincangShouquan: true, //隐藏用户授权
    yincangYouhuiquan: true, //优惠券
    xiaofeijiluList: {},
    youhuiquanList: {},
    youhuiquan1List: [],
    youhuiquan2List: [],
    youhuiquan3List: [],
    chongzhizengsongList: {},
    huiyuanleibieList: {},
    chongzhiLeixingId: 0,  // 选择要充值的栏位
    chongzhizengsongItems: [] ,
    huiyuanleibieId: 0,  // 选择要充值的栏位
    huiyuanleibieItems: [],
    yincangZhuce: true, //隐藏注册窗体
    selectedLeixing:'未使用',
    aFendian: {}, //分店对象
    firstShow:true
  },
  refreshDate: function (event) {
    util.showBusy('请稍候。。。');
    var that = this
    //如果没有登陆，那么再登陆一次
    if (app.globalData.hasLogin == false) {
      if (app.globalData.aFendian.zhifu) {
        that.setData({
          yincangShouquan: false
        });
      }
    }
    qcloud.request({
      url: config.service.getOrderUrl,
      hasLogin: app.globalData.hasLogin,
      data: {
        hasLogin: app.globalData.hasLogin,
        dingdanno: app.globalData.dingdanno,
        userInfo: JSON.stringify(app.globalData.userInfo),
        zhuoziid: app.globalData.zhuoziid,
      },
      success: function (requestResult) {
        if (requestResult.data.code == '200') {
          app.globalData.userInfo.openId = app.globalData.userInfo.openId ? app.globalData.userInfo.openId : requestResult.data.openId;
          app.globalData.userInfo.session_key = app.globalData.userInfo.session_key ? app.globalData.userInfo.session_key : requestResult.data.session_key;
          that.setData({
            'orderList': requestResult.data.data,
            userInfo: app.globalData.userInfo,
            xiaofeijiluList: requestResult.data.xiaofeijiluList,
            chongzhizengsongList: requestResult.data.chongzhizengsongList,
            huiyuanleibieList: requestResult.data.huiyuanleibieList,
            'aKehu': requestResult.data.aKehu,
            youhuiquanList: requestResult.data.youhuiquanList,
          });
          //优惠券 分类 
          if (requestResult.data.youhuiquanList){
            that.data.youhuiquan1List = []
            that.data.youhuiquan2List = []
            that.data.youhuiquan3List = []
            for (var i = 0; i < requestResult.data.youhuiquanList.length; i++)
            {              
              if (requestResult.data.youhuiquanList[i].shiyongshijian)
              {
                that.data.youhuiquan2List.push(requestResult.data.youhuiquanList[i])
              }
              else if (requestResult.data.youhuiquanList[i].jieshuriqi > util.currentDate())
              {
                that.data.youhuiquan1List.push(requestResult.data.youhuiquanList[i])
              }
              else{
                that.data.youhuiquan3List.push(requestResult.data.youhuiquanList[i])
              }
            }
            that.setData({
              youhuiquan1List: that.data.youhuiquan1List,
              youhuiquan2List: that.data.youhuiquan2List,
              youhuiquan3List: that.data.youhuiquan3List,
            });
          }
           //若没有注册电话，显示注册窗口
          if (app.globalData.aFendian.zhifu && (!(requestResult.data.aKehu && requestResult.data.aKehu.dianhua)) && app.globalData.userInfo && app.globalData.userInfo.openId && wx.canIUse('button.open-type.getPhoneNumber')) {
            that.setData({
              yincangZhuce: false
            });
          }
          //若第一次显示页面，可以自动显示优惠券，有号码才有优惠券
          if (requestResult.data.aKehu && requestResult.data.aKehu.dianhua && that.data.firstShow && that.data.youhuiquan1List && that.data.youhuiquan1List.length>0){
            that.setData({
              yincangYouhuiquan: false,
              firstShow: false
            });
          }
          if (requestResult.data.chongzhizengsongList) {
            var temp = []
            for (var i = 0; i < requestResult.data.chongzhizengsongList.length; i++) {
              if (requestResult.data.chongzhizengsongList[i].leibiemingcheng) {
                var chongzhizengsong = new Object
                chongzhizengsong.name = requestResult.data.chongzhizengsongList[i].leibiemingcheng
                chongzhizengsong.value = requestResult.data.chongzhizengsongList[i].id
                if (i == 0)
                {
                  that.data.chongzhiLeixingId = chongzhizengsong.value
                  chongzhizengsong.checked = true
                }
                temp.push(chongzhizengsong)
              }
            }
            that.setData({
              chongzhizengsongItems: temp
            })
          }
          if (requestResult.data.huiyuanleibieList) {
            var temp = []
            
            for (var i = 0; i < requestResult.data.huiyuanleibieList.length; i++) {
              if (requestResult.data.huiyuanleibieList[i].leibiemingcheng) {
                var ss = parseFloat(requestResult.data.huiyuanleibieList[i].shangxian) < 1000 ? "(< ￥ ": "(<￥"
                var huiyuanleibie = new Object
                huiyuanleibie.name = requestResult.data.huiyuanleibieList[i].leibiemingcheng  
                  + ss
                 + requestResult.data.huiyuanleibieList[i].shangxian + ")  " + 
                 requestResult.data.huiyuanleibieList[i].zhekou+"折"
                huiyuanleibie.value = requestResult.data.huiyuanleibieList[i].id
                if (requestResult.data.aKehu && requestResult.data.aKehu.leibieid && huiyuanleibie.value == requestResult.data.aKehu.leibieid)
                  huiyuanleibie.checked = true
                temp.push(huiyuanleibie)
              }
            }
            that.setData({
              huiyuanleibieItems: temp
            })
          }
        }
        else {
          util.showFailModal('处理结果', '请求失败，请稍候再试。' + requestResult);
        }
        util.hideBusy();
      },
      fail: function (requestResult) {
        util.hideBusy();
        util.showFailModal('处理结果', '请求失败，请稍候再试。' + requestResult);
      },
      complete: function () {
        wx.stopPullDownRefresh();
      }
    });
  },
  CancelItem: function (event) {
    var that = this
    let data = event.currentTarget.dataset
    console.log('app.globalData.userInfo', app.globalData.userInfo)
    wx.showModal({
      title: '是否取消？',
      content: '是否取消"' + data.name + '"?',
      confirmText: "取消该项",
      cancelText: "保留该项",
      success: function (res) {
        if (res.confirm) {
          qcloud.request({
            url: config.service.CancelItemUrl,
            data: {
              id: data.id,
              hasLogin: app.globalData.hasLogin,
              dingdanno: app.globalData.dingdanno,
              userInfo: JSON.stringify(app.globalData.userInfo)
            },
            success: function (requestResult) {
              if (requestResult.data.code == '200') {
                console.log('requestResult.data');
                console.log(requestResult.data);
                that.refreshDate();
              }
              else {
                util.showFailModal('处理结果', requestResult.data.code + ':' + requestResult.data.message);
              }
            },
            fail: function (requestResult) {
              util.showFailModal('处理结果', '请求失败，请稍候再试。' + requestResult);
            },
            complete: wx.stopPullDownRefresh()
          });
        }
      },
      fail: function (error) {
        util.showFailModel('调用模式窗体失败', error);
      }
    });
  },
  jiaCai: function (event) {
    var that = this
    let data = event.currentTarget.dataset
    console.log('app.globalData.userInfo', app.globalData.userInfo)
    app.globalData.moshi = '（加菜）'
    app.globalData.jiacaiDingdanno = data.id
    wx.switchTab({
      url: '/page/diancan/index'
    })
  },

  onLoad: function () {
    wx.setNavigationBarTitle({
      title: app.globalData.aFendian.fendianmingcheng + '-' + '下单记录'
    });
  },
  onPullDownRefresh() {
    this.refreshDate();
  },
  onShow: function () {
    console.log('aFendian:', app.globalData.aFendian)
    this.setData({
      aFendian: app.globalData.aFendian
    });
    this.refreshDate();
  },
  onShareAppMessage: function () {
    return {
      title: app.globalData.aFendian.fendianmingcheng + '-' + app.globalData.aZhuozi.zhuozimingcheng,
      path: '/page/shop/shop?zhuoziid=' + app.globalData.zhuoziid
    }
  },

  hideXiaofeiJilu: function () {
    this.setData({
      yincangXiaofeiJilu: true
    });
  },
  showXiaofeiJilu: function () {
    this.setData({
      yincangXiaofeiJilu: false
    });
  },

  hideYouhuiquan: function () {
    this.setData({
      yincangYouhuiquan: true
    });
  },
  showYouhuiquan: function () {
    this.setData({
      yincangYouhuiquan: false
    });
  },

  hideChongzhi: function () {
    this.setData({
      yincangChongzhi: true
    });
  },
  showChongzhi: function () {
    this.setData({
      yincangChongzhi: false
    });
  },

  hideHuiyuanLeibie: function () {
    this.setData({
      yincangHuiyuanLeibie: true
    });
  },
  showHuiyuanLeibie: function () {
    this.setData({
      yincangHuiyuanLeibie: false
    });
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
  radioChange: function (e) {
    var radioItems = this.data.chongzhizengsongItems;
    for (var i = 0, len = radioItems.length; i < len; ++i) {
      radioItems[i].checked = radioItems[i].value == e.detail.value;
      if (radioItems[i].checked)
        this.setData({
          chongzhiLeixingId: radioItems[i].value
        });
    }
    this.setData({
      chongzhizengsongItems: radioItems
    });
  },
  reAuthor: function () {
    var that = this
    //获取用户授权
    if (wx.getSetting) {
      wx.getSetting({
        success(res) {
          console.log(res);
          if (!res.authSetting['scope.userInfo']) {
            wx.openSetting({
              success: (res) => {
                res.authSetting = {
                  "scope.userInfo": true
                }
                if (!app.globalData.hasLogin) {
                  wx.login({
                    success: function (loginResult) {
                      wx.getUserInfo({
                        success: function (userResult) {
                          app.globalData.hasLogin = true;
                          userResult.userInfo.code = loginResult.code;
                          app.globalData.userInfo = userResult.userInfo;
                          that.setData({
                            yincangShouquan: true
                          });
                          that.refreshDate();
                        },
                        fail: function (userError) {
                          app.globalData.hasLogin = false;
                          if (app.globalData.aFendian.zhifu) {
                            that.setData({
                              yincangShouquan: false
                            });
                          }
                        },
                      });
                    },
                    fail: function (loginError) {
                      app.globalData.hasLogin = false;
                      if (app.globalData.aFendian.zhifu) {
                        that.setData({
                          yincangShouquan: false
                        });
                      }
                      util.showFailModal('微信登陆失败，原因可能是首次登陆本门店，请关闭程序后重新扫描登陆。', loginError);
                    },
                    complete: function () {
                    }
                  });
                }
              }
            })
          }
        }
      });
    }
  },
  chongzhi: function () {
    var that = this
    if (!app.globalData.aFendian.zhifu) {
      util.showFailModal('提示', '本店未开通支付功能。')
      return;
    }
    if (!(app.globalData.aKehu && app.globalData.aKehu.dianhua)) {
      util.showFailModal('提示', '请注册为会员后充值。')
      return;
    }
    //开通支付，必须允许授权
    if (app.globalData.hasLogin == false || !app.globalData.userInfo.openId) {
      util.showFailModal('提示', '根据微信要求，订单支付时，本系统需要获得用户授权许可。请点击登录，并允许授权，谢谢配合。')
      return;
    }
    if (this.data.chongzhiLeixingId == 0) {
      util.showFailModal('提示', '未找到充值类型，请退出后重试。')
      return;
    }
    //发起充值 
    qcloud.request({
      url: config.service.chongzhiUrl,
      hasLogin: app.globalData.hasLogin,
      data: {
        chongzhiLeixingId: this.data.chongzhiLeixingId,
        userInfo: JSON.stringify(app.globalData.userInfo),
      },
      success: function (requestResult) {
        if (requestResult.statusCode == 200) {
          console.log('requestResult.data.prepay', requestResult.data.prepay)
          var aPrepay = requestResult.data.prepay
          if (aPrepay.code == 6000) {
            wx.requestPayment({
              'timeStamp': aPrepay.timeStamp,
              'nonceStr': aPrepay.nonceStr,
              'package': aPrepay.package,
              'signType': aPrepay.signType,
              'paySign': aPrepay.paySign,
              'success': function (res) {
                console.log('wx.requestPayment success', res);
                wx.showModal({
                  title: '订单处理结果：',
                  content: '充值成功',
                  showCancel: false,
                  complete: function (res) {
                    that.refreshDate()
                    that.setData({
                      'aKehu': that.aKehu
                    });
                  }
                })
              },
              'fail': function (res) {
                console.log('wx.requestPayment fail', res)
                util.navigateBack1();
              }
            });
          }
          else {
            util.hideBusy();
            util.showFailModal('提示', aPrepay.code + ':' + aPrepay.message);
          }
        }
        else {
          util.hideBusy();
          util.showFailModal('网络错误：', requestResult.statusCode);
        }
        console.log('successsuccesssuccess');
        that.hideChongzhi()
      },
      fail: function (requestResult) {
        console.log('failfailfailfail');
        that.hideChongzhi()
        util.hideBusy();
        util.showFailModal('获取服务器数据失败。', requestResult);
      }
    });
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
                that.hideZhuce()
                that.refreshDate();
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
          that.refreshDate()
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
  },
  //选择 未使用 已使用 已过期
  selectLeixing: function (event) {
    let data = event.currentTarget.dataset
    if (data.id =='未使用')
    {
      this.data.youhuiquanList = this.data.youhuiquan1List
    }
    else if (data.id == '已使用') {
      this.data.youhuiquanList = this.data.youhuiquan2List
    }
    else if (data.id == '已过期') {
      this.data.youhuiquanList = this.data.youhuiquan3List
    }
    this.setData({
      youhuiquanList: this.data.youhuiquanList,
      selectedLeixing: data.id
    })
  }
})
