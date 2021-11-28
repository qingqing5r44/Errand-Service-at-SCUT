// pages/new_order/new_order.js
const db = wx.cloud.database();
const user_list=wx.cloud.database().collection("user")
const order_list=wx.cloud.database().collection("order")
var dateTimePicker = require('../../utils/dateTimePicker.js');

Page({

  /*  *
   * 页面的初始数据
   */
  data: {
    /**设置时间相关参数 */
    date: '2020-12-01',
    time: '12:00',
    dateTimeArray: null,
    dateTime: null,
    dateTimeArray1: null,
    dateTime1: null,
    startYear: 2000,
    endYear: 2050,
    upload: false,
    //order信息
    price:0,
    fetchlocation:{},
    sendlocation:{},
  },
  onChange({ detail }) {
    // 需要手动对 checked 状态进行更新
    this.setData({ 
      checked: detail 
      });
  },
  getLocation_start:function(){
    var _this = this;
    wx.chooseLocation({
      success: function (res) {
        _this.setData({
          fetchlocation:res
        })
      }
    })
  },
  getLocation_end:function(){
    var _this = this;
    wx.chooseLocation({
      success: function (res) {
        _this.setData({
          sendlocation:res
        })
      }
    })

  },
  //提交按钮  上传数据
  onSubmit: function(e) {
    var _this=this;
    //异常数据检查
    if(e.detail.value.text==""||e.detail.value.price==""||_this.data.sendlocation=={}||_this.data.sendlocation=={}){
      wx.showToast({
        title: '订单信息不完整',  // 标题
        icon: 'fail',   // 图标类型，默认success
        duration: 1000   // 提示窗停留时间，默认1500ms
      })
    }
    else{
    if (this.data.upload) {
      var _this = this;
      var text = e.detail.value.text;
      //console.log(e.detail.value)
      wx.showLoading({
        title: '正在上传',
        duration: 2000
      })
      //调用云函数，检测输入内容是否符合规定
      wx.cloud.callFunction({
        name: 'safeText',
        data: {
          text: text ? text : '1'
        },
        success: function(res) {
          //如果符合规定，就进行上传
          if (res.result.msgR.errMsg == 'openapi.security.msgSecCheck:ok') {
            _this.setData({
              price:e.detail.value.price
            })
            //获取用户openid 
            wx.cloud.callFunction({
              name: 'login',
              success: function(res) {
                var openid = res.result.openid;
                //添加新订单
                wx.cloud.callFunction({
                  name: 'order_func',
                  data: {
                    type: "insert",  
                    new_order:{
                      order_receiver_openid:openid,
                      order_taker_openid:null,
                      start_position:{
                        lo:_this.data.fetchlocation.longitude,
                        la:_this.data.fetchlocation.latitude,
                        name:_this.data.fetchlocation.name,
                        address:_this.data.fetchlocation.address,
                      },
                      end_position:{
                        lo:_this.data.sendlocation.longitude,
                        la:_this.data.sendlocation.latitude,
                        name:_this.data.sendlocation.name,
                        address:_this.data.sendlocation.address,             
                      },
                      price:parseInt(e.detail.value.price),
                      order_details:text,
                      score:5,
                      state:1,
                      start_time:_this.get_currtime(),
                      end_time:_this.get_endtime()
                    } 
                  },
                  success: function(res) {
                    wx.showToast({
                      title: '添加订单成功',  // 标题
                      icon: 'success',   // 图标类型，默认success
                      duration: 1000   // 提示窗停留时间，默认1500ms
                    })
                    wx.switchTab({
                      url: '../home/home',
                    })
                  },
                  fail:function(res){
                    wx.showToast({
                      title: '添加订单失败',  // 标题
                      icon: 'fail',   // 图标类型，默认success
                      duration: 1000   // 提示窗停留时间，默认1500ms
                    })
                  }
                })
              }
            })
          }
          //如果存在敏感词汇，则无法上传
          else {
            wx.showModal({
              title: '警告',
              content: '您发布的内容不符合规定，请重新输入！',
            })
          }
        },
        fail: function(err) {
          console.log(err)
        }
      })
    } else {
      wx.showModal({
        title: '警告',
        content: '请先登陆再进行发表！',
      })
    }
  }
  },
  get_currtime(){
    var date= new Date();
    var curr_time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()+' '+date.getHours()+':'+date.getMinutes()
    return curr_time
  },
  get_endtime(){
    var _this=this
    return _this.data.dateTimeArray1[0][_this.data.dateTime1[0]].toString()+'-'+_this.data.dateTimeArray1[1][_this.data.dateTime1[1]].toString()+'-'+_this.data.dateTimeArray1[2][_this.data.dateTime1[2]].toString()+' '+_this.data.dateTimeArray1[3][_this.data.dateTime1[3]].toString()+':'+_this.data.dateTimeArray1[4][_this.data.dateTime1[4]].toString()
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    /**时间 */
    // 获取完整的年月日 时分秒，以及默认显示的数组
    var that = this;
    var obj = dateTimePicker.dateTimePicker(this.data.startYear, this.data.endYear);
    var obj1 = dateTimePicker.dateTimePicker(this.data.startYear, this.data.endYear);
    // 精确到分的处理，将数组的秒去掉
    var lastArray = obj1.dateTimeArray.pop();
    var lastTime = obj1.dateTime.pop();
    that.setData({
      dateTime: obj.dateTime,
      dateTimeArray: obj.dateTimeArray,
      dateTimeArray1: obj1.dateTimeArray,
      dateTime1: obj1.dateTime
    });
    //检查数据库是否有该用户信息，若没有则进行获取并存储
    var that = this;
    //通过云函数获取openid
    wx.cloud.callFunction({
      name: 'login',
      success: function(res) {
        var openid = res.result.openid;
        db.collection('user').where({
          openid: openid
        }).get({
          success: function(e) {
            if (e.data.length) {
              that.setData({
                user: e.data[0],
                upload: true
              })
            } 
            else {
              wx.showModal({
                title: '提示',
                content: '您当前处于未登录状态，请先到“我的”界面完成登录,否则将无法发表内容',
              })
              that.setData({
                upload: false
              })
            }
          },
          fail: function(e) {
          }
        })
      },
      fail: function (err) {    
        console.log(err)
      }
    })
  },

/**获取时间调用的函数 */
  changeDateTime1(e) {
    this.setData({ dateTime1: e.detail.value });
  },
  changeDateTimeColumn(e){
    var arr = this.data.dateTime, dateArr = this.data.dateTimeArray;
    arr[e.detail.column] = e.detail.value;
    dateArr[2] = dateTimePicker.getMonthDay(dateArr[0][arr[0]], dateArr[1][arr[1]]);
    this.setData({
      dateTimeArray: dateArr,
      dateTime: arr
    });
  },
  changeDateTimeColumn1(e) {
    var arr = this.data.dateTime1, dateArr = this.data.dateTimeArray1;
    arr[e.detail.column] = e.detail.value;
    dateArr[2] = dateTimePicker.getMonthDay(dateArr[0][arr[0]], dateArr[1][arr[1]]);
    this.setData({
      dateTimeArray1: dateArr,
      dateTime1: arr
    });
  }
  })
  /**获取时间调用的函数 结束 */
