require('dotenv').config()
const express = require('express')
const Core = require('@alicloud/pop-core')

const router = express.Router()

const { verifyToken, verifyAdmin } = require('../util/MiddleWare/Auth');

// 初始化阿里云官方客户端
const client = new Core({
  accessKeyId: process.env.RAM_ACCESS_KEY_ID,
  accessKeySecret: process.env.RAM_ACCESS_KEY_SECRET,
  endpoint: 'https://sts.cn-shenzhen.aliyuncs.com',
  apiVersion: '2015-04-01'
})

router.get('/sts', verifyToken, (req, res) => {
  try {
    // 打印环境变量用于调试
    // console.log('===== 环境变量验证 =====')
    // console.log('RAM_ACCESS_KEY_ID:', process.env.RAM_ACCESS_KEY_ID ? '已配置' : '未配置')
    // console.log('RAM_ROLE_ARN:', process.env.RAM_ROLE_ARN || '未配置')
    // console.log('BUCKET_NAME:', process.env.BUCKET_NAME || '未配置')
    // console.log('REGION:', process.env.REGION || '未配置')

    // 验证必要环境变量
    if (!process.env.RAM_ACCESS_KEY_ID || !process.env.RAM_ACCESS_KEY_SECRET) {
      throw new Error('RAM_ACCESS_KEY_ID 或 RAM_ACCESS_KEY_SECRET 未配置')
    }
    if (!process.env.RAM_ROLE_ARN) {
      throw new Error('RAM_ROLE_ARN 未配置')
    }
    if (!process.env.BUCKET_NAME || !process.env.REGION) {
      throw new Error('BUCKET_NAME 或 REGION 未配置')
    }

    // console.log('1. 开始处理STS请求')

    // 构建请求参数
    const params = {
      "RoleArn": process.env.RAM_ROLE_ARN,
      "RoleSessionName": "upload-session-" + Date.now(), // 增加时间戳确保唯一性
      "DurationSeconds": 900,
      // 权限策略：限制仅能上传到指定路径
      "Policy": JSON.stringify({
        Version: '1',
        Statement: [{
          Effect: 'Allow',
          Action: [
            "oss:PutObject",
            "oss:PutObjectAcl" // 增加ACL权限，避免上传后访问问题
          ],
          Resource: [`acs:oss:*:*:${process.env.BUCKET_NAME}/uploads/*`]
        }]
      })
    }

    // console.log('2. 发送STS请求，RoleArn:', process.env.RAM_ROLE_ARN)

    // 发送请求
    client.request('AssumeRole', params, { method: 'POST' })
      .then((result) => {
        // console.log('3. STS请求成功，返回凭证:', {
        //   AccessKeyId: result.Credentials?.AccessKeyId,
        //   Expiration: result.Credentials?.Expiration
        // })

        if (!result.Credentials) {
          throw new Error('STS返回结果不包含有效凭证')
        }

        res.json({
          code: 200,
          data: {
            AccessKeyId: result.Credentials.AccessKeyId,
            AccessKeySecret: result.Credentials.AccessKeySecret,
            SecurityToken: result.Credentials.SecurityToken,
            Expiration: result.Credentials.Expiration,
            Bucket: process.env.BUCKET_NAME,
            Region: process.env.REGION
          }
        })
      })
      .catch((err) => {
        // 打印详细错误信息用于排查
        console.error('❌ STS请求失败详情:', {
          message: err.message,
          code: err.code,
          requestId: err.requestId,
          data: err.data
        })

        // 根据错误码返回更具体的提示
        let errorMsg = 'STS获取失败: ' + err.message
        if (err.code === 'AccessDenied') {
          errorMsg += '（可能是RAM权限不足，请检查子账号是否有AssumeRole权限）'
        } else if (err.code === 'InvalidRoleArn') {
          errorMsg += '（角色ARN格式错误，请检查RAM_ROLE_ARN配置）'
        }

        res.status(500).json({
          code: 500,
          msg: errorMsg,
          errorCode: err.code,
          requestId: err.requestId // 用于阿里云工单查询
        })
      })

  } catch (err) {
    console.error('❌ 处理请求时出错:', err.message)
    res.status(500).json({
      code: 500,
      msg: '服务器处理失败: ' + err.message
    })
  }
})

module.exports = router
