// pages/info/info.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    nickName : "",
    avatarUrl : "",
    credit : "100",
  },
  onShow:function(){
    var that = this;
    wx.getUserInfo({
      success: function(res) {
        //console.log(res);
        
        var userInfo = res.userInfo
        //console.log(userInfo);
        var nickName = userInfo.nickName
        var avatarUrl = userInfo.avatarUrl
       // var userID = userInfo.openid//获取用户在小程序内的ID。
        that.setData({
          nickName : nickName,
          avatarUrl : avatarUrl,
         // userID : userID
        })
      }
    })
    /*wx.cloud.callFunction({
      name:"login",
      success(res){
        console.log(res.result.openid)
        var userID = res.result.openid
        that.setData({
          userID : userID
        })
      },
      fail(err){
        console.log(err)
      }
    })*/
  }
})