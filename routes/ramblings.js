const cors = require('cors')
const db = require('../db/db')
const express = require('express')

const router = express.Router()

router.use(cors())
router.use(express.json())//解析body

//处理发布碎碎念接口
router.post('/api/publish_rambling', (req, res) => {
  const { content, img } = req.body
  // console.log(req.body);

  const sql = 'INSERT INTO ramblings (content,image_url) VALUES (?,?)'
  db.query(sql, [content, img], (err, result) => {
    if (err) return res.status(500).send({ ok: 0, msg: '发布失败' })
    if (result.affectedRows > 0) return res.send({ ok: 1, msg: '发布成功' })
  })
})

// 渲染碎碎念
router.get('/api/get_ramblings', (req, res) => {

  const sql =
    `  SELECT 
      id, content,image_url,
      like_count,
      comment_count,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at
      FROM ramblings
      ORDER BY id DESC
    ;`

  db.query(sql, (err, message) => {
    if (err) return res.status(500).send({ ok: 0, msg: '获取碎碎念失败' });
    if (message.length > 0) {
      res.send({
        ok: 1,
        msg: '获取碎碎念成功',
        data: message
      })

    }
  });
});


//处理碎碎念删除接口
router.post('/api/delete_rambling', (req, res) => {

  const { id } = req.body
  const sql = 'DELETE FROM ramblings WHERE id = ?'
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send({ ok: 0, msg: '删除失败' })
    if (result.affectedRows > 0) return res.send({ ok: 1, msg: '删除成功' })
  })
})

//#region 处理碎碎念点赞接口
/* 
router.post('/api/handle_like', (req, res) => {
  const { id, uname } = req.body

  const selectLike_sql = `  SELECT id FROM ram_like Where rambling_id=? AND username=?;`

  db.query(selectLike_sql, [id, uname], (err, target_ram) => {

    if (err) return res.status(500).send({ ok: 0, msg: '查询点赞失败' });
    var updateLikeCount_sql
    if (target_ram.length > 0) {//有点赞记录就取消点赞---删除记录
      // console.log(target_ram);

      const delLike_sql = 'DELETE FROM ram_like WHERE id = ?'
      db.query(delLike_sql, [target_ram[0].id], (err, result) => {
        if (err) return res.status(500).send({ ok: 0, msg: '取消点赞失败' });
        if (result.affectedRows > 0) {
          updateLikeCount_sql = 'UPDATE ramblings SET like_count = like_count - 1 WHERE id = ?'
          db.query(updateLikeCount_sql, [id], (err, updateResult) => {
            if (err) return res.status(500).send({ ok: 0, msg: '更新点赞数失败' })
            return res.send({ ok: 1, msg: '取消点赞成功' })
          })
        }
      })

    } else {//无点赞记录，点赞---插入记录

      const insert_sql = 'INSERT INTO ram_like (rambling_id,username) VALUES (?,?)'
      db.query(insert_sql, [id, uname], (err, result) => {
        if (err) return res.status(500).send({ ok: 0, msg: '点赞失败' })
        if (result.affectedRows > 0) {
          updateLikeCount_sql = 'UPDATE ramblings SET like_count = like_count + 1 WHERE id = ?'
          db.query(updateLikeCount_sql, [id], (err, updateResult) => {
            if (err) return res.status(500).send({ ok: 0, msg: '更新点赞数失败' })
            return res.send({ ok: 1, msg: '点赞成功' })
          })

        }
      })
    }
  });
}) */
//#endregion


module.exports = router