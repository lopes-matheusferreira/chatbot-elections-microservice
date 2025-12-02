import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import router from './routes/routes.mjs';
import { logger } from './config/logger.mjs';
import { sequelize } from './db/sql/sequelize-config.mjs';
import { connectRedis, disconnectRedis } from './db/redis/config.mjs';
import { config } from './config/env-loader.mjs';

export const app = express();

(async () => {
	try {
		await sequelize.authenticate();
		logger.info('Conectado ao MySQL');
		
		await connectRedis();
		logger.info('Conectado ao Redis');
		
	} catch (err) {

		logger.error(err, 'Erro ao conectar aos bancos:');
		process.exit(1); 
	}
})();

app.use(express.json());
app.use('/chat', router); 

const PORT = config.port;
const server = app.listen(PORT, () => {
	logger.info(`API rodando em http://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
	logger.info('SIGTERM recebido, encerrando...');
	server.close(async () => {
		await disconnectRedis();
		await sequelize.close();
		logger.info('Servidor encerrado');
		process.exit(0);
	});
});

process.on('SIGINT', async () => {
	logger.info('SIGINT recebido, encerrando...');
	server.close(async () => {
		await disconnectRedis();
		await sequelize.close();
		logger.info('Servidor encerrado');
		process.exit(0);
	});
});
