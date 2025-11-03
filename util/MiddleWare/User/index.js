const db = require('../../../db')

const getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const sql = `select 
                  id,name,email,avatar,birthday,gender 
                  from users where email=?;
                `
    db.query(sql, [email], async (err, result) => {
      if (err) {
        console.log('获取数据失败', err.message);
        return reject(err)
      }
      resolve(result[0])
    })
  })
}

const getUserById = (user_id) => {
  return new Promise((resolve, reject) => {
    const sql = `select 
                  id,name,email,avatar,birthday,gender 
                  from users where id=?;
                `
    db.query(sql, [user_id], async (err, result) => {
      if (err) {
        console.error('操作数据库失败', {
          errMsg: err.message,
          sql: err.sql,
          params: [user_id]
        })
        return reject({ code: 500, msg: '获取个人信息失败' })
      }
      resolve({ code: 200, msg: '获取个人信息成功', userInfo: result[0] })
    })
  })
}

const getUserPassword_WM = (req, res, next) => {
  const { id } = req.body
  const sql = `select password
                  from users where id=?;
                `
  db.query(sql, [id], async (err, result) => {
    if (err) return res.status(500).send({ code: 500, msg: '操作失败' })
    req.body.user = result[0]
    next()
  })
}

const changeUserPassword = (password, user_id) => {
  return new Promise((resolve, reject) => {
    const sql = `update users set password=?  where id=?;`
    db.query(sql, [password, user_id], async (err, result) => {
      if (err) {
        console.error('操作数据库失败', {
          errMsg: err.message,
          sql: err.sql,
          params: [password, user_id]
        })
        return reject({ code: 500, msg: '修改密码失败' })
      }
      resolve({ code: 200, msg: '修改密码成功' })
    })
  })
}

const matchUser = async (results) => {
  // 1. 用map生成Promise数组
  const promiseResults = results.map(async (item) => {
    const { userInfo } = await getUserById(item.user_id)
    return {
      ...item,
      user_name: userInfo.name,
      user_avatar: userInfo.avatar
    }
  })
  // 2. 等待所有Promise完成，返回解析后的数组
  const matchedResults = await Promise.all(promiseResults)
  return matchedResults
}

module.exports = {
  matchUser,
  getUserByEmail,
  getUserById,
  changeUserPassword,
  getUserPassword_WM,
}