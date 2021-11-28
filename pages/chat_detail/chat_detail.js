// pages/chat_detail/chat_detail.js
//初始化数据库
var emoji = require('../../utils/emojiMap.js');
const util = require('../../utils/util.js');
var interval;
var _isPageLoad = false; // 页面是否加载
const db =wx.cloud.database()
const _ = db.command
const msgs = db.collection('chatmessage')
const clist = db.collection('chat_list')
const user = db.collection('user')
Page({

  /**
   * 页面的初始数据
   */

  data: {
    user_id:'',   //自己的openid
    with_id:'',   //对方的openid
    chatid:'',  //聊天id
    Height: '',
    scrollTop:0,
    
    user_value:'',
    info_list:[],

    userImg: '',//自己的头像
    userName:'',//自己昵称
    toUserImg : '',//对方的头像
    toUserName : "",//对方的昵称

    inputVal: '',
    inputBottom: 0,
    chatBoxH: 66, // 底部输入框高度，动态获取
    showInput: false, //无输入状态 
    extras: false, //附加功能+
    phiz: false, //表情
    sendOutVAL: true,//发送按钮
    extrasVAL: false,//附加按钮隐藏？
    inputL: true,//输入框长度
    emojiUrl: emoji.emojiUrl,
    emojiMap: emoji.emojiMap,
    emojiName: emoji.emojiName,
    msgList:[],
    time:''
  },
  /**
   * 生命周期函数--监听页面加载
   */
  getInfo(options){
    var chat_id = ''
    var that = this
    that.setData({
      with_id:options.with_id
    })
    
    _isPageLoad = true;
    
    wx.cloud.callFunction({
      name:"login",
      success(res){
        that.setData({
          user_id:res.result.openid
        })
        //查询chatlist中是否有通讯双方
        clist.where(
          _.or([
            {
              A_id:that.data.user_id,
              B_id:that.data.with_id
            },
            {
              A_id:that.data.with_id,
              B_id:that.data.user_id
            }
          ])
        )
        .get({
         success(e){
          if(e.data.length==0){
            clist.add({
              data:{
                A_id:that.data.user_id,
                B_id:that.data.with_id,
              },
              success:function(res){
                //new
                //查询clist里的记录
                clist.where(
                  _.or([
                    {
                      A_id:that.data.user_id,
                      B_id:that.data.with_id
                    },
                    {
                      A_id:that.data.with_id,
                      B_id:that.data.user_id
                    }
                  ])
                )
                .get({
                  success(ee){
                    that.setData({
                      chatid:ee.data[0]._id
                    },()=>{
                      chat_id=that.data.chatid
                      //在信息列表中添加信息id
                      msgs.where({
                        chatid:chat_id
                      })
                      .get({
                        success(res){
                          console.log(res)
                          if(res.data.length==0){
                            console.log("长度为0")
                            msgs.add({
                              data:{
                                chatid:chat_id,
                                msg:[],
                              },
                            })
                          }
                          else{
                            that.setData({
                              msgList:res.data[0].msg
                            })
                          }
                        },
                      })
                    })
                  },
                })           
              }
            })
          }
          else{
            //查询clist里的记录
            clist.where(
              _.or([
                {
                  A_id:that.data.user_id,
                  B_id:that.data.with_id
                },
                {
                  A_id:that.data.with_id,
                  B_id:that.data.user_id
                }
              ])
            )
            .get({
              success(ee){
                that.setData({
                  chatid:ee.data[0]._id
                },()=>{
                  chat_id=that.data.chatid
                  //console.log("that.data.chatid",that.data.chatid)
                  //在信息列表中添加信息id
                  msgs.where({
                    chatid:chat_id
                  })
                  .get({
                    success(res){
                      that.setData({
                        msgList:res.data[0].msg
                      })
                    },
                  })
                })
              },
            })  
          }         
         },
        })
      }
    })
    //已经成功添加chatid,需对信息进行添加

    /*
      加载历史消息
    */

    //把当前的msgList中的所有msg都转成emojiText
    that.data.msgList.forEach(msg => {
      that.transMsgEmojiStr(msg);
    })
    //console.log("111",that.data.msgList)
    that.setData({
      msgList: that.data.msgList
    });

    //获取自己的头像
    wx.getUserInfo({
      success: function(res) {
        var userInfo = res.userInfo
        var avatarUrl = userInfo.avatarUrl
        var nickName = userInfo.nickName
        that.setData({
          userImg : avatarUrl,
          nickName : nickName
        })
      }
    });

    //获取对方的头像&昵称
    user.where({
      openid:that.data.with_id,
    })
    .get({
      success(e){
        that.setData({
          toUserImg : e.data[0].avatarUrl,
          toUserName : e.data[0].nickName
        })  
        //根据昵称修改标题
        wx.setNavigationBarTitle({
          title: that.data.toUserName
        });
      },    
    })
  },
  onLoad: function (options) {
    var that =this
    that.getInfo(options)
    //console.log('ok')
    interval = setInterval(function(){
      that.getInfo(options),
      console.log("1s了————————————————————————")
    },10000)
  
  },
  //输入内容
  input_value(e){
    this.setData({
      user_value:e.detail.value
    })
  },
  
  //发送消息
  sendMessage(){
    
    var _this=this;
    //console.log(_this.data.user_id)
    if(!this.data.user_value){
      return false;
    }
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    clearInterval(interval)
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // this.watcher.close()
    wx.removeStorageSync('with_info')
    clearInterval(interval)
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
  // msg转emoji
  transMsgEmojiStr: function(msg) {
    if (msg.type == "Text") {
      msg.emojiTexts = emoji.transEmojiStr(msg.text);
   }
  },
   //点击图片进行预览
   previewImg: function(event) {
    var that = this;
    var src = event.target.dataset.img; //获取data-src
    var imgList = [event.target.dataset.img]; //获取data-list
    //图片预览
    wx.previewImage({
      current: src, // 当前显示图片的http链接
      urls: imgList // 需要预览的图片http链接列表
    })
  },
  extrasBTN: function() {
    this.setData({
      extras: true,
      phiz: false, //表情 
      showInput: false, //键盘 
    })
    //inputRoomHeight(this);
    this.setData({
      toView: this.data.msgList.length - 1
    })
  },

  phizBTN: function() { //开启表情
    this.setData({
      phiz: (!this.data.phiz),
      keyboard: true, //键盘
      voice: false, //录音
      extras: false, //附加功能
    })
    //inputRoomHeight(this);
    this.setData({
      toView: this.data.msgList.length - 1
    })
  },
  eea: function() {
    this.setData({
      chatBoxH: 66,
      phiz: false, //表情 
      extras: false //附加功能
    })
  },
  // 选择emoji表情
  tapEmoji: function(e) {
    this.setData({
      inputVal: this.data.inputVal + e.currentTarget.dataset.text,
      sendOutVAL: false,
      extrasVAL: true
    });
  },
    /**
   * 获取聚焦
   */

focus: function(e) {
    //keyHeight = e.detail.height;
   /*   this.setData({
     // inputBottom: (keyHeight), 
      //chatBoxH: (keyHeight + 66),
      extras: false, //附加功能
      phiz: false, //表情 
      toView: this.data.msgList.length - 1,

    });*/
    //计算msg高度
   // console.log(keyHeight)
    // 滚动到聊天底部
    //this.bindToMsgBottom();
  },
  //失去聚焦(软键盘消失)
  blur: function(e) {
    this.setData({
      inputBottom: 0,
      chatBoxH: 66,
      toView: this.data.msgList.length - 1,
      showInput: false
    })
  },
  input: function(e) {
    this.data.inputVal = e.detail.value
    var inputCont = this.data.inputVal
    if (inputCont == "") {
      this.setData({
        sendOutVAL: true,
        extrasVAL: false,
        inputL:true
      })
    } else {
      this.setData({
        sendOutVAL: false,
        extrasVAL: true,
        inputL: false
      })
    }
  },  
  
  /**
  * 发送点击监听
  */
  sendClick: function(e) {
    var that = this;
    var text = that.data.inputVal;
    var msg = {
      from: that.data.user_id,
      time: util.getTimestamp() / 1000,
      type: "Text", // Text 文本和emoji表情，Image 图片，Audio 音频
      emojiTexts: "", // Text类型时 通过消息转换 为带emoji表情的文本
      text: text,
    };
    //console.log(util.getTimestamp() / 1000);
    that.transMsgEmojiStr(msg); // 转换emoji文字
    that.data.msgList.push(msg)
    that.setData({
      msgList: that.data.msgList,
      inputVal: "",
      toView: 'msg-' + (that.data.msgList.length - 1),
      sendOutVAL: true,
      extrasVAL: false
    },()=>{
      //console.log(that.data.chatid)
      //console.log(that.data.msgList)
      msgs.where({
        chatid:that.data.chatid
      })
      .update({
        data:{
          msg:that.data.msgList
        }
      })      
    })
  },
  onReady(){
    
  },
  
  getPhoto: function() {
    var that = this;
    // 1. 选择图片
    wx.chooseImage({
      sourceType: ['album'], // 从相册选择
      count: 1, // 只选一张
      success: function(res) {
        const filePath = res.tempFilePaths[0]
        const name =Math.random()*1000000
        const cloudPath = name+filePath.match(/\.[^.]+?$/)[0]//存储路径名
        wx.cloud.uploadFile({ 
          cloudPath,  //云端路径
          filePath,
          success:res =>{
            //console.log('success!'+res);
            let fileID = res.fileID;
            //console.log("1111111111111111",that.data.msgList)
            that.data.msgList.push({
              from: that.data.user_id,
              time: util.getTimestamp() / 1000,
              type: "Image", // Text 文本和emoji表情，Image 图片，Audio 音频
              thumbnail:fileID,
              imageUrl:fileID,
            })
            //console.log("222222222222222222",that.data.msgList)
            that.setData({
              msgList: that.data.msgList,
              toView: that.data.msgList.length - 1
            });
            msgs.where({
              chatid:that.data.chatid
            })
            .update({
              data:{
                msg:that.data.msgList
              }
            })
          },
        fail: function(res) {
        // 选择图片失败
        console.log(res)
        }
      });
    }
  })
},

  takePhoto: function() {
    var that = this;
    // 1. 拍摄图片
    wx.chooseImage({
      sourceType: ['camera'], // 从相机拍摄选择
      count: 1, // 只选一张
      
      success: function(res) {
        const filePath = res.tempFilePaths[0]
        const name =Math.random()*1000000
        const cloudPath = name+filePath.match(/\.[^.]+?$/)[0]//存储路径名
        wx.cloud.uploadFile({ 
          cloudPath,  //云端路径
          filePath,
          success:res =>{
            console.log('success!'+res);
            let fileID = res.fileID;
            that.data.msgList.push({
              from: that.data.user_id,
              time: util.getTimestamp() / 1000,
              type: "Image", // Text 文本和emoji表情，Image 图片，Audio 音频
              thumbnail:fileID,
              imageUrl: fileID,
            })
            that.setData({
              msgList: that.data.msgList,
              toView: that.data.msgList.length - 1
            });
            msgs.where({
              chatid:that.data.chatid
            })
            .update({
              data:{
                msg:that.data.msgList
              }
            })
          },
          fail: function(res) {
            // 拍摄图片失败
            console.log(res)
          }
        });
  
      }, 
    })
  }
})
