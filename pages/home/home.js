// pages/home/home.js
/**全局变量 */
var app=getApp();
//引入用户库user
const user_list=wx.cloud.database().collection("user")
//引入订单库order
const order_list=wx.cloud.database().collection("order")
const db = wx.cloud.database()

wx-Page({
  data: {
    tabs:[
      {
        id:0,
        value:"Distance",
        isactive:true
      },
      {
        id:1,
        value:"Price",
        isactive:false
      },
      {
        id:2,
        value:"Time",
        isactive:false
      }
    ],
    showModal_flag: false,//未授权个人信息时出现弹窗标记
    login_toast_mark:0,//刷新时保证不重复出现登录成功的标记
    subscription_toast_mark:0,//刷新时保证不重复出现订阅标记
    orderlist:[],
    curr_location:{
      latitude:0,
      longitude:0
    },
    openid:null,
    orderlist_distance:[], //{_id,distance}数组
    orderlist_price:[], //{_id,price}数组
    orderlist_time:[] ,//{_id,time}数组
    orderlist_pic:[],//{_id,头像}数组
    userlist:[],//(_id,avataUrl)
  },
  queryparams:{
    query:"",
    cid:"",
    pagenum:1,
    pagesize:10,
  },

  totalpages:1,
  /**
   * 生命周期函数--监听页面加载
   * 页面加载 就会触发
   */
  onLoad: function (options) {
    this.queryparams.cid=options.cid||"";
    this.queryparams.query=options.query||"";
    // this.getorderlist(); 
    // this.check_setting();
    this.messagebox_check_subscriptionsSetting();
  },
  onShow:function(){
    //this.get_order_all();
    this.check_time();
    this.check_setting();
    //this.getorderlist(); 
    
    //this.messagebox_check_subscriptionsSetting();
    //wx.stopPullDownRefresh();
    //this.get_order_all();
  },
  comp_currTime: function (a,b) {
    console.log("a",a)
    console.log("b",b)
    var array_a=a.split(" ")
    var array_b=b.split(" ")
    var array_a_date=array_a[0].split('-')
    var array_a_time=array_a[1].split(':')
    var array_b_date=array_b[0].split('-')
    var array_b_time=array_b[1].split(':')
    for(var i=0;i<3; ++i){
      if(parseInt(array_a_date[i])>parseInt(array_b_date[i]))
        return 1;
      if(parseInt(array_a_date[i])<parseInt(array_b_date[i]))
        return -1;
    }
    for(var i=0;i<2; ++i){
      if(parseInt(array_a_time[i])>parseInt(array_b_time[i]))
        return 1;
      if(parseInt(array_a_time[i])<parseInt(array_b_time[i]))
        return -1;     
    }
    return 0;
  },
  check_time:function() {
    var _this=this
    wx.cloud.callFunction({
      name:"order_func",
      data: {
        type: "get_default",   
      },
      success(res){
        console.log(res)
        var list=[]
        var date= new Date();
        var curr_time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()+' '+date.getHours()+':'+date.getMinutes()
        for(var i=0;i<res.result.data.length;++i){
          if(_this.comp_currTime(curr_time,res.result.data[i].end_time)==1)
            list.push(res.result.data[i]._id)
        }
        wx.cloud.callFunction({
          name: 'check_time',
          data: {
            list:list
          },
          success:function(r) {
            _this.getorderlist(); 
            _this.get_order_all();
          },
          fail:function(){
            console.log('过期订单状态更新失败')
          }
        })
      }
    })
  },
  send_message:function(e){
    wx.cloud.callFunction({
      // 云函数名称
      name: 'submessage_order_state_update',
      data: {
        //订单号
        number1:{
          value:'0bcbdde05fcfaf9800e5b6f86ace20f3'
        },
        //订单标题
        thing2:{
          value:'世博代购'
        },
        //订单状态
        phrase3:{
          value:'开始配送'
        },
        //申请人
        thing12:{
          value:'qingqing'
        },
        //联系电话
        phone_number7:{
          value:'13030015130'
        }
      },
    }).then(res => {
      //console.log(res) // 3
    })
    .catch(console.error)
  },
  show: function (e) {
    var _this=this
    _this.setData({
      showModal_flag: true
    })
  },
 
  hide: function (e) {
    var _this=this
    _this.setData({
      showModal_flag: false
    })
  },
  confirmEvent: function(){
    this.hide();
},
  //检查获取用户个人信息授权是否开启
  check_setting:function(){
    var _this=this
    wx.getSetting({
      success(res_setting){
        if(!res_setting.authSetting["scope.userInfo"]){
          _this.show()
        }
        else{
          _this.check_user()
        }
      }
    })
    wx.stopPullDownRefresh();
  },

  //检查新老用户
  check_user:function(){
    var _this=this;
    //get openid
    wx.cloud.callFunction({
      name:"login",
      success(res){
        _this.setData({
          openid:res.result.openid
        })
        user_list.where({
          openid:res.result.openid,
        }).get({
          success(res_user){
            //var avatarUrl=_this.getuserinfo()
            //console.log('22',avatarUrl)
            //console.log("user查询功能正常")
            // _this.getuserinfo()
            //新用户
            if(res_user.data.length==0){
              //console.log("此用户为新用户")
              _this.setData({
                check_new:1
              })
              //新用户添加到user库中
              user_list.add({
                data:{
                  openid:res.result.openid,
                  avatarUrl:null
                },
                success(){
                  _this.getuserinfo()
                  //console.log("新用户添加成功")
                },
                fail(){
                  console.log("新用户添加失败")
                }
              })
              _this.getuserinfo()
              //弹出提示完善信息的对话框
              wx.showModal({
                title: 'Notice',
                content: 'Please update your information',
                showCancel: false,
                success: function (res) {
                  if (res.confirm) {
                    //跳转到注册界面
                    wx.navigateTo({
                      url: '../information/information'//此路径为测试值，记得改为注册界面register
                    })
                  } 
                }
              })
            }
            //老用户
            else{
              _this.getuserinfo()
              //console.log("此用户为老用户")
              //用户登录成功提示，并跳转到主界面
              wx.getSetting({
                success(res_setting){
                  if(res_setting.authSetting["scope.userInfo"]){
                    if(_this.data.login_toast_mark==0){
                      _this.setData({
                        login_toast_mark:1
                      })
                      _this.showLoginToast()
                    }
                  }
                }
              })
            }
          }
        })
      }
    })
    wx.stopPullDownRefresh();
  },
  //登录成功的弹窗
  showLoginToast:function(){
    wx.showToast({
      title: 'log in successfully',  // 标题
      icon: 'success',   // 图标类型，默认success
      duration: 1500   // 提示窗停留时间，默认1500ms
    })
  },
  getorderlist(){
    var that=this;
    //调用云函数查询order库所有订单
    wx.cloud.callFunction({
      name:"order_func",
      data: {
        type: "get_default",   
      },
      success(res){
        app.globalData.orderlist=res.result.data;
        that.setData({
          orderlist:res.result.data
          },()=>{
          that.update_location()
          that.update_price()
          that.update_time()
          that.update_avatarUrl()
        })
      },
      fail(res){
        console.log("order库所有订单查询失败", res)
      }
    })
    wx.stopPullDownRefresh();
  },
  getuserinfo(){
    wx.cloud.callFunction({
      name:"login",
      success(e){
        wx.getUserInfo({
          complete: (res) => {
            user_list.where({
              openid:e.result.openid
            }).update({
              data:{
                avatarUrl:res.userInfo.avatarUrl
              }
            })
          },
        })
      }
    })
  },
  messagebox_check_subscriptionsSetting(){
    let that = this ;
    if(that.data.subscription_toast_mark==0){
    wx.showModal({
           title: 'TIPS',
           content: '为方便您与买家的交流，服务号需要在订单变动和交易时向您发送消息',
           confirmText:"YES",
           cancelText:"NO",
           success: function (res) {
               if (res.confirm) {
                  //调用订阅消息
                   //console.log('用户点击确定');
                   //调用订阅
                   that.check_subscriptionsSetting();
               } else if (res.cancel) {
                   console.log('用户点击取消');
                   ///显示第二个弹说明一下
                   wx.showModal({
                     title: 'TIPS',
                     content: '拒绝后您将无法获取实时的与卖家（买家）的交易消息',
                     confirmText:"知道了",
                     showCancel:false,
                     success: function (res) {
                       console.log('该用户拒绝订阅信息')
                     }
                 });
               }
           }
       });
      }
    wx.stopPullDownRefresh();
  },
  check_subscriptionsSetting(){
    var that=this
    wx.requestSubscribeMessage({
      tmplIds: ['kbOfXUrfZ_lfRO0NxfEwJtTstg-kUTxopPF_2qSESH0'], // 此处可填写多个模板 ID，但低版本微信不兼容只能授权一个
      success (res) {
        //console.log('已授权接收订阅消息',res)
        that.setData({
          subscription_toast_mark:1
        })
        that.send_message()
      },
      fail(res){
        console.log('未授权接收订阅消息',res)
      }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    //this.send_message();
    // this.getuserinfo()
  },
   
  //获取用户当前位置，刷新order中距离信息
  update_location: function () {
    var _this=this
    wx.getLocation({
      type: 'gcj02',
      success (res) {
        _this.setData({
          curr_location:{
            latitude:res.latitude,
            longitude:res.longitude
          }
        })
        var list=[]
        for(var i=0;i<app.globalData.orderlist.length;i++){
          var la= app.globalData.orderlist[i].start_position.la
          var lo= app.globalData.orderlist[i].start_position.lo
          var dist=_this.distance(la,lo,_this.data.curr_location.latitude,_this.data.curr_location.longitude)
          let p={_id:app.globalData.orderlist[i]._id,distance:dist}
          list.push(p)
        }
        list.sort((a,b)=>a.distance-b.distance)
        app.globalData.orderlist_distance=list;
        _this.setData({
          orderlist_distance:list
        })
      }
    })
    wx.stopPullDownRefresh();
  },
  update_price: function () {
    var _this=this
    var list=[]
    for(var i=0;i<app.globalData.orderlist.length;i++){
      let p={_id:app.globalData.orderlist[i]._id,price:app.globalData.orderlist[i].price}
      list.push(p)
    }
    list.sort((a,b)=>b.price-a.price)
    //console.log(list)
    app.globalData.orderlist_price=list;
    _this.setData({
      orderlist_price:list
    })
  },
  
  comp: function (order1,order2) {
    var a=order1.end_time;
    var b=order2.end_time;
    var array_a=a.split(" ")
    var array_b=b.split(" ")
    var array_a_date=array_a[0].split('-')
    var array_a_time=array_a[1].split(':')
    var array_b_date=array_b[0].split('-')
    var array_b_time=array_b[1].split(':')
    for(var i=0;i<3; ++i){
      if(parseInt(array_a_date[i])>parseInt(array_b_date[i]))
        return 1;
      if(parseInt(array_a_date[i])<parseInt(array_b_date[i]))
        return -1;
    }
    for(var i=0;i<2; ++i){
      if(parseInt(array_a_time[i])>parseInt(array_b_time[i]))
        return 1;
      if(parseInt(array_a_time[i])<parseInt(array_b_time[i]))
        return -1;     
    }
    return 0;
  },
  update_time: function () {
    var _this=this
    var list=[]
    for(var i=0;i<app.globalData.orderlist.length;i++){
      let p={_id:app.globalData.orderlist[i]._id,end_time:app.globalData.orderlist[i].end_time}
      list.push(p)
    }
    list.sort(_this.comp)
    app.globalData.orderlist_time=list;
    _this.setData({
      orderlist_time:list
    })
  },
  update_avatarUrl:function(){
    var that=this;
    db.collection('user').field({
      _id:false,
      openid:true,
      avatarUrl:true
    }).get().then(res => {
      // res.data 是一个包含集合中有权限访问的所有记录的数据，不超过 20 条
      that.setData({
        userlist:res.data
      })
    })
  },
  get_order_all(){
    order_list.get({
      success: function(res) {
        app.globalData.orderlist_all=res.data;
        //console.log('all')
      },
    })
  },
//标题点击事件 从子组件传递过来
  handletabsitemchange(e){
    const {index}=e.detail;
    //修改原数组
    let {tabs}=this.data;
    tabs.forEach((v,i)=>i===index?v.isactive=true:v.isactive=false);
    //赋值到data中
    this.setData({
      tabs
    })
  },

  onReachBottom(){
    if(this.queryparams.pagenum>=this.totalpages){
      // console.log("没有下一页数据");
      wx.showToast({
        title: '没有下一页数据',
      })
    }else{
      this.queryparams.pagenum++;
      this.getorderlist();
    }
  },
  //下拉刷新
  onPullDownRefresh(){
  
    this.queryparams.pagenum=1;
    //this.getorderlist();
    this.check_time();
    this.check_setting();
    this.messagebox_check_subscriptionsSetting()
    this.send_message()
  },
  //悬浮按钮 添加功能
  addetial:function(){
    wx.navigateTo({
      url:'',
      success:function(res){
      },
      fall:function(res){},
      complete:function(res){},
    })
  },  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  //测两点距离
  distance: function (la1, lo1, la2, lo2) {//单位km
    var La1 = la1 * Math.PI / 180.0;
    var La2 = la2 * Math.PI / 180.0;
    var La3 = La1 - La2;
    var Lb3 = lo1 * Math.PI / 180.0 - lo2 * Math.PI / 180.0;
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(La3 / 2), 2) + Math.cos(La1) * Math.cos(La2) * Math.pow(Math.sin(Lb3 / 2), 2)));
    s = s * 6378.137;
    s = Math.round(s * 10000) / 10000;
    s = s.toFixed(2);
    return s;
  },
  check_user_info:function(){
    var _this=this;
    user_list.where({
      _openid:_this.data.openid
    }).get({
      success: function(res) {
        if(res.data[0].tel==null||res.data[0].nickName==null)
          wx.showModal({
            title: 'NOTICE',
            content: '完善个人信息后才可以添加订单哦',
            cancelText:'返回',
            confirmText:'去完善',
            success (res) {
              if (res.confirm) {
                console.log('用户点击确定')
                wx.navigateTo({
                  url: '../information/information',
                })
              } 
            }
          })
        else
          wx.navigateTo({
            url: '../new_order/new_order',
          })
      }
    })
  }
})
