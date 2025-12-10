import dotenv from 'dotenv';

// Carrega .env apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
	dotenv.config();
}

import express from 'express';
import router from './routes/routes.mjs';
import { logger } from './config/logger.mjs';
import { sequelize } from './db/sql/sequelize-config.mjs';
import { connectRedis, disconnectRedis } from './db/redis/config.mjs';
import { config } from './config/env-loader.mjs';

export const app = express();

// Função auxiliar para retry de conexões
async function connectWithRetry(connectFn, serviceName, maxRetries = 10, delayMs = 3000) {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			await connectFn();
			logger.info(`${serviceName} conectado com sucesso!`);
			return true;
		} catch (error) {
			logger.warn(
				`Tentativa ${attempt}/${maxRetries} de conectar ao ${serviceName} falhou. ` +
				`Tentando novamente em ${delayMs/1000}s...`
			);
			
			if (attempt === maxRetries) {
				logger.error(`Falha ao conectar ao ${serviceName} após ${maxRetries} tentativas`);
				throw error;
			}
			
			await new Promise(resolve => setTimeout(resolve, delayMs));
		}
	}
}

// Inicialização assíncrona com retry
async function startApp() {
	try {
		// MySQL: 10 tentativas x 3 segundos = até 30 segundos (só schema agora)
		await connectWithRetry(
			() => sequelize.authenticate(),
			'MySQL',
			10,
			3000
		);
		
		// Redis: 10 tentativas x 3 segundos = até 30 segundos
		await connectWithRetry(
			() => connectRedis(),
			'Redis',
			10,
			3000
		);
		
		logger.info('Todos os serviços conectados com sucesso!');
		
		// Configura middlewares
		app.use(express.json());
		
		// Health check na RAIZ (para Docker)
		app.get('/health', (req, res) => {
			res.status(200).json({ 
				status: 'ok',
				timestamp: new Date().toISOString(),
				uptime: process.uptime()
			});
		});
		
		// Rotas da aplicação
		app.use('/chat', router);
		
		// Inicia o servidor
		const PORT = config.port;
		const server = app.listen(PORT, () => {
			logger.info(`API rodando em http://localhost:${PORT}`);
			logger.info(`Health check: http://localhost:${PORT}/health`);
		});
		
		// Graceful shutdown
		const shutdown = async (signal) => {
			logger.info(`${signal} recebido, encerrando gracefully...`);
			
			server.close(async () => {
				try {
					await disconnectRedis();
					logger.info('Redis desconectado');
					
					await sequelize.close();
					logger.info('MySQL desconectado');
					
					logger.info('Servidor encerrado com sucesso');
					process.exit(0);
				} catch (error) {
					logger.error(error, 'Erro ao encerrar serviços:');
					process.exit(1);
				}
			});
			
			setTimeout(() => {
				logger.error('Forçando encerramento após timeout');
				process.exit(1);
			}, 10000);
		};
		
		process.on('SIGTERM', () => shutdown('SIGTERM'));
		process.on('SIGINT', () => shutdown('SIGINT'));
		
	} catch (error) {
		logger.error(error, 'Erro fatal ao iniciar aplicação:');
		process.exit(1);
	}
}

startApp();