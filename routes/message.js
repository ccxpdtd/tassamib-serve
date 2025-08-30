const cors = require('cors')
const db = require('../db/db')
const express = require('express')

const router = express.Router()

router.use(cors())
router.use(express.json())//解析body

//处理用户留言接口
router.post('/api/publish_message', (req, res) => {
  const { uname, msg } = req.body
  const sql = 'INSERT INTO messages (username,content) VALUES (?,?)'
  db.query(sql, [uname, msg], (err, result) => {
    if (err) return res.status(500).send({ ok: 0, msg: '评论失败' })
    if (result.affectedRows > 0) return res.send({ ok: 1, msg: '评论成功' })
  })
})

// 渲染comments，包含投稿与每条留言的评论
router.get('/api/get_messages', (req, res) => {
  const message_sql = `
    SELECT 
      id, username, content,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at 
    FROM messages 
    ORDER BY id DESC;
  `;

  const comment_sql = `
    SELECT 
      id, message_id, username, content,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at
    FROM comments
    ORDER BY created_at ASC;
  `;

  db.query(message_sql, (err, messages) => {
    if (err) return res.status(500).send({ ok: 0, msg: '查询留言失败' });

    db.query(comment_sql, (err2, comments) => {
      if (err2) return res.status(500).send({ ok: 0, msg: '查询评论失败' });

      // 把评论挂载到对应留言上
      const messageMap = {};
      messages.forEach(msg => {
        msg.replies = []; // 添加一个 replies 字段
        messageMap[msg.id] = msg;
      });

      comments.forEach(cmt => {
        if (messageMap[cmt.message_id]) {
          messageMap[cmt.message_id].replies.push(cmt);
        }
      });

      res.send({
        ok: 1,
        msg: '获取留言及评论成功',
        data: messages
      });
    });
  });
});


//处理留言删除接口
router.post('/api/delete_message', (req, res) => {

  const { id } = req.body

  const sql = 'DELETE FROM messages WHERE id = ?'
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send({ ok: 0, msg: '删除失败' })
    if (result.affectedRows > 0) return res.send({ ok: 1, msg: '删除成功' })
  })
})

module.exports = router