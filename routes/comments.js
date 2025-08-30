const express = require('express')
const router = express.Router()
const db = require('../db/db') // 你自己的数据库连接模块

router.post('/api/publish_comment', (req, res) => {
  const { message_id, username, content } = req.body
  const sql = 'INSERT INTO comments (message_id,username,content) VALUES (?,?,?)'
  db.query(sql, [message_id, username, content], (err, result) => {
    if (err) return res.status(500).send({ ok: 0, msg: '评论失败' })
    if (result.affectedRows > 0) return res.send({ ok: 1, msg: '评论成功' })
  })

})

//处理回复删除接口
router.post('/api/delete_reply', (req, res) => {

  const { id } = req.body

  const sql = 'DELETE FROM comments WHERE id = ?'
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send({ ok: 0, msg: '删除回复失败' })
    if (result.affectedRows > 0) return res.send({ ok: 1, msg: '删除回复成功' })
  })
})







module.exports = router
