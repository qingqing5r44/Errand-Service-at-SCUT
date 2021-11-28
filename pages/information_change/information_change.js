// pages/information_change/information_change.js
const user_list=wx.cloud.database().collection("user")
Page({
  data : {
    nickName : "",
    avatarUrl : "",
    sex: [{ id: "0", name: "男", checked:"true" }, { id: "1", name: "女" }],
    sexId:"0",   // 默认是0 => 男
    tel : "",
    roomID: "",
    paycodeUrl : '../../icon/add.png',//收款码
  },
  onShow:function(){
    var that = this;
    wx.getUserInfo({
      success: function(res) {
        //console.log(res);
        var userInfo = res.userInfo
        console.log(userInfo);
        var nickName = userInfo.nickName
        var avatarUrl = userInfo.avatarUrl
        that.setData({
          nickName : nickName,
          avatarUrl : avatarUrl,
        })
      }
    })
  },
  radioChange:function(e){    // 选择男女
    var value = e.detail.value;
    this.setData({
      sexId: value
    })
  
  },
  getPaycode: function() {
    var that = this;
    // 1. 选择图片
    wx.chooseImage({
      sourceType: ['album'], // 从相册选择
      count: 1, // 只选一张
      success: function(res) {
        console.log(res.tempFiles[0].path);
        that.uploadImage(res.tempFiles[0].path);
        //that.setData({
          //thumbnail: res.tempFilePaths[0],//缩略图
          //paycodeUrl: res.tempFiles[0].path,
        //});
      },
      fail: function(res) {
        // 选择图片失败
        console.log(res)
      }
    });
  },
  uploadImage:function(fileUrl){
    wx.cloud.uploadFile({
      cloudPath: this.data.nickName+'_paycode.png',//云端路径
      filePath:fileUrl,
      success:res =>{
        console.log('success!'+res);
        this.setData({
          paycodeUrl:res.fileID
        })
      },
      fail:console.error
    })
  },
  //提交表单
  formSubmit:function(e){
    var _this=this
    var value = e.detail.value;//表单数据
    var Tel = e.detail.value.tel;
    var RoomId = e.detail.value.roomID;
    var SexId = this.data.sexId;
    var Paycode = this.data.paycodeUrl;
    console.log("sex",this.data.sexId)
    if (Tel=='' || Tel == undefined)
    {
       wx.showToast({
          title: '手机号码不能为空',
          icon: 'none',
          duration: 1000
        })
        return false;
    }
    if (Tel.length != 11) {
      wx.showToast({
        title: '手机号长度有误',
        icon: 'none',
        duration: 1000
      })
      return false;
    }
    var myreg = /^(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(19[0-9]{1})|(18[0-9]{1})|(17[0-9]{1}))+\d{8})$/;
    if (!myreg.test(Tel)) {
      wx.showToast({
        title: '手机号有误',
        icon: 'none',
        duration: 1000
      })
      return false;
    }
    if (RoomId=='' || RoomId == undefined)
    {
       wx.showToast({
          title: '房间号不能为空',
          icon: 'none',
          duration: 1000
        })
        return false;
    }
    //将数据上传到数据库
    wx.cloud.callFunction({
      name:"login",
      success(res){
        console.log(res.result.openid)
        var openid = res.result.openid
        user_list.where({openid:openid})
        .update({
          data:{
            sexId :SexId,
            tel:Tel,
            roomID:RoomId,
            nickName:_this.data.nickName,
            paycode: Paycode
          } 
        })
      },
      fail(err){
        console.log(err)
      }
    })

    //提交成功的弹窗
    wx.showToast({
      title: '成功保存',
      icon: 'success',
      duration: 1000
    })
    //页面跳转
    wx.navigateBack({
      delta: 1
    })
  }
})