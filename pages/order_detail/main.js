// pages/order_detail/main.js
var app=getApp();
const db = wx.cloud.database()
//引入订单库order
const order_list=wx.cloud.database().collection("order")
const user_list=wx.cloud.database().collection("user")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    _id:0,
    order:null,
    state:0,
    user_id:0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var _this=this;
    wx.cloud.callFunction({
      name:"login",
      success(res){
        _this.setData({
          user_id:res.result.openid
        },()=>{
          _this.loadData(options)
        })
      }
    })
  },
  loadData:function(data){
    var _this=this;
    _this.setData({
      _id:data._id
    },()=>{
      for(var i=0; i<app.globalData.orderlist_all.length; ++i){
        if(_this.data._id==app.globalData.orderlist_all[i]._id){
          _this.setData({
            order:app.globalData.orderlist_all[i]
          })
          break
        }
      }
    })
    wx.stopPullDownRefresh();
  },
  update_order:function(e){
    wx.navigateTo({
      url: '../order_update/order_update?_id='+this.data._id
    })
  },
  take_order:function(e){
    var _this=this;
    user_list.where({
      _openid:_this.data.user_id
    }).get({
      success: function(res) {
        if(res.data[0].tel==null||res.data[0].nickName==null||res.data[0].paycode==null)
          wx.showModal({
            title: 'NOTICE',
            content: '完善个人信息后才可以添加订单哦',
            cancelText:'Cancel',
            confirmText:'OK',
            success (res) {
              if (res.confirm) {
                console.log('用户点击确定')
                wx.navigateTo({
                  url: '../information/information',
                })
              } 
            }
          })
        else{
          wx.showModal({
            title: '提示',
            content: '请确认是否接单',
            confirmText:'确认接单',
            success (res1) {
              if (res1.confirm) {
                //console.log('用户点击确定')
                wx.cloud.callFunction({
                  name:"login",
                  success(res1){
                    var openid = res1.result.openid
                    //检查订单状态
                    order_list.where({
                      _id:e.currentTarget.dataset.item
                    }).get({
                      success: function(res) {
                        if(res.data.length==1){
                          if(res.data[0].state==1){
                            var user_info={
                              order_receiver:null,
                              order_taker:null
                            };
                            const _=db.command
                            user_list.where({
                              openid:_.eq(res.data[0].order_receiver_openid).or(_.eq(openid))
                            }).field({
                              _id:false,
                              openid:true,
                              nickName:true,
                              tel:true,
                            }).get({
                              success:res2=>{
                                if(res2.data.length==1){
                                  user_info.order_receiver=res2.data[0]
                                  user_info.order_taker=res2.data[0]
                                }
                                else{
                                  if(res2.data[0].openid==openid){
                                    user_info.order_receiver=res2.data[1]
                                    user_info.order_taker=res2.data[0]
                                  }
                                  else{
                                    user_info.order_receiver=res2.data[0]
                                    user_info.order_taker=res2.data[1]
                                  }
                                }
                                console.log(user_info)
                                //发送订阅消息
                                wx.cloud.callFunction({
                                  // 云函数名称
                                  name: 'submessage_order_state_update',
                                  data: {
                                    order:res.data[0],
                                    order_taker:user_info.order_taker,
                                    order_receiver:user_info.order_receiver
                                  },
                                }).then(res1 => {
                                  wx.cloud.callFunction({
                                    // 云函数名称
                                    name: 'submessage_order_state_update',
                                    data: {
                                      order:res.data[0],
                                      order_taker:user_info.order_taker,
                                      order_receiver:user_info.order_taker
                                    },
                                  }).then(res => {
                                    wx.cloud.callFunction({
                                      name: 'order_func',
                                      data: {
                                        type: "update_state2",
                                        order_taker_openid:openid,
                                        _id:e.currentTarget.dataset.item
                                      },
                                      success: function(r) {
                                        wx.showToast({
                                          title: '接单成功',  // 标题
                                          icon: 'success',   // 图标类型，默认success
                                          duration: 1000   // 提示窗停留时间，默认1500ms
                                        })
                                        _this.setData({
                                          state:1
                                        })
                                        wx.switchTab({
                                          url: '../my_order/my_order',
                                        })
                                      },
                                      fail:function(){
                                        console.log('update fail')
                                      }
                                    })
                                  })
                                  .catch(console.error)
                                })
                                .catch(console.error)
                              },
                              fail:res=>{
                                console.log("0000", res);
                              }
                            })   
                          }
                        }
                      }
                    })
                  }
                })
              }
            }
          })
        }
      },
    })   
  },
})