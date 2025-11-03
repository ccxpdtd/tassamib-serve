require('dotenv').config()
const db = require('../db')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken') // ✅ 引入 JWT 模块

const express = require('express')
const router = express.Router()


const CODE_TTL = process.env.CODE_TTL;     // 验证码有效期
const SECRET_KEY = process.env.JWT_SECRET //token密钥

const redisClient = require('../redis/index');
const { sendVerifyEmail } = require('../mailer');
const {
  getCode,
  checkCode,
  checkRateLimit_MW,
  checkEmail_MW
} = require('../util/MiddleWare/EmailAndCode')
const { getUserByEmail } = require('../util/MiddleWare/User')



const { isUserExitMW, checkPassword_MW } = require('../util/MiddleWare/Login')

// 用户密码登录接口
router.post('/login', isUserExitMW, checkPassword_MW, (req, res) => {
  checkCode
  const user = req.body.user
  // ✅ 生成 token，包含用户 id 和用户名，可自行添加字段
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar
    },
    SECRET_KEY,
    { expiresIn: '2h' } // Token 两小时后过期
  )
  // ✅ 返回 token 给前端
  res.send({
    code: 200,
    msg: '登录成功',
    token,
  })
})



// 用户邮箱验证码登录接口
router.post('/loginByVerifyCode', checkEmail_MW, async (req, res) => {
  const { email, code } = req.body
  const ok = await checkCode(email, code)
  if (!ok) return res.send({ code: 201, msg: '验证码错误或过期' })

  const user = await getUserByEmail(email)
  // ✅ 生成 token，包含用户 id 和用户名，可自行添加字段
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      gender: user.gender,
      birdthday: user.birthday
    },
    SECRET_KEY,
    { expiresIn: '2h' } // Token 两小时后过期
  )
  // ✅ 返回 token 给前端
  res.send({
    code: 200,
    msg: '登录成功',
    token,
  })
})



// 发送邮箱验证码
router.post('/sendCode', checkEmail_MW, checkRateLimit_MW, async (req, res) => {
  try {
    const { email } = req.body;
    const code = getCode();
    await redisClient.set(`emailCode:${email}`, code, { EX: CODE_TTL });
    await sendVerifyEmail(email, code);
    res.send({ code: 200, msg: '验证码已发送' });
  } catch (err) {
    console.error('sendCode error:', err);
    res.status(500).send({ ok: 0, code: 500, msg: '验证码发送失败' });
  }
});

// 用户注册
router.post('/register', async (req, res) => {
  const { email, password, name, code } = req.body;
  const ok = await checkCode(email, code)
  if (!ok) return res.send({ code: 201, msg: '验证码错误或过期' })
  const hash = await bcrypt.hash(password, 10);
  const sql = 'INSERT INTO users (email, password, name) VALUES (?,?,?)';
  db.query(sql, [email, hash, name], (err, result) => {
    if (err)
      return res.status(500).send({ code: 500, msg: '注册失败' });
    return res.send({ code: 200, msg: '注册成功' });
  });
});


module.exports = router