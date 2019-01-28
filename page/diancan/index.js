/*----------------------------------------------------------------
    Copyright (C) 2019 筱程 wechatscan.com 
  
    文件名：diancan/index
    文件功能描述：点餐首页
    
----------------------------------------------------------------*/
/*import allmenu from '../../page/resources/json/menus.js'*/
var util = require('../../util/util.js')
var app = getApp()
var qcloud = require('../../util/vendor/qcloud-weapp-client-sdk/index');
var config = require('../../config');
var util = require('../../util/util.js');
var QQMapWX = require('../../util/qqmap-wx-jssdk.js');
var qqmapsdk;
//几个栏位错用 cai.fendianid 用于口味id cai.fendianmingcheng用于口味名称 
//fenlei.url用于分类数量累计
Page({
  data: {
    duration: 1200,
    toView: 'blue',
    menus: app.globalData.menus,
    selectedMenuId: 1,
    total: app.globalData.total,
    showGoodsDetail: false,
    goodsDetailUrl: '',
    goodsDetailName: '',
    goodsDetailMemo: '',
    goodsDetailSalePrice: 0.00,
    goodsDetailMenberPrice: 0.00,
    goodsDetailDanwei: '例',
    goodsDetailTuijian: 0,
    goodsDetailId: 0,
    goodsDetailMenuId: 0,
    animationData: {},
    hidAnim: true,
    X: 0,
    Y: 0,
    lastX: 0,
    lastY: 0,
    targetX: 200,
    targetY: 600,
    currGoods: null,
    selectedKouWeiMingCheng: '',
    canDiancan: true, //因地理位置限制 是否限制用户看本店菜单
    userDenyLocaltion: false, //用户拒绝地理位置授权，需要显示“重新获取地理位置”
    canDiancanChangjing: true,
    yincangShouquan: true, //隐藏用户授权
    aFendian: {},//分店对象
    aZhuozi: {},//桌子对象
    aKehu: {}//分店对象
  },
  selectMenu: function (event) {
    let data = event.currentTarget.dataset
    this.setData({
      toView: data.tag,
      selectedMenuId: data.id
    })
  },
  selectKouWei: function (event) {
    let data = event.currentTarget.dataset
    util.arrfind(util.arrfind(app.globalData.menus, this.data.currGoods.fenleiid).dishs, this.data.currGoods.id).fendianid = 0;
    util.arrfind(util.arrfind(app.globalData.menus, this.data.currGoods.fenleiid).dishs, this.data.currGoods.id).fendianmingcheng = data.name;
    this.setData({
      'menus': app.globalData.menus,
      currGoods: util.arrfind(util.arrfind(app.globalData.menus, this.data.currGoods.fenleiid).dishs, this.data.currGoods.id)
    })
  },
  addCount: function (event) {
    let data = event.currentTarget.dataset
    let menu = util.arrfind(this.data.menus, data.cid)
    let aDish = util.arrfind(menu.dishs, data.id)
    if (aDish != null && aDish.kouWeiList != null && aDish.fendianid > 0 && data.hide != 'true') {
      this.selectItem(event);
      return
    }
    if (menu.url == null) {
      menu.url = 0;
      util.arrfind(app.globalData.menus, data.cid).url = 0;
    }
    if (data.hide == 'true') {
      if (aDish != null && aDish.kouWeiList != null && aDish.fendianid > 0) {
        util.showFailModal('提示', '请选择口味或做法。');
        return
      }
      this.hideGoodsDetail();
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

    // 获取click事件Y坐标
    var tranX = event.touches[0].pageX - this.data.targetX;
    var tranY = event.touches[0].pageY - this.data.targetY;
    this.setData({
      menus: this.data.menus,
      total: this.data.total,
      hidAnim: true,
      X: event.touches[0].pageX - tranX,
      Y: event.touches[0].pageY - tranY
    })

    var aAnimation = wx.createAnimation({
      duration: 100,
      timingFunction: 'linear',
      delay: 0
    })
    this.animation = aAnimation

    //回来
    // setTimeout(function () {
    aAnimation.translate(tranX, tranY).step()
    this.setData({
      animationData: aAnimation.export()
    })
    //}.bind(this), 500);
    //下去
    this.setData({
      hidAnim: false
    })
    aAnimation = wx.createAnimation({
      duration: 3000,
      timingFunction: 'linear',
      delay: 0
    })
    this.animation = aAnimation
    setTimeout(function () {
      aAnimation.translate((-1) * tranX, (-1) * tranY).step()
      this.setData({
        animationData: aAnimation.export()
      })
    }.bind(this), 100);


    //记录本次位置，作为下次新位置
    this.data.lastX = event.touches[0].pageX;
    this.data.lastY = event.touches[0].pageY;
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
    this.setData({
      menus: this.data.menus,
      total: this.data.total
    })
  },
  selectItem: function (event) {
    let data = event.currentTarget.dataset
    let menu = util.arrfind(this.data.menus, data.cid)
    if (menu.url == null) {
      menu.url = 0;
      util.arrfind(app.globalData.menus, data.cid).url = 0;
    }
    let dish = util.arrfind(menu.dishs, data.id)

    this.setData({
      showGoodsDetail: true,
      goodsDetailUrl: dish.url,
      goodsDetailName: dish.caiming,
      goodsDetailMemo: dish.memo,
      goodsDetailSalePrice: dish.xiaoshoujia,
      goodsDetailMenberPrice: dish.huiyuanjia,
      goodsDetailDanwei: dish.danwei,
      goodsDetailTuijian: dish.tuijianzhishu,
      goodsDetailId: data.id,
      goodsDetailMenuId: data.cid,
      currGoods: dish
    })
  },
  hideGoodsDetail: function () {
    this.setData({
      showGoodsDetail: false
    });
  },
  showGoodsDetail: function () {
    this.setData({
      showGoodsDetail: true
    });
  },
  onShow: function () {
    this.setData({
      'menus': app.globalData.menus,
      'total': app.globalData.total
    });

    wx.setNavigationBarTitle({
      title: app.globalData.aFendian.fendianmingcheng + '-' + app.globalData.aZhuozi.zhuozimingcheng + app.globalData.moshi
    });
  },
  onReady: function () {
    /*    setTimeout(function () {
          util.hideBusy();
        }.bind(this), 2000);*/
  },
  onLoad: function (params) {
    util.showBusy('请稍候。。。');
    var that = this
    if (params.zhuoziid) {
      app.globalData.zhuoziid = params.zhuoziid
    }

    if (!app.globalData.hasLogin) {
      wx.login({
        success: function (loginResult) {
          wx.getUserInfo({
            success: function (userResult) {
              app.globalData.hasLogin = true;
              userResult.userInfo.code = loginResult.code;
              app.globalData.userInfo = userResult.userInfo;
              that.requestWrap();
            },
            fail: function (userError) {
              app.globalData.hasLogin = false;
              if (app.globalData.aFendian.zhifu){
                that.setData({
                  yincangShouquan: false
                });
              }
              that.requestWrap();
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
    else {
      that.requestWrap();
    }
  },
  onShareAppMessage: function () {
    return {
      title: app.globalData.aFendian.fendianmingcheng + '-' + app.globalData.aZhuozi.zhuozimingcheng,
      path: '/page/shop/shop?zhuoziid=' + app.globalData.zhuoziid
    }
  },
  dorequest: function () {
    var that = this
    //请求数据
    qcloud.request({
      url: config.service.getMenuUrl,
      hasLogin: app.globalData.hasLogin,
      data: {
        zhuoziid: app.globalData.zhuoziid,
        hasLogin: app.globalData.hasLogin,
        userInfo: JSON.stringify(app.globalData.userInfo),
        phonemodel: app.globalData.phonemodel,
        phonesystem: app.globalData.phonesystem,
        networkType: app.globalData.networkType,
        scene: app.globalData.scene
      },
      success: function (requestResult) {
        if (requestResult.statusCode == 200)
          if (requestResult.data.code == 200) {
            app.globalData.menus = requestResult.data.data;
            app.globalData.userInfo.openId = app.globalData.userInfo.openId  ? app.globalData.userInfo.openId: requestResult.data.openId;
            app.globalData.userInfo.session_key = app.globalData.userInfo.session_key ? app.globalData.userInfo.session_key : requestResult.data.session_key;
            app.globalData.aFendian = requestResult.data.aFendian;
            app.globalData.aZhuozi = requestResult.data.aZhuozi;
            app.globalData.aKehu = requestResult.data.aKehu;
            that.setData({
              'menus': app.globalData.menus,
              'total': app.globalData.total,
              aFendian: app.globalData.aFendian,
              aZhuozi: app.globalData.aZhuozi,
              aKehu: app.globalData.aKehu
            });
            wx.setNavigationBarTitle({
              title: app.globalData.aFendian.fendianmingcheng + '-' + app.globalData.aZhuozi.zhuozimingcheng + app.globalData.moshi
            });
            //获取位置数据
            console.log('app.globalData.aFendian.phonecity', app.globalData.aFendian.phonecity)
            if (app.globalData.aFendian.phonecity == '' || app.globalData.aFendian.phonecity == null
              || app.globalData.aFendian.phonecity == undefined) {
              qqmapsdk = new QQMapWX({
                key: 'PCLBZ-Q46LD-PO64S-PLAQW-ESMJF-RXBRZ'
              });
              // 调用接口
              wx.getLocation({
                type: 'gcj02',
                success: function (res) {
                  app.globalData.hasGeo = true
                  app.globalData.aFendian.lat = res.latitude
                  app.globalData.aFendian.lng = res.longitude
                  qqmapsdk.reverseGeocoder({
                    location: {
                      latitude: app.globalData.aFendian.lat,
                      longitude: app.globalData.aFendian.lng
                    },
                    success: function (res) {
                      app.globalData.hasGeo = true
                      if (res.status == 0) {
                        app.globalData.aFendian.phoneaddress = res.result.address
                        app.globalData.aFendian.phoneprovince = res.result.address_component.province
                        app.globalData.aFendian.phonecity = res.result.address_component.city
                        app.globalData.aFendian.phonedistrict = res.result.address_component.district
                        app.globalData.aFendian.phonestreet = res.result.address_component.street
                        app.globalData.aFendian.phonestreet_number = res.result.address_component.street_number
                      }
                      else {
                        app.globalData.aFendian.address = res.status
                      }
                    },
                    fail: function (res) {
                      console.log(res);
                    },
                    complete: function (res) {
                    }
                  });
                }
              });
            }
            util.hideBusy();
          }
          else {
            util.hideBusy();
            util.showFailModal('提示', requestResult.data.code + ':' + requestResult.data.message);
          }
        else {
          util.hideBusy();
          util.showFailModal('网络错误：', requestResult.data.message);
        }
      },
      fail: function (requestResult) {
        util.hideBusy();
        util.showFailModal('获取服务器数据失败。', requestResult);
      },
    });
  },
  requestWrap: function () {
    var that = this

    //判断是否在允许的范围内
    if (app.globalData.aFendian.keyongbanjing > 0 && app.globalData.aFendian.lat > 0 && app.globalData.aFendian.lng > 0) {
      //计算距离
      qqmapsdk = new QQMapWX({
        key: 'PCLBZ-Q46LD-PO64S-PLAQW-ESMJF-RXBRZ'
      });
      wx.getLocation({
        type: 'gcj02',
        success: function (res) {
          qqmapsdk.calculateDistance({
            mode: 'walking',
            to: [{
              latitude: app.globalData.aFendian.lat,
              longitude: app.globalData.aFendian.lng
            }],
            success: function (res) {
              if (res.status == 0) {
                if (res.result.elements[0].distance < app.globalData.aFendian.keyongbanjing) {
                  that.setData({
                    userDenyLocaltion: false,
                    canDiancan: true
                  })
                  that.dorequest()
                }
                else {
                  that.setData({
                    userDenyLocaltion: false,
                    canDiancan: false
                  })
                  util.hideBusy();
                }
              }
              else {
                that.setData({
                  userDenyLocaltion: false,
                  canDiancan: false
                })
                util.hideBusy();
              }
            },
            fail: function (res) {
              console.log('calculateDistance-fail', res);
              that.setData({
                userDenyLocaltion: false,
                canDiancan: false
              })
              util.hideBusy();
            },
            complete: function (res) {
            }
          });
        },
        fail: function (res) {
          util.hideBusy();
          console.log('wx.getLocation-fail', res);
          that.setData({
            userDenyLocaltion: true,
            canDiancan: false
          })
        }
      });
    }
    else
      this.dorequest()
  },

  reLocaltion: function () {
    var that = this
    //获取用户授权
    if (wx.getSetting) {
      wx.getSetting({
        success(res) {
          console.log(res);
          if (!res.authSetting['scope.userLocation']) {
            wx.openSetting({
              success: (res) => {
                res.authSetting = {
                  "scope.userLocation": true
                }
                that.requestWrap()
              }
            })
          }
        }
      });
    }
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
})