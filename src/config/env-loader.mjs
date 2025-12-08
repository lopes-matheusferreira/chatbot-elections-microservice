import { logger } from './logger.mjs';

function required(name) {
  const value = process.env[name];
  if (!value) {
    logger.error(`Variável de ambiente ${name} faltando`);
    throw new Error(`Variável de ambiente ${name} é obrigatória`);
  }
  return value;
}

export const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'production',
  apiKey: required('API_KEY'),

  database: {
    host: required('DB_HOST'),
    name: required('DB_NAME'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    port: Number(process.env.DB_PORT || 3306),
  },

  redis: {
    host: required('REDIS_HOST'),
    port: Number(process.env.REDIS_PORT || 6379),
    db: Number(process.env.REDIS_DB || 0),
    prefix: process.env.REDIS_PREFIX || 'eleicoes-chatbot',
  },
};
