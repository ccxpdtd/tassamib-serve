require('dotenv').config()
const db = require('../../../db');
const redisClient = require('../../../redis/index');

const RATE_LIMIT_WINDOW = process.env.RATE_LIMIT_WINDOW;   // 60 秒发一次
const MAX_PER_HOUR = process.env.MAX_PER_HOUR;        // 每小时最多 10 次

//生成验证码
function getCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

//判断邮箱是否存在
const isEmailExist = (email) => {
  return new Promise((resolve, reject) => {
    const sql = `select * from users where email=?`
    db.query(sql, [email], (err, result) => {
      if (err) return reject({ ok: 0, msg: '邮箱鉴定失败' })
      if (result.length > 0) resolve({ ok: 1, flag: 1 })   // 邮箱存在
      else resolve({ ok: 1, flag: 0 })   // 邮箱不存在
    })
  })
}

// 验证验证码
const checkCode = async (email, code) => {
  const savedCode = await redisClient.get(`emailCode:${email}`);
  if (!savedCode || savedCode !== code) {
    return 0
  }
  return 1
}



const checkRateLimit_MW = async (req, res, next) => {
  const { email } = req.body
  const minuteKey = `rate:min:${email}`;
  const hourKey = `rate:hour:${email}`;

  const minuteCount = await redisClient.get(minuteKey);
  if (minuteCount && Number(minuteCount) >= 1)
    return res.send({ code: 201, msg: '请勿频繁发送' });

  const hourCount = await redisClient.get(hourKey);
  if (hourCount && Number(hourCount) >= MAX_PER_HOUR)
    return res.send({ code: 201, msg: '超过每小时发送上限' });

  await redisClient.multi()
    .incr(minuteKey).expire(minuteKey, RATE_LIMIT_WINDOW)
    .incr(hourKey).expire(hourKey, 60 * 60)
    .exec();
  next()
}



//判断邮件是否满足发验证码的条件
const checkEmail_MW = async (req, res, next) => {
  const { email, method } = req.body
  const result = await isEmailExist(email)
  if (!result.ok) return res.send({ code: 500, msg: result.msg })
  if (method === 'register' && result.flag === 1)
    return res.send({ code: 201, msg: '邮箱已存在，请直接登录' })
  if (method === 'login' && result.flag === 0)
    return res.send({ code: 201, msg: '邮箱不存在，请先注册' })
  if (method === 'forget' && result.flag === 0)//找回密码
    return res.send({ code: 201, msg: '邮箱不存在' })
  if (method === 'changeEmail' && result.flag === 1)//修改邮箱
    return res.send({ code: 201, msg: '邮箱已被绑定' })
  next()
}


module.exports = {
  getCode,
  isEmailExist,
  checkCode,
  checkEmail_MW,
  checkRateLimit_MW
}