// pages/order_update/order_update.js
const db = wx.cloud.database();
var dateTimePicker = require('../../utils/dateTimePicker.js');
const order_list=wx.cloud.database().collection("order")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    _id:0,
    order:{},
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

  /**
   * 生命周期函数--监听页面加载
   */
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
    if (1) {
      var _this = this;
      var text = e.detail.value.text;
      if(text=="")
        text=_this.data.order.order_details
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
            console.log(e.detail.value.price)
            //获取用户openid 
            wx.cloud.callFunction({
              name: 'login',
              success: function(res) {
                var price=e.detail.value.price
                if(price=='')
                  price=_this.data.order.price
                //添加新订单
                wx.cloud.callFunction({
                  name: 'order_func',
                  data: {
                    type: "update",  
                    _id: _this.data._id,
                    new_order:{
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
                      price:price,
                      order_details:text,
                      end_time:_this.get_endtime(),
                      state:1
                    } 
                  },
                  success: function(res) {
                    wx.showToast({
                      title: 'Change Order Successfully',  // 标题
                      icon: 'success',   // 图标类型，默认success
                      duration: 1000   // 提示窗停留时间，默认1500ms
                    })
                    wx.switchTab({
                      url: '../home/home',
                    })
                  },
                  fail:function(res){
                    wx.showToast({
                      title: '修改订单失败',  // 标题
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
    var that=this;
    //console.log(this.fetchlocation=={})
    that.setData({
      _id:options._id
    })
    order_list.where({
      _id:options._id
    }).get({
      success: function(res) {
        that.setData({
          order:res.data[0],
          fetchlocation:res.data[0].start_position,
          sendlocation:res.data[0].end_position,
          price:res.data[0].price,
          //value:res.data[0].order_details,
        })
      }
    })
    /**时间 */
    // 获取完整的年月日 时分秒，以及默认显示的数组
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

