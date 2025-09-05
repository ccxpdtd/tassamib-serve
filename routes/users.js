
const db = require('../db/db')

const express = require('express')
const router = express.Router()

const cors = require('cors')
router.use(cors())


//获取用户信息
router.post('/api/admin/get_user', (req, res) => {
  const { pageNo, limit } = req.body

  // 计算分页偏移量：(页号-1) * 每页条数（跳过前面的记录）
  const offset = (pageNo - 1) * limit;
  const userSql = `
    SELECT *
    FROM users 
    ORDER BY id 
    LIMIT ? OFFSET ?  
  `
  const totalSql = "select count(*) as total from users ;"


  db.query(userSql, [limit, offset], (error, user_result) => {
    if (error) {
      res.send({
        code: 201,
        message: '获取用户信息失败'
      })
    } else {
      //查询总数
      db.query(totalSql, (error, total_result) => {
        if (error) {
          res.send({
            code: 201,
            message: '获取用户数量失败'
          })
        } else {
          // console.log('user_result', user_result);

          res.send({
            code: 200,
            message: '获取用户信息成功',
            data: {
              user: user_result,
              total: total_result[0].total
            }
          })
        }
      })
    }
  })

})

//搜索用户
router.post('/api/admin/search_user', (req, res) => {
  const { username, pageNo, limit } = req.body
  const trimUsername = username.trim(); // 去除关键字前后空格
  const likeParam = `%${trimUsername}%`;
  // 计算分页偏移量：(页号-1) * 每页条数（跳过前面的记录）
  const offset = (pageNo - 1) * limit;
  const totalSql = "select count(*) as total from users WHERE username = ? ;"


  const sql = `
    SELECT *
    FROM users
    WHERE username LIKE ? 
    ORDER BY id
    LIMIT ? OFFSET ?;
  `

  db.query(totalSql, [likeParam], (err, total_result) => {
    if (err) {
      return res.status(500).send({
        code: 201,
        msg: '搜索失败'
      })
    } else {
      db.query(sql, [likeParam, limit, offset], (err, user_result) => {
        if (err) {
          return res.status(500).send({
            code: 201,
            msg: '搜索失败'
          })
        }
        if (user_result.length > 0) {
          return res.send({
            code: 200,
            msg: '搜索成功',
            user: [...user_result],
            total: total_result[0].total
          })
        } else {
          return res.send({
            code: 200,
            msg: '抱歉，没有这个用户',
            user: [],
            total: 0
          })
        }
      })

    }
  })
})

//创建新用户
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


//修改权限
router.post('/api/admin/change_psw', (req, res) => {
  const { id, password } = req.body

  const sql = `
   update users
   set password=?
   where id=?
  `
  db.query(sql, [password, id], (err, result) => {
    if (err) {
      return res.status(500).send({
        code: 201,
        msg: '更改密码失败'
      })
    }
    if (result.affectedRows > 0) {
      return res.send({
        code: 200,
        msg: '更改密码成功',
      })
    }
  })
})




module.exports = router