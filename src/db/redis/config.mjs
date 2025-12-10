import { createClient } from 'redis';
import { logger } from '../../config/logger.mjs';
import { config } from '../../config/env-loader.mjs';

// ✅ Constrói a URL corretamente
const redisHost = config.redis.host;
const redisPort = config.redis.port;
const redisUrl = `redis://${redisHost}:${redisPort}`;

export const REDIS_CONFIG = {
	URL: redisUrl,
	DB: config.redis.db,
	PREFIX: config.redis.prefix
};

logger.info(`Tentando conectar ao Redis em: ${redisUrl}`);

export const redisClient = createClient({
	url: REDIS_CONFIG.URL,
	database: REDIS_CONFIG.DB
});

export const connectRedis = async () => {
	try {
		await redisClient.connect();
		logger.info('Redis conectado com sucesso');
		return redisClient;
	} catch (error) {
		logger.error(error, 'Erro ao conectar ao Redis:');
		throw error;
	}
};

export const disconnectRedis = async () => {
	try {
		await redisClient.quit();
		logger.info('Redis desconectado');
	} catch (error) {
		logger.error(error, 'Erro ao desconectar Redis:');
	}
};