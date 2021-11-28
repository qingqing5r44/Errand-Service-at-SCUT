//引入订单库order
const order_list=wx.cloud.database().collection("order")

Page({
  onInfo:function(event){
    console.log(event)
    //db.collection('').add()
  },
  onUnload: function () {
    wx.switchTab({
      url: '../home/home'
    })
  },
  login:function(){
    wx.cloud.callFunction({
      name: 'order_func',
      data: {
        type: "get_default", //指定操作是insert  
      },
      success(res){
        console.log("success",res)
      },
      fail(res){
        console.log("fail", res)
      }
    })
  },
  //添加订单
  order_add:function(){
    wx.getLocation({
      type: 'wgs84',
      success (res) {
        const latitude = res.latitude
        const longitude = res.longitude
        const speed = res.speed
        const accuracy = res.accuracy
        //console.log(res)
      }
    })
    order_list.add({
      data:{
        order_taker_openid:'xxx',//接单人openid
        order_receiver_openid:'xxx',//出单人openid
        start_position:'1',//起始位置
        end_position:'1',//终止位置
        order_details:'测试订单数据',//订单内容
        price:5,//价格RMB
        start_time:'1',//开始时间
        end_time:'1',//结束时间
        state:1,//订单状态【1：等待配对；2：正在派送；3：订单完成；4：过期订单；5：支付完成；6：订单已送达但未支付】
        score:5,//订单评价，满分为5分
      },
      success(res){
        console.log('订单添加成功',res)
      },
      fail(res){
        console.log('订单添加失败',res)
      }
    })
  },
  to_login(){
    
  }
})