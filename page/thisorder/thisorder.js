/*----------------------------------------------------------------
    Copyright (C) 2019 筱程 wechatscan.com 
  
    文件名：thisorder/index
    文件功能描述：点餐
    
----------------------------------------------------------------*/
var util = require('../../util/util.js')
var app = getApp()
var qcloud = require('../../util/vendor/qcloud-weapp-client-sdk/index');
var config = require('../../config');
var QQMapWX = require('../../util/qqmap-wx-jssdk.js');
var qqmapsdk;
Page({
  data: {
    menus: app.globalData.menus,
    total: app.globalData.total,
    kehuliuyan: '',
    leixingItems: [
      { name: '堂食', value: '堂食', checked: true },
      { name: '打包带走', value: '打包带走' },
      { name: '外卖', value: '外卖' }
    ],
    renshuArray: ['---', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '大于15人'],
    daoDianArray: ['已在店', '今天', '明天', '后天'],
    renshuIndex: 0, //人数
    daoDianIndex: 0,  //已在店 今天 明天 后天
    date: '2016-09-01',
    time: '---', //到店时间
    aLeixing: '堂食', //类型
    aWaiMaiDiZhi: '',
    aLianXiDianHua: '',
    aFendian: {},//分店对象
    aZhuozi: {},//桌子对象
    aKehu: {},//分店对象
    aYouhuiquan: {}, // 可用优惠券
    youhuiquanJine: 0 //优惠券可用金额
  },
  selectMenu: function (event) {
    let data = event.currentTarget.dataset
  },
  addCount: function (event) {
    let data = event.currentTarget.dataset
    let menu = util.arrfind(this.data.menus, data.cid)
    if (menu.url == null) {
      menu.url = 0
      util.arrfind(app.globalData.menus, data.cid).url = 0
    }
    menu.url += 1;
    util.arrfind(app.globalData.menus, data.cid).url += 1;
    let dish = util.arrfind(menu.dishs, data.id)
    dish.count += 1;
    this.data.total.count += 1
    this.data.total.money = (parseFloat(this.data.total.money) + parseFloat(dish.huiyuanjia)).toFixed(2)
    app.globalData.total.count += 1
    app.globalData.total.money = (parseFloat(app.globalData.total.money) + parseFloat(dish.huiyuanjia)).toFixed(2)
    util.arrfind(util.arrfind(app.globalData.menus, data.cid).dishs, data.id).count += 1;
    if (this.data.aYouhuiquan && this.data.aYouhuiquan.zuidixiaofei <= this.data.total.money) {
      this.data.youhuiquanJine = this.data.aYouhuiquan.jine
    }
    else {
      this.data.youhuiquanJine = 0
    }
    this.setData({
      menus: this.data.menus,
      total: this.data.total,
      youhuiquanJine: this.data.youhuiquanJine
    })
  },
  minusCount: function (event) {
    let data = event.currentTarget.dataset
    let menu = util.arrfind(this.data.menus, data.cid)
    menu.url = menu.url - 1;
    util.arrfind(app.globalData.menus, data.cid).url -= 1;
    let dish = util.arrfind(menu.dishs, data.id)
    if (dish.count <= 0)
      return
    dish.count -= 1;
    this.data.total.count -= 1
    this.data.total.money = (this.data.total.money - dish.huiyuanjia).toFixed(2)
    app.globalData.total.count -= 1
    app.globalData.total.money = (app.globalData.total.money - dish.huiyuanjia).toFixed(2)
    util.arrfind(util.arrfind(app.globalData.menus, data.cid).dishs, data.id).count -= 1;
    if (this.data.aYouhuiquan && this.data.aYouhuiquan.zuidixiaofei <= this.data.total.money) {
      this.data.youhuiquanJine = this.data.aYouhuiquan.jine
    }
    else {
      this.data.youhuiquanJine = 0
    }
    this.setData({
      menus: this.data.menus,
      total: this.data.total,
      youhuiquanJine: this.data.youhuiquanJine
    })
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
  bindsubmit: function (event) {
    var that = this
    //判断是否有最小销售数量不满足情况
    var judgeBidiancai = util.judgeBidiancai(app.globalData.menus);
    if (judgeBidiancai != '') {
      util.showFailModal('下单限制：', judgeBidiancai)
      return;
    }
    //强制选人数
    if (app.globalData.aFendian.qiangzhixuanrenshu && (that.data.renshuIndex <= 0 || that.data.renshuIndex > 14)) {
      util.showFailModal('提示', '请选择人数')
      return;
    }
    //开通支付，必须允许授权
    if (app.globalData.aFendian.zhifu && app.globalData.hasLogin == false) {
      util.navigateBack1();
      util.showFailModal('提示', '根据微信要求，订单支付时，本系统需要获得用户授权许可。请点击登录，并允许授权，谢谢配合。')
      return;
    }
    var tmemo = this.data.kehuliuyan;
    wx.showModal({
      title: '订单即将发商户处理：',
      content: '是否提交?',
      confirmText: "提交",
      cancelText: "取消",
      success: function (res) {
        if (res.confirm) {
          var ret = true;
          var msg = '';
          var tempdata = {
            memo: tmemo,
            order: JSON.stringify(util.getThisOrder(app.globalData.menus)),
            zhuoziid: app.globalData.zhuoziid,
            hasLogin: app.globalData.hasLogin,
            userInfo: JSON.stringify(app.globalData.userInfo),

            hasGeo: app.globalData.hasGeo,
            lat: app.globalData.aFendian.lat,
            lng: app.globalData.aFendian.lng,
            phoneaddress: app.globalData.aFendian.phoneaddress,
            phoneprovince: app.globalData.aFendian.phoneprovince,
            phonecity: app.globalData.aFendian.phonecity,
            phonedistrict: app.globalData.aFendian.phonedistrict,
            phonestreet: app.globalData.aFendian.phonestreet,
            phonestreet_number: app.globalData.aFendian.phonestreet_number,

            jiacaiDingdanno: app.globalData.jiacaiDingdanno,
            dingDanLeiXing: that.data.aLeixing,
            renShu: that.data.renshuArray[that.data.renshuIndex],
            daoDianShiJian: that.data.daoDianIndex == 0 ? '' : that.data.daoDianArray[that.data.daoDianIndex] + '-' + that.data.time,
            waiMaiDiZhi: that.data.aWaiMaiDiZhi,
            lianXiDianHua: that.data.aLianXiDianHua,
            youhuiquan: that.data.youhuiquanJine > 0 ? JSON.stringify(that.data.aYouhuiquan) : ''
          };
          util.showBusy('请稍候。。。');
          qcloud.request({
            url: config.service.submitOrderUrl,
            hasLogin: app.globalData.hasLogin,
            data: tempdata,
            success(result) {
              that.setData({
                aYouhuiquan: {}, // 可用优惠券
                youhuiquanJine: 0
              })
              util.hideBusy();
              if (result.statusCode == "200") {
                var aPrepay = result.data.prepay
                app.globalData.userInfo.openId = app.globalData.userInfo.openId ? app.globalData.userInfo.openId : result.data.openId;
                app.globalData.userInfo.session_key = app.globalData.userInfo.session_key ? app.globalData.userInfo.session_key : result.data.session_key;
                if (aPrepay.code == "200") {//不需要在线支付
                  let msg = aPrepay.message;
                  app.globalData.total.count = 0;
                  app.globalData.total.money = 0;
                  app.globalData.dingdanno = aPrepay.dingdanno;
                  app.globalData.menus = util.resetMenu(app.globalData.menus);
                  wx.showModal({
                    title: '订单处理结果：',
                    content: msg,
                    showCancel: false,
                    complete: function (res) {
                      wx.switchTab({
                        url: '/page/my/my'
                      })
                    }
                  })
                }
                else if (aPrepay.code == "300") {//通过余额支付
                  let msg = aPrepay.message;
                  app.globalData.total.count = 0;
                  app.globalData.total.money = 0;
                  app.globalData.dingdanno = aPrepay.dingdanno;
                  app.globalData.menus = util.resetMenu(app.globalData.menus);
                  wx.showModal({
                    title: '订单处理结果：',
                    content: msg,
                    showCancel: false,
                    complete: function (res) {
                      wx.switchTab({
                        url: '/page/my/my'
                      })
                    }
                  })
                }
                else if (aPrepay.code == "400") {//通过在线支付
                  let msg = aPrepay.message;
                  app.globalData.total.count = 0;
                  app.globalData.total.money = 0;
                  app.globalData.dingdanno = aPrepay.dingdanno;
                  app.globalData.menus = util.resetMenu(app.globalData.menus);
                  wx.requestPayment({
                    'timeStamp': aPrepay.timeStamp,
                    'nonceStr': aPrepay.nonceStr,
                    'package': aPrepay.package,
                    'signType': aPrepay.signType,
                    'paySign': aPrepay.paySign,
                    'success': function (res) {
                      wx.showModal({
                        title: '订单处理结果：',
                        content: res,
                        showCancel: false,
                        complete: function (res) {
                          wx.switchTab({
                            url: '/page/my/my'
                          })
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
                  let msg = '下单出现异常，错误代码：' + aPrepay.code;
                  wx.showModal({
                    title: '订单处理结果：',
                    content: msg,
                    showCancel: false,
                    complete: function (res) {
                      wx.switchTab({
                        url: '/page/my/my'
                      })
                    }
                  })
                }
              }
              else {
                let ret = false;
                let msg = '请求失败，' + '错误代码：' + result.statusCode;
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
                      util.navigateBack1();
                    }
                  }
                })
              }
              app.globalData.moshi = ''
              app.globalData.jiacaiDingdanno = ''
            },
            fail(error) {
              util.hideBusy();
              console.log('error:', error)
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
                    util.navigateBack1();
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
  onShow: function () {
    this.setData({
      'menus': app.globalData.menus,
      'total': app.globalData.total,
      time: util.currentTime(),
      aFendian: app.globalData.aFendian,
      aZhuozi: app.globalData.aZhuozi,
      aKehu: app.globalData.aKehu
    });
    wx.setNavigationBarTitle({
      title: '确认订单' + app.globalData.moshi
    });
    //提醒未点酒水 堂食非加菜模式提醒
    if (app.globalData.aFendian.tishixuanjiushui == true) {
      var judgeJiushuiyingliao = util.judgeJiushuiyingliao(app.globalData.menus);
      if (judgeJiushuiyingliao == '' && app.globalData.moshi == '' && this.data.aLeixing == '堂食') {
        wx.showModal({
          title: '提示：',
          content: '您没有点酒水或饮料，需要吗？',
          confirmText: "去点酒水",
          cancelText: "不要",
          complete: function (res) {
            if (res.confirm) {
              console.log('您没有点酒水或饮料，需要吗？', res)
              wx.navigateBack({
                delta: 1
              })
            }
          }
        })
        return;
      }
    }
    //获取可用优惠券id
    var that = this
    qcloud.request({
      url: config.service.keyongYouhuiquanUrl,
      hasLogin: app.globalData.hasLogin,
      data: {
        zhuoziid: app.globalData.zhuoziid,
        hasLogin: app.globalData.hasLogin,
        userInfo: JSON.stringify(app.globalData.userInfo)
      },
      success: function (requestResult) {
        if (requestResult.data.code == '200') {
          if (requestResult.data.aYouhuiquan && requestResult.data.aYouhuiquan.zuidixiaofei <= that.data.total.money) {
            that.setData({
              aYouhuiquan: requestResult.data.aYouhuiquan,
              youhuiquanJine: requestResult.data.aYouhuiquan.jine
            });
          }
          else {
            that.setData({
              youhuiquanJine: 0
            });
          }
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
    });
  },
  onReady: function () {
    wx.setNavigationBarTitle({
      title: '确认订单' + app.globalData.moshi
    }
    )
    /*setTimeout(function () {
      util.hideBusy();
    }.bind(this), 1000);*/
    //桌子名称 含外卖 外送，自动切换外卖模式
    if (app.globalData.aZhuozi.zhuozimingcheng.indexOf('外卖') > -1 || app.globalData.aZhuozi.zhuozimingcheng.indexOf('外送') > -1) {
      var tLeiXingItems = this.data.leixingItems
      tLeiXingItems[2].checked = true
      this.setData({
        leixingItems: tLeiXingItems,
        aLeixing: '外卖',
      });
      this.setAdd()
    }
    util.hideBusy();
  },
  onShareAppMessage: function () {
    return {
      title: app.globalData.aFendian.fendianmingcheng + '-' + app.globalData.aZhuozi.zhuozimingcheng,
      path: '/page/shop/shop?zhuoziid=' + app.globalData.zhuoziid
    }
  },
  bindRenshuChange: function (e) {
    this.setData({
      renshuIndex: e.detail.value
    })
    //堂食 非加菜模式 根据人数增加商品数
    if (app.globalData.moshi == '' && this.data.aLeixing == '堂食') {
      if (e.detail.value > 0 && e.detail.value < 14) {
        var ret = util.ziDongTianJiaShangPin(app.globalData.menus, this.data.renshuArray[e.detail.value], '堂食按人数')
        app.globalData.menus = ret.menu
        app.globalData.total.count = parseFloat(app.globalData.total.count * 1 + ret.count)
        app.globalData.total.money = parseFloat((app.globalData.total.money * 100 + ret.cash * 100) / 100)
        this.setData({
          'menus': app.globalData.menus,
          'total': app.globalData.total
        });
      }
    }
  },
  bindDateChange: function (e) {
    this.setData({
      date: e.detail.value
    })
  },
  bindTimeChange: function (e) {
    this.setData({
      time: e.detail.value
    })
  },
  radioChange: function (e) {
    this.setData({
      aLeixing: e.detail.value
    })
    this.setAdd()
  },
  bindDaoDianChange: function (e) {
    this.setData({
      daoDianIndex: e.detail.value
    })
  },
  bindMemoblur: function (e) {
    this.setData({
      kehuliuyan: e.detail.value
    })
  },
  bindWaiMaiDiZhiblur: function (e) {
    this.setData({
      aWaiMaiDiZhi: e.detail.value
    })
  },
  bindLianXiDianHuablur: function (e) {
    this.setData({
      aLianXiDianHua: e.detail.value
    })
  },
  setAdd: function () {
    var that = this
    if (this.data.aLeixing.indexOf('外卖') > -1 || this.data.aLeixing.indexOf('外送') > -1) {
      if (((app.globalData.aKehu && app.globalData.aKehu.dianhua))) {
        that.setData({
          aLianXiDianHua: app.globalData.aKehu.dianhua
        });
      }

      qqmapsdk = new QQMapWX({
        key: 'PCLBZ-Q46LD-PO64S-PLAQW-ESMJF-RXBRZ'
      });
      wx.getLocation({
        type: 'gcj02',
        success: function (res) {
          qqmapsdk.reverseGeocoder({
            location: {
              latitude: res.latitude,
              longitude: res.longitude
            },
            success: function (resp) {
              console.log(' qqmapsdk.reverseGeocoder sucess:', resp);
              if (resp.status == 0) {
                that.setData({
                  aWaiMaiDiZhi: resp.result.address_reference.landmark_l2.title
                })
              }
            },
            fail: function (resp) {
              console.log('qqmapsdk.reverseGeocoder fail:', resp);
            },
            complete: function (resp) {
              console.log('qqmapsdk.reverseGeocoder complete:', resp);
            }
          });
        },
        fail: function (res) {
          console.log('wx.getLocation fail:', res);
        },
        complete: function (res) {
          console.log('wx.getLocation complete:', res);
        }
      });
    }
  },

})