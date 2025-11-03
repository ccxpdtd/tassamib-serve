const db = require('../db')

const express = require('express')
const router = express.Router()

const bcrypt = require('bcryptjs');

const { verifyToken } = require('../util/MiddleWare/Auth')


//获取用户信息
router.post('/admin/get_user', (req, res) => {
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
router.post('/admin/search_user', (req, res) => {
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
router.post('/admin/add_user', (req, res) => {
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
router.post('/admin/del_user', (req, res) => {
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
router.post('/admin/change_role', (req, res) => {
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
router.post('/admin/change_psw', (req, res) => {
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

const { changeUserPassword, getUserById } = require('../util/MiddleWare/User')

const { checkPassword_MW } = require('../util/MiddleWare/Login')
const { getUserPassword_WM } = require('../util/MiddleWare/User')
const { checkCode } = require('../util/MiddleWare/EmailAndCode')

//用户修改邮箱
router.post('/change_email', async (req, res) => {
  const { id, email, code } = req.body
  const ok = await checkCode(email, code)
  if (!ok) return res.send({ code: 201, msg: '验证码错误或过期' })
  const sql = 'update users set email=? where id=?';
  db.query(sql, [email, id,], (err, result) => {
    if (err)
      return res.status(500).send({ code: 500, msg: '修改邮箱失败' });
    return res.send({ code: 200, msg: '修改邮箱成功' });
  });
})

//用户修改密码
router.post('/change_password', getUserPassword_WM, checkPassword_MW, async (req, res) => {
  const { id, newPassword } = req.body
  const hash = await bcrypt.hash(newPassword, 10);
  const result = await changeUserPassword(hash, id)
  return res.send(result)
})

//用户修改个人信息
router.post('/change_myinfo', async (req, res) => {
  const { id, name, gender, birthday } = req.body
  const sql = `update users set name=?,gender=?,birthday=? where id=?;`
  db.query(sql, [name, gender, birthday, id], async (err, result) => {
    if (err) return res.status(500).send({ code: 500, msg: '修改个人信息失败' })
    return res.send({ code: 200, msg: '修改个人信息成功' })
  })
})

router.post('/change_avatar', verifyToken, (req, res) => {
  const { id, avatar } = req.body
  const sql = `update users set avatar=? where id=?`
  db.query(sql, [avatar, id], (err, result) => {
    if (err)
      return res.status(500).send({ code: 500, msg: '修改头像失败' });
    if (result.affectedRows > 0)
      return res.send({ code: 200, msg: '修改头像成功' });
  })
})

//用户获取个人信息
router.get('/get_myinfo', async (req, res) => {
  const { id } = req.query
  const result = await getUserById(id)
  return res.send(result)
})

//用户获取管理员信息
router.get('/get_adminInfo', async (req, res) => {
  const sql = `select avatar,name from users where role='admin';`
  db.query(sql, async (err, result) => {
    if (err) return res.status(500).send({ code: 500, msg: '获取管理员信息失败' })
    return res.send({ code: 200, msg: '获取管理员信息成功', admin: result[0] })
  })
})



module.exports = router