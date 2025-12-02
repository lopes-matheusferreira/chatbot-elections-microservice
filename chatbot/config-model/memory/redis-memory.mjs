import { RedisSaver } from '@langchain/langgraph-checkpoint-redis';
import { redisClient, REDIS_CONFIG } from '../../../src/db/redis/config.mjs';

export const memory = new RedisSaver(redisClient, {
	prefix: REDIS_CONFIG.PREFIX
});
