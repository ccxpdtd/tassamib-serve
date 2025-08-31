const express = require('express')
const LoginRegister_r = require('./routes/LoginRegister')
const message_r = require('./routes/message')//处理发布评论的路由
const ramblings_r = require('./routes/ramblings')//处理发布评论的路由
const articles_r = require('./routes/articles')//处理用户登录的路由
const comments_r = require('./routes/comments')//处理用户登录的路由
const users_r = require('./routes/users')//处理用户登录的路由

const app = express()
app.use(message_r)
app.use(ramblings_r)
app.use(articles_r)
app.use(comments_r)
app.use(LoginRegister_r)
app.use(users_r)

app.listen(9001, () => {
  console.log("服务器已启动：9001");

})