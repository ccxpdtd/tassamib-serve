const db = require('../db')
const express = require('express')

const router = express.Router()

const { matchUser } = require('../util/MiddleWare/User')

const { verifyToken, verifyAdmin } = require('../util/MiddleWare/Auth')

//处理用户留言接口
router.post('/publish_message', verifyToken, (req, res) => {
  const { user_id, msg } = req.body
  const sql = 'INSERT INTO messages (user_id,content) VALUES (?,?)'
  db.query(sql, [user_id, msg], (err, result) => {
    if (err) return res.status(500).send({ code: 500, msg: '留言失败' })
    if (result.affectedRows > 0) return res.send({ code: 200, msg: '留言成功' })
  })
})

//获取评论表
const getComments = async () => {
  return new Promise((resolve, reject) => {
    const sql = `select * from comments;`
    db.query(sql, (err, result) => {
      if (err) {
        console.log('获取留言回复表数据失败\n', err.message);
        return reject(err)
      }
      resolve(result)
    })
  })
}


//封装留言信息
const handleMessages = async (results) => {
  const messages = await matchUser(results)
  const comments = await getComments()
  const messagesWithComments = await Promise.all(
    messages.map(async (m) => {
      // 筛选当前留言的所有评论
      let comments_m = comments.filter(c => c.message_id === m.id)
      // 匹配评论的用户（等待异步完成）
      comments_m = await matchUser(comments_m)
      return {
        ...m,
        comments: comments_m
      }
    })
  )
  return messagesWithComments

}
//获取留言
router.get('/get_messages', (req, res) => {
  const sql = `
                SELECT * FROM messages 
                ORDER BY created_at DESC;
              `;
  db.query(sql, async (err, result) => {
    if (err) {
      console.error('操作数据库失败', {
        errMsg: err.message,
        sql: err.sql,

      })
      return res.status(500).send({ code: 201, msg: '获取留言失败' });
    }
    const messages = await handleMessages(result)
    // console.log('messages', messages);

    return res.send({ code: 200, msg: '获取留言成功', messages });
  })
})


//处理留言删除接口
router.post('/delete_message', verifyToken, (req, res) => {

  const { id } = req.body
  const sql = 'DELETE FROM messages WHERE id = ?'
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send({ code: 500, msg: '删除留言失败' })
    if (result.affectedRows > 0) return res.send({ code: 200, msg: '删除留言成功' })
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
router.post('/admin/search_messages', async (req, res) => {
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