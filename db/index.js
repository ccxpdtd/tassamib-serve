require('dotenv').config()
const mysql = require('mysql2');


// 创建连接
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// 连接数据库
db.connect(err => {
  if (err) {
    console.error('❌数据库连接失败:', err);
    return;
  }
  console.log('✅数据库连接成功');
  console.log('    连接的数据库:', db.config.database);
  console.log('    连接的主机:', db.config.host);
  console.log('    连接的用户:', db.config.user);
});

// 导出 db 连接
module.exports = db;
