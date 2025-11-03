const express = require('express')
const router = express.Router()
const db = require('../db') // 你自己的数据库连接模块

const { verifyToken, verifyAdmin } = require('../util/MiddleWare/Auth')

// 渲染comments，包含投稿与每条留言的评论
router.get('/get_comments', (req, res) => {
  const sql = `
                SELECT 
                id, message_id, username, content,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at
                FROM comments
                ORDER BY id DESC;
              `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).send({ code: 500, msg: '获取回复失败' });
    else {
      res.send({
        code: 200,
        msg: '获取回复成功',
        data: result
      });
    }
  })
})


router.post('/publish_comment', verifyToken, (req, res) => {
  const { message_id, user_id, content } = req.body
  const comment_sql = 'INSERT INTO comments (message_id,user_id,content) VALUES (?,?,?);'
  const message_sql = 'update messages set comment_count= comment_count+1 where id=?;'
  db.query(comment_sql, [message_id, user_id, content], (err, comment_result) => {
    if (err) {
      console.error('操作数据库失败', {
        errMsg: err.message,
        sql: err.sql,
        params: [message_id, user_id, content]
      })
      return res.status(500).send({ code: 500, msg: '评论失败' })
    }
    if (comment_result.affectedRows > 0) {
      db.query(message_sql, [message_id], (err, message_result) => {
        if (err) {
          console.error('操作数据库失败', {
            errMsg: err.message,
            sql: err.sql,
            params: [message_id]
          })
          return res.status(500).send({ code: 500, msg: '关联留言失败' })
        }
        if (message_result.affectedRows > 0)
          return res.status(200).send({ code: 200, msg: '评论成功' })
      })
    }
  })

})

//处理回复删除接口
router.post('/delete_reply', verifyToken, (req, res) => {

  const { id, mid } = req.body

  const comment_sql = 'DELETE FROM comments WHERE id = ?'
  const message_sql = 'update messages set comment_count= comment_count-1 where id=?;'

  db.query(comment_sql, [id], (err, comment_result) => {
    if (err)
      return res.status(500).send({ code: 500, msg: '删除回复失败' })
    if (comment_result.affectedRows > 0) {
      db.query(message_sql, [mid], (err, message_result) => {
        if (err)
          return res.status(500).send({ code: 500, msg: '关联留言失败' })
        if (message_result.affectedRows > 0)
          return res.status(200).send({ code: 200, msg: '删除回复成功' })
      })

    }
  })
})







module.exports = router
