const express = require('express')
const router = express.Router()
const db = require('../db/db') // 你自己的数据库连接模块


// 渲染comments，包含投稿与每条留言的评论
router.get('/api/get_comments', (req, res) => {
  const sql = `
                SELECT 
                id, message_id, username, content,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at
                FROM comments
                ORDER BY id DESC;
              `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).send({ code: 201, ok: 0, msg: '获取回复失败' });
    else {
      res.send({
        code: 200,
        ok: 1,
        msg: '获取回复成功',
        data: result
      });
    }
  })
})


router.post('/api/publish_comment', (req, res) => {
  const { message_id, username, content } = req.body
  const comment_sql = 'INSERT INTO comments (message_id,username,content) VALUES (?,?,?);'
  const message_sql = 'update messages set comment_count= comment_count+1 where id=?;'
  db.query(comment_sql, [message_id, username, content], (err, comment_result) => {
    if (err)
      return res.status(500).send({ code: 500, ok: 0, msg: '评论失败' })
    if (comment_result.affectedRows > 0) {
      db.query(message_sql, [message_id], (err, message_result) => {
        if (err)
          return res.status(500).send({ code: 500, ok: 0, msg: '关联留言失败' })
        if (message_result.affectedRows > 0)
          return res.status(200).send({ code: 201, ok: 1, msg: '评论成功' })
      })
    }
  })

})

//处理回复删除接口
router.post('/api/delete_reply', (req, res) => {

  const { id, mid } = req.body



  const comment_sql = 'DELETE FROM comments WHERE id = ?'
  const message_sql = 'update messages set comment_count= comment_count-1 where id=?;'

  db.query(comment_sql, [id], (err, comment_result) => {
    if (err)
      return res.status(500).send({ code: 500, ok: 0, msg: '删除回复失败' })
    if (comment_result.affectedRows > 0) {
      db.query(message_sql, [mid], (err, message_result) => {
        if (err)
          return res.status(500).send({ code: 500, ok: 0, msg: '关联留言失败' })
        if (message_result.affectedRows > 0)
          return res.status(200).send({ code: 200, ok: 1, msg: '删除回复成功' })
      })

    }
  })
})







module.exports = router
