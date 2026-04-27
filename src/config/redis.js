const Redis = require('ioredis');

// Default to localhost if REDIS_URL is not provided
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  // Retry strategy to prevent crashing if Redis is temporarily down
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false, // Don't queue commands if Redis is disconnected (fail fast)
});

redis.on('connect', () => {
  console.log('📦 Connected to Redis');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

module.exports = redis;
