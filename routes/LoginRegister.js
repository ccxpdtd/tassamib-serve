const cors = require('cors')
const db = require('../db/db')
const express = require('express')
const jwt = require('jsonwebtoken') // ✅ 引入 JWT 模块

const router = express.Router()

router.use(cors())
router.use(express.json())//解析body

const SECRET_KEY = 'your-secret-key' // ✅ 自定义密钥，可放入 .env 文件中

// 用户登录接口
router.post('/api/login', (req, res) => {

  const { uname, psw } = req.body

  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?'

  db.query(sql, [uname, psw], (err, results) => {
    if (err) {
      console.error('数据库登录用户查询失败:', err)
      return res.status(500).send('登录失败')
    }

    if (results.length > 0) {
      const user = results[0]

      // ✅ 生成 token，包含用户 id 和用户名，可自行添加字段
      const token = jwt.sign(
        // { id: user.id, username: user.username, ava: user.avatar },
        { id: user.id, username: user.username, role: user.role },
        SECRET_KEY,
        { expiresIn: '2h' } // Token 两小时后过期
      )

      // ✅ 返回 token 给前端
      res.send({
        code: 200,
        ok: 1,
        msg: '登录成功',
        username: results[0].username,
        token,
        role: results[0].role
      })
    } else {
      res.send({ msg: '用户名或密码错误', ok: 0 })
    }
  })
})


//#region 册接口
router.post('/api/register', (req, res) => {
  const { uname, psw } = req.body

  const sql_select = 'SELECT * FROM users WHERE username = ?'
  db.query(sql_select, [uname], (err, result) => {
    if (err) return res.status(500).send('注册失败')
    else if (result.length > 0) {
      return res.send({ msg: '用户已存在', ok: 0 })
    } else {
      const sql = 'INSERT INTO users (username, password) VALUES (?, ?)'
      db.query(sql, [uname, psw], (err, result) => {
        if (err) return res.status(500).send('注册失败')
        res.send({ msg: '注册成功', ok: 1 })
      })
    }
  })

})

//#endregion

module.exports = router