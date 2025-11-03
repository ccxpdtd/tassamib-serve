const express = require('express')
const router = express()
router.use(express.json())//解析body

const cors = require('cors');
// router.use(cors({
//   origin: 'http://localhost',  // 前端实际运行的地址
//   methods: ['GET', 'POST'],
//   credentials: true
// }));
router.use(cors({
  origin: 'http://tassamib.top', // 前端实际域名（必须精确匹配，不带端口除非前端有自定义端口）
  credentials: true, // 若前端需要携带 cookie/token，必须设为 true
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 允许的请求方法
  allowedHeaders: ['Content-Type', 'Authorization'] // 允许的请求头（如 token 放在 Authorization 里）
}))

const LoginRegister_r = require('./LoginRegister')
router.use(LoginRegister_r)
const message_r = require('./message')
router.use(message_r)
const ramblings_r = require('./ramblings')
router.use(ramblings_r)
const articles_r = require('./articles')
router.use(articles_r)
const comments_r = require('./comments')
router.use(comments_r)
const users_r = require('./users')
router.use(users_r)
const cloud_r = require('./cloud.js')
router.use('/oss', cloud_r)

module.exports = router




