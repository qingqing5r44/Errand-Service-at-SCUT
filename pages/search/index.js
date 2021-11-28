// pages/search/index.js
var app=getApp();
const db = wx.cloud.database();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userlist:[],
    clicked:0,
    orderlist:[],
    text:""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.update_avatarUrl()
  },
  update_avatarUrl:function(){
    var that=this;
    db.collection('user').field({
      _id:false,
      openid:true,
      avatarUrl:true
    }).get().then(res => {
      that.setData({
        userlist:res.data
      })
    })
  },
  initData:function(){
    var _this=this
  },
  input_text:function(e){
    var _this=this
    _this.setData({
      text:e.detail.value
    })
  },
  search:function(e){
    var _this=this;
    _this.setData({
      clicked:1
    },()=>{
    db.collection("order").where({	 	//collectionName 表示欲模糊查询数据所在collection的名
      state:1,  
      order_details:{								//columnName表示欲模糊查询数据所在列的名
          $regex:'.*' + _this.data.text + '.*',		//queryContent表示欲查询的内容，‘.*’等同于SQL中的‘%’
          $options: 'i'							//$options:'1' 代表这个like的条件不区分大小写,详见开发文档
        }
      }).get({
        success:res=>{
          _this.setData({
            orderlist:res.data
          },()=>{        
            if(res.data.length==0){
              wx.showModal({
                title: 'NOTICE',
                content: 'Fail to find '+_this.data.text+' related',
                showCancel: false,
                success: function (res) {}
              })
            }
          })
        }
      })
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },
})