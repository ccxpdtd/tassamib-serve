const db = require('../db')

const express = require('express')
const router = express.Router()


const { verifyToken, verifyAdmin } = require('../util/MiddleWare/Auth')
const { matchUser } = require('../util/MiddleWare/User')

// 处理发布碎碎念接口
router.post('/publish_rambling', verifyToken, verifyAdmin, (req, res) => {
  const { user_id, content } = req.body;

  // 单条 INSERT 语句，用 LAST_INSERT_ID() 直接作为返回字段
  const sql = 'INSERT INTO ramblings (user_id, content) VALUES (?, ?);';

  db.query(sql, [user_id, content], (err, result) => {
    if (err) {
      console.error('操作数据库失败', {
        errMsg: err.message,
        sql: err.sql,
        params: [user_id, content]
      });
      return res.status(500).send({ code: 500, msg: '发布碎碎念失败' });
    }

    // 关键：result.insertId 就是刚插入的自增 ID（mysql 模块原生支持）
    const ramblingId = result.insertId;

    if (result.affectedRows > 0) {
      return res.send({
        code: 200,
        msg: '发布碎碎念成功',
        rambling_id: ramblingId // 返回 ID
      });
    }
  });
});


// 处理发布碎碎念图片接口（支持多图）
router.post('/publish_photos', verifyToken, verifyAdmin, (req, res) => {
  const { rambling_id, imgs } = req.body;

  // 1. 校验参数：确保 rambling_id 存在，且 imgs 是数组且非空
  if (!rambling_id || !Array.isArray(imgs) || imgs.length === 0) {
    return res.status(400).send({ code: 400, msg: '参数错误：缺少rambling_id或图片数组' });
  }

  // 2. 格式化批量插入的参数：[[rambling_id, img1], [rambling_id, img2], ...]
  const values = imgs.map(imgUrl => [rambling_id, imgUrl]);

  // 3. 批量插入SQL（VALUES ? 支持数组批量插入）
  const sql = 'INSERT INTO photos (rambling_id, img) VALUES ?';

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error('操作数据库失败', {
        errMsg: err.message,
        sql: err.sql,
        params: [rambling_id, imgs]
      });
      return res.status(500).send({ code: 500, msg: '发布照片失败' });
    }

    // 4. 返回成功信息（包含插入的图片数量）
    if (result.affectedRows > 0) {
      return res.send({
        code: 200,
        msg: `发布照片成功，共${result.affectedRows}张`,
        count: result.affectedRows // 可选：返回插入的图片数量
      });
    }
  });
});

const { matchPhotos } = require('../util/MiddleWare/Photo')

const handleRamblings = async (result) => {
  const ramblings = await matchUser(result)
  return await matchPhotos(ramblings)
}

// 渲染碎碎念
router.get('/get_ramblings', (req, res) => {

  const sql = `  SELECT * FROM ramblings ORDER BY id DESC ;`
  db.query(sql, async (err, result) => {
    if (err) {
      console.error('操作数据库失败', {
        errMsg: err.message,
        sql: err.sql
      })
      return res.status(500).send({ code: 500, msg: '获取碎碎念失败' });
    }
    const ramblings = await handleRamblings(result)
    res.send({
      code: 200,
      msg: '获取碎碎念成功',
      ramblings
    })


  });
});


//处理碎碎念删除接口
router.post('/delete_rambling', verifyToken, verifyAdmin, (req, res) => {

  const { id } = req.body
  const sql = 'DELETE FROM ramblings WHERE id = ?'
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send({ code: 500, msg: '删除失败' })
    if (result.affectedRows > 0) return res.send({ code: 200, msg: '删除成功' })
  })
})


module.exports = router