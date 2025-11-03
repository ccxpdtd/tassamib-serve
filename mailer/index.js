const nodemailer = require('nodemailer');
require('dotenv').config()

// 配置阿里云邮件推送的SMTP服务（已通过环境变量动态获取）
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtpdm.aliyun.com',  // 明确默认值为阿里云服务器
  port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 465,
  secure: process.env.MAIL_SECURE ? process.env.MAIL_SECURE === 'true' : true,
  auth: {
    user: process.env.MAIL_USER,  // 现在是 verify@tassamib.top
    pass: process.env.MAIL_PASS   // 阿里云的SMTP密码
  }
});

// 验证邮件服务是否可用
transporter.verify().then(() => {
  console.log('✅ Mailer ready');
}).catch(err => {
  console.error('Mailer verify failed:', err);
  console.error('请检查：1. MAIL_PASS是否为阿里云SMTP密码 2. 域名是否完成验证');
});



//发送验证码邮件
async function sendVerifyEmail(to, code) {
  const purposeText = '注册'
  const subject = `【tassamib】验证码：${code}`;
  // 优化HTML内容，确保格式正确
  const html = `
    <div style="font-family: sans-serif;">
      <p>【tassamib】</p>
      <p>您正在进行${purposeText}操作，</p>
      <p>验证码：<b style="color:#165DFF; font-size:18px; letter-spacing: 2px;">${code}</b></p>
      <p>有效期：5分钟内有效</p>
      <p style="color:#666; font-size:12px;">如非本人操作，请忽略此邮件，账号安全不受影响</p>
    </div>
  `;

  try {
    const result = await transporter.sendMail({
      from: `"tassamib" <${process.env.MAIL_USER}>`,
      sender: "bb <" + process.env.MAIL_USER + ">",  // 新增：强制指定发件人信息
      to,
      subject,
      html
    });
    // console.log('result',result);

    console.log(`验证码已发送至 ${to}`);
    return result;
  } catch (error) {
    console.error(`验证码发送至 ${to} 失败:`, error);
    throw error;  // 抛出错误让调用方处理
  }
}

module.exports = { sendVerifyEmail };
