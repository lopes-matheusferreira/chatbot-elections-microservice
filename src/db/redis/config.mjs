import { createClient } from 'redis';
import { logger } from '../../config/logger.mjs';
import { config } from '../../config/env-loader.mjs';

export const REDIS_CONFIG = {
	URL: config.redis.host,
	DB: config.redis.db,
	PREFIX: config.redis.prefix
};

export const redisClient = createClient({
	url: REDIS_CONFIG.URL,
	database: REDIS_CONFIG.DB
});

export const connectRedis = async () => {
	return await redisClient.connect();
};

export const disconnectRedis = async () => {
	try {
		await redisClient.quit();
		logger.info('Redis desconectado');
	} catch (error) {
		logger.error(error, 'Erro ao desconectar Redis:');
	}
};
