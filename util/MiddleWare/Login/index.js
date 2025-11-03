const db = require('../../../db')
const bcrypt = require('bcryptjs');

//密码登录：查看用户是否存在
const isUserExitMW = (req, res, next) => {
  const { name } = req.body
  const sql = 'SELECT * FROM users WHERE name = ? ;'
  db.query(sql, [name], (err, result) => {
    if (err) {
      console.error('操作数据库失败', {
        errMsg: err.message,
        sql: err.sql,
        params: [name]
      })
      return res.status(500).send({ msg: '登录出错,请联系管理员' })
    }
    if (result.length === 0)
      return res.send({ code: 201, msg: '抱歉，没有这个用户' })
    else if (result.length > 0 && result[0].state === 0) {
      return res.send({ code: 201, msg: '该用户已被禁用,请联系管理员' })
    } else {
      req.body.user = result[0]
      next()
    }
  })
}
//密码登录：校对密码
const checkPassword_MW = async (req, res, next) => {
  const { password } = req.body
  const match = await bcrypt.compare(password, req.body.user.password);
  if (!match) return res.send({ code: 201, msg: '密码错误' });
  else
    next()
}




module.exports = {
  isUserExitMW,
  checkPassword_MW
}