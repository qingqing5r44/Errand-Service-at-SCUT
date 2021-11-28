// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
let db = cloud.database()
const _=db.command

// 云函数入口函数
exports.main = async (event, context) => {
  return await db.collection('order').where({
    _id:_.in(event.list),
    state:1
  }).update({
    data: {
      state:5,
    },
    success:res=>{
      console.log("订单状态变更成功",res);
    },
    fail:res=>{
      console.log("订单状态变更失败",res);
    }
  })
}