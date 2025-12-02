import * as service from '../service/service.mjs';
import { logger } from '../config/logger.mjs';

const handleControllerError = (error, context, res) => {
	logger.error({ error, ...context }, `Erro ao ${context.action}`);
	res.status(500).json({ error: `Erro ao ${context.action}` });
};

export const getThreads = async (req, res) => {
	try {
		const result = await service.getThreads();
		res.status(result.status).json(result.data);
	} catch (error) { 
		handleControllerError(error, { action: 'buscar threads' }, res);
	}
};

export const getConversation = async (req, res) => {
	try {
		const { threadId } = req.validatedData;
		const result = await service.getConversation(threadId);
		res.status(result.status).json(result.data);
	} catch (error) {
		handleControllerError(error, { action: 'buscar conversa', threadId: req.params.threadId }, res);
	}
};

export const createThread = async (req, res) => {
	try {
		const result = await service.createThread();
		res.status(result.status).json(result.data);
	} catch (error) { 
		handleControllerError(error, { action: 'criar thread' }, res);
	}
};

export const sendMessage = async (req, res) => {
	try {
		const { threadId, message } = req.validatedData;
		const result = await service.sendMessage(threadId, message);
		res.status(result.status).json(result.data);
	} catch (error) {
		handleControllerError(error, { action: 'enviar mensagem', threadId: req.params.threadId }, res);
	}
};

export const deleteThread = async (req, res) => {
	try {
		const { threadId } = req.validatedData;
		const result = await service.deleteThread(threadId);
		res.status(result.status).json(result.data);
	} catch (error) { 
		handleControllerError(error, { action: 'deletar thread', threadId: req.params.threadId }, res);
	}
};
