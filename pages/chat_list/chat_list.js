// pages/chat_list/chat_list.js

const db = wx.cloud.database()
const _ = db.command
const clist=db.collection("chat_list")
const user = db.collection("user")
const mes = db.collection("chatmessage")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    messages:[], //存在消息列表
    title:"",
    url:"",
    withid:'',
    text:'',
    count: 0,
    //userInfo:{}, //自己的数据
    user_id:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onShow: function (options) {
    var _this = this;
    //用自己的openid去查询存在的聊天列表拉取数据渲染
    wx.cloud.callFunction({
      name:"login",
      success(res){
        _this.setData({
          user_id:res.result.openid,
          messages:[]
        })
        clist.where(
          _.or(
          {
            A_id:res.result.openid,
          },
          {
            B_id:res.result.openid,
          }
         )
        )
        .get({
          success(e){
              _this.setData({
                with_list:e.data,
              },()=>{
                function init(j) {
                  if(j==_this.data.with_list.length) return; 
                  var with_id='';
                  var chatid='';
                  var msgs=_this.data.messages
                  var text='';
                  var time = '';
                  if(_this.data.with_list[j].A_id==_this.data.user_id){
                    with_id = _this.data.with_list[j].B_id
                  }
                  else{
                    with_id = _this.data.with_list[j].A_id
                  } 
                  chatid=_this.data.with_list[j]._id 
                  mes.where({
                    chatid:chatid
                  })
                  .get({
                    success(re){
                      var message =re.data[0].msg
                      if(message.length==0){
                        text=" "
                        time=0
                      }
                      else{
                        time = message[message.length-1].time
                        if(message[message.length-1].type=='Text'){
                          text = message[message.length-1].text
                        }
                        else if(message[message.length-1].type=='Image'){
                          text = "[图片]"
                        }
                      }
                      user.where({
                        openid:with_id
                      })
                      .get({
                        success(ee){
                          _this.setData({
                            title:ee.data[0].nickName,
                            url:ee.data[0].avatarUrl,
                            withid:ee.data[0].openid,
                            text:text,
                            time:time
                          },()=>{
                            var doc={
                              withid:'',
                              title:'',
                              url:'',
                              text:'',
                              time:'',
                              count:''};
                            for(var key in doc){
                              if(key=='withid'){
                                doc[key]=ee.data[0].openid
                              }
                              else if(key=='title'){
                                doc[key]=ee.data[0].nickName
                              }
                              else if(key=='url'){
                                doc[key]=ee.data[0].avatarUrl
                              }
                              else if(key=='text'){
                                doc[key]=text
                              }
                              else if(key=='time'){
                                doc[key]=time
                              }
                            }
                            msgs.push(doc)
                            _this.setData({
                              messages:msgs
                            },()=>{
                              init(j+1)
                            })
                          })
                        }
                      })                      
                    },
                  })                         
                }
                init(0)
              })
            }
        })
      }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    var _this = this;
    clist.watch({
      onChange:(res)=>{
        var userid = ''
        wx.cloud.callFunction({
          name:'login',
          success(res){
            userid = res.result.openid
            _this.setData({
              user_id:res.result.openid
            })
            clist.where(_.or([
            {
              "A_id":userid
            },
            {
              "B_id":userid
            }]))
            .get({
              success(res){
                //console.log(res)
                _this.setData({
                 with_list:res.data,
                })
                console.log(with_list)
              },
              fail(res){
                console.log(res)
              }
            })
          }
        })
        
      },
      onError(err){
        console.log("失败")
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onLoad: function () {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.setData({
      with_id:''
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  },
  //跳转到聊天框
  toWith(e) {
    var openid=e.currentTarget.dataset.openid
		wx.navigateTo({
      url: '../chat_detail/chat_detail?with_id='+openid
    })
  }
})