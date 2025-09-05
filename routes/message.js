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


// 获取留言
router.get('/api/get_messages', (req, res) => {
  const message_sql = `
    SELECT 
      id, username, content,comment_count,
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
    if (err) return res.status(500).send({ code: 201, ok: 0, msg: '查询留言失败' });

    db.query(comment_sql, (err2, comments) => {
      if (err2) return res.status(500).send({ code: 201, ok: 0, msg: '查询评论失败' });

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
        code: 200,
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
    if (err) return res.status(500).send({ code: 201, ok: 0, msg: '删除失败' })
    if (result.affectedRows > 0) return res.send({ code: 200, ok: 1, msg: '删除成功' })
  })
})


// 先封装 db.query 为 Promise 格式，解决异步顺序问题
const queryPromise = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) {
        reject(err); // 数据库错误时 reject
      } else {
        resolve(result); // 成功时返回查询结果
      }
    });
  });
};

// 搜索留言（修复版）
router.post('/api/admin/search_messages', async (req, res) => {
  try {
    const { key } = req.body;

    const trimKey = key.trim(); // 去除关键字前后空格

    // 2. 模糊查询 SQL（用 LIKE + % 实现“包含关键字”匹配，避免精确匹配）
    // 按用户名模糊查询（忽略大小写，不同数据库语法可能不同，MySQL 用 LOWER）
    const unameSql = `
                      SELECT 
                        *, 
                        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at 
                      FROM messages 
                      WHERE LOWER(username) LIKE LOWER(?)
                    `;
    // 按内容模糊查询
    const contentSql = `
                        SELECT 
                          *, 
                          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at 
                        FROM messages 
                        WHERE LOWER(content) LIKE LOWER(?)
                      `;
    const likeParam = `%${trimKey}%`; // 拼接模糊匹配参数（% 表示任意字符）

    // 3. 并行执行两个查询（用 Promise.all 提高效率，避免串行等待）
    const [unameResult, contentResult] = await Promise.all([
      queryPromise(unameSql, [likeParam]),
      queryPromise(contentSql, [likeParam])
    ]);

    // 4. 合并结果并去重（避免同一留言被重复返回）
    // 用 Map 基于留言的唯一 ID 去重（假设表中有 id 字段作为主键）
    const messageMap = new Map();
    // 先添加用户名匹配的结果
    unameResult.forEach(msg => messageMap.set(msg.id, msg));
    // 再添加内容匹配的结果（若 ID 已存在，会覆盖重复项）
    contentResult.forEach(msg => messageMap.set(msg.id, msg));
    // 转为数组（去重后的最终结果）
    const messages = Array.from(messageMap.values());

    // 5. 返回结果
    if (messages.length > 0) {
      return res.status(200).send({
        code: 200,
        msg: `共找到 ${messages.length} 条相关留言`,
        messages
      });
    } else {
      return res.status(200).send({
        code: 200,
        msg: '抱歉，没有相关留言',
        messages: []
      });
    }

  } catch (err) {
    // 统一捕获所有错误（数据库错误、参数错误等）
    console.error('搜索留言失败：', err);
    return res.status(500).send({
      code: 500,
      msg: '服务器内部错误，搜索失败',
      messages: []
    });
  }
});



module.exports = router