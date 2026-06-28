const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
    enableReadyCheck: false
});



module.exports = redis;