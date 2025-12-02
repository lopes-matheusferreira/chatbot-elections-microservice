import dotenv from 'dotenv';
dotenv.config();
import { logger } from './logger.mjs';

function required(name) {
	const value = process.env[name];
	if (!value) {
		logger.error(`Variável de ambiente ${name} faltando`);
		throw new Error(`Variável de ambiente ${name} é obrigatória!`);
	}
	return value;
}

export const config = {

	port: process.env.PORT || 3000,
	env: process.env.NODE_ENV || 'development',
	apiKey: required('API_KEY'),
  
	database: {
		host: required('DB_HOST'),
		name: required('DB_NAME'),
		user: required('DB_USER'),
		password: required('DB_PASSWORD'),
		port: process.env.DB_PORT || 3306
	},
  
	redis: {
		host: process.env.REDIS_HOST || 'localhost',
		db: parseInt(process.env.REDIS_DB || '0'),
		port: parseInt(process.env.REDIS_PORT || '6379'),
		prefix: process.env.REDIS_PREFIX || 'eleicoes-chatbot'
	}

};
