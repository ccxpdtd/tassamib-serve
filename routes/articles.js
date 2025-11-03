// routes/article.js
const express = require('express')
const router = express.Router()
const db = require('../db') // 你自己的数据库连接模块

// 上传文章（只有管理员可以上传）
router.post('/uploadArticle', (req, res) => {
  const { uname, title, description, author, content } = req.body;

  // 先查这个用户名的 role
  const checkUserSql = 'SELECT role FROM users WHERE username = ?';
  db.query(checkUserSql, [uname], (err, results) => {
    if (err) {
      console.error('查询用户权限失败:', err);
      return res.status(500).json({ code: 500, msg: '服务器错误' });
    }

    if (results.length === 0) {
      return res.status(403).json({ code: 201, msg: '用户不存在' });
    }

    const role = results[0].role;
    if (role !== 'admin') {
      return res.status(403).json({ code: 201, msg: '你没有权限发布文章' });
    }

    // 插入文章
    const insertSql = 'INSERT INTO articles (title,description,author,uname, content) VALUES (?, ?,?,?,?)';
    db.query(insertSql, [title, description, author, uname, content], (err2, result) => {
      if (err2) {
        console.error('插入文章失败:', err2);
        return res.status(500).json({ code: 200, msg: '文章上传失败' });
      }

      res.json({ code: 200, msg: '文章上传成功' });
    });
  });
});

// 读取所有文章接口
router.get('/get_articles', (req, res) => {

  const sql = `SELECT 
                id, 
                title, 
                description, 
                author, 
                content, 
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS date 
                FROM articles 
                ORDER BY created_at DESC;`;


  db.query(sql, (err, results) => {
    if (err) {
      console.error('查询文章失败:', err);
      return res.json({
        code: 500,
        msg: '查询失败'
      });
    }
    res.send({
      code: 200,
      msg: '读取文章成功',
      articles: results
    });
  });

});

//删除指定文章
router.post('/delete_article/:id', (req, res) => {

  const id = req.params.id;
  const sql = 'DELETE FROM articles WHERE id = ?'
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send({ code: 500, msg: '删除文章失败' })
    if (result.affectedRows > 0) return res.send({ code: 200, msg: '删除文章成功' })
  })

})

//获取指定文章
router.get('/get_article/:id', (req, res) => {

  const id = req.params.id;

  const sql = 'select * from articles WHERE id = ?'

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send({ code: 500, msg: '获取文章失败' })
    return res.send({
      code: 200,
      msg: '获取文章成功',
      article: result[0]
    })
  })
})

module.exports = router
