// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 订单状态更新云函数入口函数
exports.main = async (event, context) => {//event包含该订单的data和接单人信息order_taker
  try {
    let state="";
    //订单状态【1：等待配对；2：正在派送；3：订单已送达但未支付；4：订单已送达且支付完成；5：过期订单】
    if(event.order.state==1)
      state="已接单"
    if(event.order.state==2)
      state="待支付"
    if(event.order.state==3)
      state="已完成"
    var date= new Date();
    var curr_time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()+' '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()
    const result = await cloud.openapi.subscribeMessage.send({
        touser: event.order_receiver.openid,//receiver_openid
        page: "pages/home/home",
        lang: 'zh_CN',
        data: {
          //操作时间
          "time5":{
            "value":curr_time
          },
          //订单标题
          "thing2":{
            "value":event.order.order_details
          },
          //订单状态
          "phrase3":{
            "value":state
          },
          //申请人
          "thing12":{
            "value":event.order_taker.nickName
          },
          //联系电话
          "phone_number7":{
            "value":event.order_taker.tel
          }
        },
        templateId: 'xxxxxx', //use your personal id here
        miniprogramState: 'formal'
      })
    return result
  } catch (err) {
    return err
  }
}