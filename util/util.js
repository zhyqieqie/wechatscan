var app = getApp();
var qcloud = require('./vendor/qcloud-weapp-client-sdk/index');
var config = require('../config');
function currentTime() {
  var timestamp = Date.parse(new Date());
  timestamp = timestamp / 1000;

  //获取当前时间  
  var n = timestamp * 1000;
  var date = new Date(n);
  //年  
  var Y = date.getFullYear();
  //月  
  var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
  //日  
  var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  //时  
  var h = date.getHours();
  //分  
  var m = date.getMinutes();
  //秒  
  var s = date.getSeconds();

  return h + ":" + m
}

function currentDate() {
  var timestamp = Date.parse(new Date());
  timestamp = timestamp / 1000;

  //获取当前时间  
  var n = timestamp * 1000;
  var date = new Date(n);
  //年  
  var Y = date.getFullYear();
  //月  
  var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
  //日  
  var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  //时  
  var h = date.getHours();
  //分  
  var m = date.getMinutes();
  //秒  
  var s = date.getSeconds();

  return Y + "-" + M+ "-" + D
}

Array.prototype.find = function (func) {
  var temp = [];
  for (var i = 0; i < this.length; i++) {
    if (func(this[i])) {
      temp[temp.length] = this[i];
    }
  }
  return temp;
}

function arrfind(arr, item) {
  var temp = []
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].id == item)
      return arr[i]
  }
}

var getThisOrder = (menus) => {
  var returnmenus = []
  if (menus != null && menus.length > 0) {
    for (var i = 0; i < menus.length; i++) {
      var havemenu = false
      var amenu = menus[i]
      if (amenu != null && amenu.dishs != null && amenu.dishs != undefined && amenu.dishs.length > 0) {
        for (var j = 0; j < amenu.dishs.length; j++) {
          var adish = menus[i].dishs[j]
          if (adish.count > 0) {
            var tdish = new Object
            tdish.id = adish.id
            tdish.caiming = adish.caiming
            tdish.xiaoshoujia = adish.xiaoshoujia
            tdish.huiyuanjia = adish.huiyuanjia
            tdish.count = adish.count
            tdish.fendianid = adish.fendianid
            tdish.fendianmingcheng = adish.fendianmingcheng
            returnmenus.push(tdish)
          }
        }
      }
    }
  }
  return returnmenus
};

//必点菜
var judgeBidiancai = (menus) => {
  var ret = ''
  if (menus != null && menus.length > 0) {
    for (var i = 0; i < menus.length; i++) {
      var havemenu = false
      var amenu = menus[i]
      if (amenu != null && amenu.dishs != null && amenu.dishs != undefined && amenu.dishs.length > 0) {
        for (var j = 0; j < amenu.dishs.length; j++) {
          var adish = menus[i].dishs[j]
          if (adish.count > 0 && adish.count < adish.zuixiaoshuliang) {
            ret += adish.caiming + ' 起订量：' + adish.zuixiaoshuliang + adish.danwei
          }
        }
      }
    }
  }
  return ret
};

//是否点酒水或饮料
var judgeJiushuiyingliao = (menus) => {
  var ret = ''
  if (menus != null && menus.length > 0) {
    for (var i = 0; i < menus.length; i++) {
      var havemenu = false
      var amenu = menus[i]
      if (amenu != null && amenu.dishs != null && amenu.dishs != undefined && amenu.dishs.length > 0) {
        for (var j = 0; j < amenu.dishs.length; j++) {
          var adish = menus[i].dishs[j]
          if (adish.count > 0) {
            if (adish.fenleimingcheng.indexOf('酒水') > -1 || adish.fenleimingcheng.indexOf('饮料') > -1
              || adish.fenleimingcheng.indexOf('红酒') > -1 || adish.fenleimingcheng.indexOf('啤酒') > -1
              || adish.fenleimingcheng.indexOf('黄酒') > -1 || adish.fenleimingcheng.indexOf('白酒') > -1
              || adish.fenleimingcheng.indexOf('鲜榨') > -1 || adish.fenleimingcheng.indexOf('饮品') > -1) {
              ret += adish.caiming
            }
          }
        }
      }
    }
  }
  return ret
};
//按人数配置商品数量 如餐具 米饭
var ziDongTianJiaShangPin = (menus, renshu, leixing) => {
  var ret = new Object
  ret.count = 0
  ret.cash = 0.00
  renshu = parseFloat(renshu)
  if (menus != null && menus.length > 0) {
    for (var i = 0; i < menus.length; i++) {
      var amenu = menus[i]
      if (amenu != null && amenu.dishs != null && amenu.dishs != undefined && amenu.dishs.length > 0) {
        for (var j = 0; j < amenu.dishs.length; j++) {
          var adish = menus[i].dishs[j]
          if (adish.goumaileixing == leixing) {
            menus[i].url += (renshu - menus[i].dishs[j].count)
            ret.count += (renshu - menus[i].dishs[j].count)
            ret.cash += (renshu - menus[i].dishs[j].count) * menus[i].dishs[j].huiyuanjia
            menus[i].dishs[j].count = renshu
          }
        }
      }
    }
  }
  ret.menu = menus
  return ret
};

var resetMenu = (menus) => {
  if (menus != null && menus.length > 0) {
    for (var i = 0; i < menus.length; i++) {
      menus[i].url = 0
      var amenu = menus[i]
      if (amenu != null && amenu.dishs != null && amenu.dishs != undefined && amenu.dishs.length > 0) {
        for (var j = 0; j < menus[i].dishs.length; j++) {
          menus[i].dishs[j].count = 0
        }
      }
    }
  }
  return menus
};
// 显示繁忙提示
var showBusy = text => wx.showToast({
  title: text,
  icon: '处理中。。。',
  duration: 10000
});
var hideBusy = function () {
  wx.hideToast();
};
// 显示成功提示
var showSuccess = text => {
  wx.hideToast();
  wx.showToast({
    title: text,
    icon: 'success'
  });
};
// 显示失败提示
var showFailModal = (title, content) => {
  wx.hideToast();
  wx.showModal({
    title,
    content: JSON.stringify(content),
    showCancel: false
  });
};
var navigateBack1 = function () {
  wx.navigateBack({
    delta: 1, // 回退前 delta(默认为1) 页面
    success: function (res) {

    },
    fail: function () {
      // fail
    },
    complete: function () {
      // complete
    }
  })
};
module.exports = {
  currentDate: currentDate,
  currentTime: currentTime,
  arrfind: arrfind,
  showBusy: showBusy,
  hideBusy: hideBusy,
  showSuccess: showSuccess,
  showFailModal: showFailModal,
  getThisOrder: getThisOrder,
  judgeBidiancai: judgeBidiancai,
  judgeJiushuiyingliao: judgeJiushuiyingliao,
  resetMenu: resetMenu,
  navigateBack1: navigateBack1,
  ziDongTianJiaShangPin: ziDongTianJiaShangPin
}