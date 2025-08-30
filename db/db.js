const mysql = require('mysql2');

// 创建连接
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'lmh',
  password: '123456',
  database: 'tassamib_db',
});

// 连接数据库
db.connect(err => {
  if (err) {
    console.error('❌数据库连接失败:', err);
    return;
  }
  console.log('✅数据库连接成功');
  console.log('连接的数据库:', db.config.database);
  console.log('连接的主机:', db.config.host);
  console.log('连接的用户:', db.config.user);
});

// 导出 db 连接
module.exports = db;
