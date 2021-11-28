// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

let db = cloud.database()

function distance(la1, lo1, la2, lo2) {//单位km
  var La1 = la1 * Math.PI / 180.0;
  var La2 = la2 * Math.PI / 180.0;
  var La3 = La1 - La2;
  var Lb3 = lo1 * Math.PI / 180.0 - lo2 * Math.PI / 180.0;
  var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(La3 / 2), 2) + Math.cos(La1) * Math.cos(La2) * Math.pow(Math.sin(Lb3 / 2), 2)));
  s = s * 6378.137;
  s = Math.round(s * 10000) / 10000;
  s = s.toFixed(2);
  return s;
}

// 云函数入口函数
exports.main = async (event, context) => {
    console.log(event)
    const wxContext = cloud.getWXContext()
    if(event.type=='update_state2')
      return await db.collection('order').where({
        _id:event._id
      }).update({
        data: {
          state:2,
          order_taker_openid:event.order_taker_openid,
        },
        success:res=>{
          console.log("订单状态变更成功",res);
        },
        fail:res=>{
          console.log("订单状态变更失败",res);
        }
      })
    else if(event.type=='update_state3')
      return await db.collection('order').where({
        _id:event._id
      }).update({
        data: {
          state:3,
        },
        success:res=>{
          console.log("订单状态变更成功",res);
        },
        fail:res=>{
          console.log("订单状态变更失败",res);
        }
      })  
    else if(event.type=='update_state4')
      return await db.collection('order').where({
        _id:event._id
      }).update({
        data: {
          state:4,
        },
        success:res=>{
          console.log("订单状态变更成功",res);
        },
        fail:res=>{
          console.log("订单状态变更失败",res);
        }
      }) 
    else if(event.type=='update')
      return await db.collection('order').where({
        _id:event._id
      }).update({
        data: {
          start_position:event.new_order.start_position,
          end_position:event.new_order.end_position,
          price:event.new_order.price,
          end_time:event.new_order.end_time,
          order_details:event.new_order.order_details,
          state:1,
        },
        success:res=>{
          console.log("订单添加成功",res);
        },
        fail:res=>{
          console.log("订单添加失败", res);
        }
        }).then((res)=>{
          console.log('add 1')
        }).catch((err)=>{
          console.log('add 0')
      }) 
    else if(event.type=='insert')
      return await db.collection('order').add({
        data: event.new_order,
        success:res=>{
          console.log("订单添加成功",res);
        },
        fail:res=>{
          console.log("订单添加失败", res);
        }
      }).then((res)=>{
        console.log('add 1')
      }).catch((err)=>{
        console.log('add 0')
      })
    else if(event.type=='get_default'){//综合搜索
      return await db.collection('order').where({
          state:1
        }).get({
          success:res=>{
            console.log("订单查询成功",res);
          },
          fail:res=>{
            console.log("订单查询失败", res);
          }
      })
    }
    else if(event.type=='get_orderby_distance'){//距离优先搜索
      return await db.collection('order').where({
        state: 1
      }).orderBy('distance','asc').get({
        success:res=>{
          console.log("订单查询成功",res);
        },
        fail:res=>{
          console.log("订单查询失败", res);
        }
      })  
    }  
    else if(event.type=='get_orderby_endtime')//时间优先搜索
      return await db.collection('order').where({
        state: 1
      }).orderBy('endtime','asc').get({
        success:res=>{
          console.log("订单查询成功",res);
        },
        fail:res=>{
          console.log("订单查询失败", res);
        }
      })
    else if(event.type=='get_orderby_price')//价格优先搜索
      return await db.collection('order').where({
        state: 1
      }).orderBy('price','desc').get({
        success:res=>{
          console.log("订单查询成功",res);
        },
        fail:res=>{
          console.log("订单查询失败", res);
        }
      })
    else
      console.log('调用了不存在的order相关云函数')
}