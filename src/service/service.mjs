import * as db from '../db/redis/db-operations.mjs';
import { randomUUID } from 'crypto';
import { flow } from '../../chatbot/index.mjs';
import {
	formatConversation
} from './utils/index.mjs';


export const getThreads = async () => {
	const keys = await db.getThreads();
	const threadIds = new Set();

	for (const key of keys) {
		const parts = key.split(':');
		if (parts[0] === 'checkpoint' && parts.length >= 2) {
			threadIds.add(parts[1]);
		}
	}

	const threads = Array.from(threadIds).map(id => ({ threadId: id }));

	return {
		status: 200,
		data: { threads, count: threads.length }
	};
};


export const getConversation = async (threadId) => {
	if (!threadId) {
		return { status: 400, data: { error: 'threadId obrigatório' } };
	}

	const checkpoints = await db.getConversationCheckpoints(threadId);
	const conv = formatConversation(checkpoints);

	if (!conv) {
		return { status: 404, data: { error: 'Conversa não encontrada' } };
	}

	return { status: 200, data: conv };
};


export const createThread = async () => {
	const threadId = `thread_${randomUUID()}`;
	
	return {
		status: 201,
		data: { 
			threadId,
			createdAt: new Date().toISOString()
		}
	};
};

export const sendMessage = async (threadId, message) => {
	if (!threadId) {
		return { status: 400, data: { error: 'threadId obrigatório' } };
	}
	
	if (!message || typeof message !== 'string' || message.trim() === '') {
		return {
			status: 400,
			data: { error: 'message é obrigatório' }
		};
	}

	
	const config = { 
		configurable: { 
			thread_id: threadId 
		} 
	};

	const result = await flow.invoke(
		{ message },
		config
	);
		
	return {
		status: 200,
		data: {
			threadId,
			message: result.message,
			classification: result.classification,
			context: result.context,
			needFurtherClarification: result.needFurtherClarification,
			clarificationQuestion: result.clarificationQuestion,
			summary: result.summary,
			getEntityIdQuery: result.getEntityIdQuery,
			getEntityIdResult: result.getEntityIdResult,
			getVotesInformationSql: result.getVotesInformationSql,
			getVotesInformationResult: result.getVotesInformationResult,
			result: result.result,
			finalAnswer: result.finalAnswer,
			error: result.error

		}
	};
};

export const deleteThread = async (threadId) => {
	if (!threadId) {
		return { status: 400, data: { error: 'threadId obrigatório' } };
	}
	
	const exists = await db.checkThreadExists(threadId);
		
	if (!exists) {
		return {
			status: 404,
			data: { error: 'Thread não encontrada' }
		};
	}

	await db.deleteThreadById(threadId);
		
	return {
		status: 200,
		data: { 
			message: 'Thread deletada com sucesso',
			threadId
		}
	};
};
