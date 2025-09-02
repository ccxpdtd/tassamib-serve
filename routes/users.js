
const db = require('../db/db')

const express = require('express')
const router = express.Router()

const cors = require('cors')
router.use(cors())


//获取用户信息
router.get('/api/admin/get_user', (req, res) => {

  const sql = 'select * from users;'

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).send({
        code: 201,
        msg: '获取用户信息失败'
      })
    }
    if (result.length > 0) {
      return res.send({
        code: 200,
        msg: '获取用户信息成功',
        data: result
      })
    }
  })

})


router.post('/api/admin/add_user', (req, res) => {
  const { username, password, role } = req.body
  const sql = `
    insert into users
    (username,password,role)
    values(?,?,?)
  `
  db.query(sql, [username, password, role], (err, result) => {
    if (err) {
      return res.status(500).send({
        code: 201,
        msg: '添加用户失败'
      })
    }
    if (result.affectedRows > 0) {
      return res.send({
        code: 200,
        msg: '添加用户成功',
      })
    }
  })
})

//删除用户
router.post('/api/admin/del_user', (req, res) => {
  const { id } = req.body
  const sql = `
    delete from users
    where id=?
  `
  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).send({
        code: 201,
        msg: '删除用户失败'
      })
    }
    if (result.affectedRows > 0) {
      return res.send({
        code: 200,
        msg: '删除用户成功',
      })
    }
  })
})


//修改权限
router.post('/api/admin/change_role', (req, res) => {
  const { id, role } = req.body

  const sql = `
   update users
   set role=?
   where id=?
  `
  db.query(sql, [role, id], (err, result) => {
    if (err) {
      return res.status(500).send({
        code: 201,
        msg: '更改权限失败'
      })
    }
    if (result.affectedRows > 0) {
      return res.send({
        code: 200,
        msg: '更改权限成功',
      })
    }
  })
})




module.exports = router