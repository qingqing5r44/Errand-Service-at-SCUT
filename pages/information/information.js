// pages/information/information.js
const user_list = wx.cloud.database().collection("user")
Page({
    data : {
      nickName : "",
      avatarUrl : "",
      sex: [{ id: "0", name: "男", checked:"true" }, { id: "1", name: "女" }],
      sexId:"0",   // 默认是0 => 男
      tel : "",
      roomID : "",
      credit: "100",
      paycodeUrl : "",
    },

    onShow:function(){
      wx.cloud.callFunction({
        name:"login",
        success(res){
          //console.log("openod",res.result.openid)
          var openid = res.result.openid
          //上传昵称
          wx.getUserInfo({
            success(res){
              var userInfo= res.userInfo
              //console.log(userInfo.nickName)
              user_list.where({
                openid:openid
              })
              .update({
                data:{
                  nickName:userInfo.nickName
                }
              })
            }
          })
        },
        fail(err){
          console.log(err)
        }
      })
      var that = this;
      wx.getUserInfo({
        success: function(res) {
          var userInfo = res.userInfo
          var nickName = userInfo.nickName
          var avatarUrl = userInfo.avatarUrl
          var sId = userInfo.gender
          that.setData({
            nickName:nickName,
            avatarUrl:avatarUrl,
          })
          var openid = ""
          wx.cloud.callFunction({
            name:"login",
            success(res){
              openid = res.result.openid      
              user_list.where({
                openid:openid
              })
              .get({
                success:e => {
                  that.setData({
                      tel : e.data[0].tel,
                      roomID : e.data[0].roomID,
                     // credit : e.data[0].credit,
                      sexId : e.data[0].sexId,
                      paycodeUrl : e.data[0].paycode
                  }) 
                
                }
              })
            },
            fail(err){
              console.log(err)
            }
          })
        }
      })
    },
     //点击图片进行预览
   previewImg: function(e) {
    var that = this;
    var src = e.currentTarget.dataset.src; //获取data-src
    //console.log(src);
    //图片预览
    wx.previewImage({
      current: src, // 当前显示图片的http链接
      urls: [src] // 需要预览的图片http链接列表
    })
  },
    buttonClick:function(e){
      //页面跳转
      wx.navigateTo({
        url: '../information_change/information_change'
      })
    }
})