const { createClient } = require('redis');
require('dotenv').config()

const url = process.env.REDIS_URL;
const redisClient = createClient({ url });

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect()
  .then(() => console.log('✅ Redis connected'))
  .catch(err => console.error('Redis connect failed', err));

module.exports = redisClient;
