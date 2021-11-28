// // pages/login/login.js
const user_list=wx.cloud.database().collection("user")

Page({

  data: {
    showModalDlg: false
  },

  preventTouchMove: function () {
    //阻止触摸
  },
  onLoad: function (options) {
    this.get_setting();
    this.check_user();
  },
  //检查新老用户
  check_user:function(){
      var _this=this;
      //get openid
      wx.cloud.callFunction({
        name:"login",
        success(res){
        user_list.where({
          openid:res.result.openid,
        }).get({
          success(res_user){
            console.log("user查询功能正常")
            //新用户
            if(res_user.data.length==0){
              console.log("此用户为新用户")
              _this.setData({
                check_new:1
              })
              //新用户添加到user库中
              user_list.add({
                data:{
                  openid:res.result.openid
                },
                success(){
                  console.log("新用户添加成功")
                },
                fail(){
                  console.log("新用户添加失败")
                }
              })
              //弹出提示完善信息的对话框
              wx.showModal({
                title: '提示',
                content: '请完善个人信息',
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
              console.log("此用户为老用户")
              //用户登录成功提示，并跳转到主界面
              wx.getSetting({
                success(res_setting){
                  //console.log(res_setting)
                  //res_setting.authSetting["scope.userLocation"]&&
                  if(res_setting.authSetting["scope.userInfo"]){
                    _this.showLoginToast()
                    setTimeout(function () {
                      wx.switchTab({
                        url: '../home/home'
                      });
                    }, 700);
                  }
                }
              })
            }
          }
        })
      }
      })
  },
  get_setting:function(){
    var _this=this
    wx.getSetting({
      success(res_setting){
        if (!res_setting.authSetting['scope.userInfo']) {
          _this.setData({
            showModalDlg:true
          })
        }
      }
    })
  },
  cancel:function(){
    wx.navigateTo({
      url: '../login/login',
    })
  },
  showLoginToast:function(){
    wx.showToast({
      title: '登录成功',  // 标题
      icon: 'success',   // 图标类型，默认success
      duration: 1500   // 提示窗停留时间，默认1500ms
    })
  },
})