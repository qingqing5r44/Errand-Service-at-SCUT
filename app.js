//app.js
App({
  onLaunch: function () {
    //云开发环境初始化
    wx.cloud.init({
      env:"xxx", //use your personal cloud environment
    })
  },
  globalData:{
    orderlist_all:[],
    orderlist:[],
    orderlist_distance:[],
    orderlist_price:[],
    orderlist_time:[]
  }
})