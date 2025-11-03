const express = require('express')
const app = express()

const router = require('./routes/index')



app.use(router)



app.listen(9001, () => {
  console.log("服务器已启动：9001");

})