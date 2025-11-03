require('dotenv').config()
const jwt = require('jsonwebtoken');
const db = require('../../../db');

const SECRET_KEY = process.env.JWT_SECRET //token密钥


// Token 有效期校验 + 用户状态二次确认中间件
const verifyToken = (req, res, next) => {
  try {
    // 1. 从请求头获取 Token（格式：Bearer <token>）
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send({ code: 401, msg: '请先登录' });
    }
    const token = authHeader.split(' ')[1]; // 提取 Bearer 后的 Token

    // 2. 校验 Token 有效性（JWT 自动校验有效期，过期会抛 TokenExpiredError）
    const decoded = jwt.verify(token, SECRET_KEY);

    // 3. 二次确认用户状态（防止 Token 有效但用户被禁用）
    const sql = 'SELECT state, role FROM users WHERE id = ?';
    db.query(sql, [decoded.id], (err, result) => {
      if (err) {
        return res.status(500).send({ code: 500, msg: '校验用户状态失败' });
      }
      if (result.length === 0) {
        return res.status(401).send({ code: 401, msg: '用户不存在' });
      }
      if (result[0].state === 0) {
        return res.status(403).send({ code: 403, msg: '用户已被禁用，请联系管理员' });
      }

      // 4. Token 有效 + 用户状态正常：将解析的用户信息挂载到 req，供后续接口使用
      req.user = {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
        role: result[0].role // 用数据库最新角色，避免 Token 中角色被篡改
      };
      next(); // 放行，进入接口逻辑
    });

  } catch (err) {
    // 5. 捕获 Token 相关错误（过期/无效）
    if (err.name === 'TokenExpiredError') {
      return res.status(401).send({ code: 401, msg: '登录已过期，请重新登录' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).send({ code: 401, msg: 'Token 无效（格式错误/被篡改）' });
    }
    // 其他未知错误
    console.error('Token 校验异常：', err);
    return res.status(500).send({ code: 500, msg: '服务器校验 Token 失败' });
  }
};



// 管理员权限校验（基于 verifyToken 之后，需放在 verifyToken 后面使用）
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).send({ code: 403, msg: '无管理员权限，无法访问' });
  }
};

module.exports = { verifyToken, verifyAdmin };