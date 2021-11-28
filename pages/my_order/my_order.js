// pages/my_order/my_order.js
var app=getApp();
const db = wx.cloud.database()
const order_list=wx.cloud.database().collection("order")
const user_list=wx.cloud.database().collection("user")

Page({
  data: {
    nodataType: 7,
    orderlist: [],    //订单列表数据，接口获取
    currentPage: 1,
    isNoMoreData: false,
    orderState: 0,//订单状态
    winHeight: 900,
    currentTab: 0,     //当前显示tab的下标
    navTab: ['All', 'PO', 'DO'],
    loading:true,
    isactive:true,
    clicked_order:{},
    openid:null,
    showModalStatus:false,
    paycode:"",
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) { 
    this.initData(options);    //获取数据的方法
  },
  onShow:function(options){
    this.initData(options);
  },
  onPullDownRefresh(options){
    this.initData(options)
  },
  initData(currentPage) {
    var _this=this;
    const _ = db.command
    wx.cloud.callFunction({
      name:"login",
      success(res){
        var _openid=res.result.openid;
        order_list.where(_.or([
          {
            order_receiver_openid:_openid,
          },
          {
            order_taker_openid:_openid,
          }
        ])).get({
          success: function(res) {
            _this.setData({
              orderlist:res.data,
              openid:_openid
            })
          }
        })
      },
    })
    wx.stopPullDownRefresh();
  },
  switchNav(e) {  //点击 这个方法会触发bindChange()方法
    let isSelect = e.target.dataset.current;
    this.setData({
      currentTab: isSelect,
    })
  },
 
  bindChange(e) {    //切换swiper
    let isSelect = e.detail.current;
 
    if (isSelect != 0) {
      this.setData({
        orderState: isSelect
      })
    }
    else {
      this.setData({
        orderState: 0
      })
    }
    this.setData({
      isNoMoreData: false,
      loading: true,
      currentTab: isSelect,
      //orderlist: []
    })
    this.initData(1)
  },

 //确认按钮
 check:function(e){
  var _this=this
  var order=e.currentTarget.dataset.clicked_order;
  if(order!=undefined){
      _this.setData({
        clicked_order:order
      },()=>{
        var receiver_flag=0
        if(_this.data.openid==order.order_receiver_openid)
          receiver_flag=1
        const _=db.command
        var user_info={
          order_receiver:null,
          order_taker:null
        };
        user_list.where({
          openid:_.eq(order.order_receiver_openid).or(_.eq(order.order_taker_openid))
        }).field({
          _id:false,
          openid:true,
          nickName:true,
          tel:true,
          paycode:true,
        }).get({
          success:res=>{
            //console.log(res.data)
            if(res.data.length==1){
              user_info.order_receiver=res.data[0]
              user_info.order_taker=res.data[0]
            }
            else{
              if(res.data[0].openid==order.order_receiver_openid){
                user_info.order_receiver=res.data[0]
                user_info.order_taker=res.data[1]
              }
              else{
                user_info.order_receiver=res.data[1]
                user_info.order_taker=res.data[0]
              }
            }
            _this.setData({
              paycode:user_info.order_taker.paycode
            })
          },
          fail:res=>{
            console.log("0000", res);
          }
        })
      if(order.state==3){//按钮显示待支付
        _this.showModal(e)
        // _this.setData({
        //   showModalStatus:true
        // })
      }
      if(order.state==2){//按钮显示配送中
        if(receiver_flag==1){
          wx.showModal({
            title: '提示',
            content: '请确认订单是否已完成',
            confirmText:'已完成',
            success (res) {
              if (res.confirm) {
                wx.cloud.callFunction({
                  name: 'order_func',
                  data: {
                    type: "update_state3",
                    _id: order._id,
                  },
                  success: function(r) {
                    wx.showToast({
                      title: 'ORDER FINISH',  // 标题
                      icon: 'success',   // 图标类型，默认success
                      duration: 1000   // 提示窗停留时间，默认1500ms
                    })
                    wx.cloud.callFunction({
                      // 云函数名称
                      name: 'submessage_order_state_update',
                      data: {
                        order:order,
                        order_taker:user_info.order_taker,
                        order_receiver:user_info.order_receiver
                      },
                    }).then(res => {
                      wx.cloud.callFunction({
                        // 云函数名称
                        name: 'submessage_order_state_update',
                        data: {
                          order:order,
                          order_taker:user_info.order_taker,
                          order_receiver:user_info.order_taker
                        },
                      }).then(res => {
                        _this.initData()
                      })
                      .catch(console.error)
                    })
                    .catch(console.error)
                  },
                  fail:function(){
                    console.log('update fail')
                  }
                })
              }
            }
          })
        }
      }
    })
  }
},
  taker_notice:function(){
    wx.showModal({
      title: '提示',
      content: '请耐心等待对方支付哦~',
      showCancel:false,
      success (res) {
        if (res.confirm) {
          
        } 
      }
    })
  },
  /**
 * 生命周期函数--监听页面初次渲染完成
 */
  onReady: function () {   //获取设备高度
    let _this = this;
    wx.getSystemInfo({
      success: function (res) {
        // console.log(res.windowWidth);
        // console.log(res.windowHeight);
        _this.setData({
          winHeight: res.windowHeight
        })
      },
    })
  },
  /**
  * 页面上拉触底事件的处理函数
  */
  onReachBottom: function () {    //上拉加载分页
    this.setData({
      loading:true
    })
    if (!this.data.isNoMoreData&&this.data.orderlist.length>0) {
      this.initData(++this.data.currentPage);
    }
  },
  //悬浮按钮 跳转聊天列表功能
  gochat:function(param){
    wx.navigateTo({
      url: '../chat_list/chat_list',
      })
  },
  


  ///测试二维码弹窗
  //显示对话框
  showModal: function (e) {
    // 显示遮罩层
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: "linear",
      delay: 0
    })
    var _this=this;
    this.animation = animation
    animation.translateY(300).step()
    this.setData({
      animationData: animation.export(),
      showModalStatus: true,
    })
    setTimeout(function () {
      animation.translateY(0).step()
      this.setData({
      animationData: animation.export()
      })
    }.bind(this), 200)
  },
  //隐藏对话框
  hideModal: function () {
    // 隐藏遮罩层
    var animation = wx.createAnimation({
      duration: 200,
      timingFunction: "linear",
      delay: 0
    })
    this.animation = animation
    animation.translateY(300).step()
    this.setData({
      animationData: animation.export(),
    })
    setTimeout(function () {
      animation.translateY(0).step()
      this.setData({
        animationData: animation.export(),
        showModalStatus: false
      })
    }.bind(this), 200)
  },
  btn_payment:function(e){
    var _this=this
    _this.hideModal()
    var order=e.currentTarget.dataset.order;
    wx.showToast({
      title: 'Finish Order',  // 标题
      icon: 'success',   // 图标类型，默认success
      duration: 1000   // 提示窗停留时间，默认1500ms
    })
    //修改订单状态
    const _=db.command
    var user_info={
      order_receiver:null,
      order_taker:null
    };
    user_list.where({
      openid:_.eq(order.order_receiver_openid).or(_.eq(order.order_taker_openid))
    }).field({
      _id:false,
      openid:true,
      nickName:true,
      tel:true,
    }).get({
      success:res=>{
        if(res.data.length==1){
          user_info.order_receiver=res.data[0]
          user_info.order_taker=res.data[0]
        }
        else{
          if(res.data[0].order_receiver_openid==_this.data.openid){
            user_info.order_receiver=res.data[0]
            user_info.order_taker=res.data[1]
          }
          else{
            user_info.order_receiver=res.data[1]
            user_info.order_taker=res.data[0]
          }
        }
        wx.cloud.callFunction({
          // 云函数名称
          name: 'submessage_order_state_update',
          data: {
            order:order,
            order_taker:user_info.order_taker,
            order_receiver:user_info.order_receiver
          },
        }).then(res1 => {
          wx.cloud.callFunction({
            // 云函数名称
            name: 'submessage_order_state_update',
            data: {
              order:order,
              order_taker:user_info.order_taker,
              order_receiver:user_info.order_taker
            },
          }).then(res2 => {
            wx.cloud.callFunction({
              name: 'order_func',
              data: {
                type: "update_state4",
                _id: order._id,
              },
              success: function(r) {
                _this.initData()
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
})