import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as service from '../../src/service/service.mjs';

vi.mock('../../src/db/redis/db-operations.mjs', () => ({
	getThreads: vi.fn(),
	getConversationCheckpoints: vi.fn(),
	checkThreadExists: vi.fn(),
	deleteThreadById: vi.fn()
}));

vi.mock('../../chatbot/index.mjs', () => ({
	flow: {
		invoke: vi.fn()
	}
}));

vi.mock('../../src/service/utils/index.mjs', () => ({
	formatConversation: vi.fn()
}));

import * as db from '../../src/db/redis/db-operations.mjs';
import { flow } from '../../chatbot/index.mjs';
import { formatConversation } from '../../src/service/utils/index.mjs';

describe('Service - getThreads', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deve retornar lista de threads quando existem checkpoints', async () => {

		const mockKeys = [
			'checkpoint:thread_123:abc',
			'checkpoint:thread_123:def',
			'checkpoint:thread_456:ghi'
		];
		db.getThreads.mockResolvedValue(mockKeys);

		const result = await service.getThreads();

		expect(result.status).toBe(200);
		expect(result.data.threads).toHaveLength(2);
		expect(result.data.count).toBe(2);
		expect(result.data.threads).toEqual([
			{ threadId: 'thread_123' },
			{ threadId: 'thread_456' }
		]);
	});

	it('deve retornar array vazio quando não há checkpoints', async () => {
	  
		db.getThreads.mockResolvedValue([]);

		const result = await service.getThreads();

		expect(result.status).toBe(200);
		expect(result.data.threads).toHaveLength(0);
		expect(result.data.count).toBe(0);
	});

	it('deve ignorar keys que não são checkpoints válidos', async () => {

		const mockKeys = [
			'checkpoint:thread_123:abc',
			'other:thread_456:def',
			'invalid_key'
		];
		db.getThreads.mockResolvedValue(mockKeys);

		const result = await service.getThreads();

		expect(result.data.threads).toHaveLength(1);
		expect(result.data.threads[0].threadId).toBe('thread_123');
	});
});

describe('Service - getConversation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deve retornar erro 400 quando threadId não é fornecido', async () => {

		const result = await service.getConversation(null);

		expect(result.status).toBe(400);
		expect(result.data.error).toBe('threadId obrigatório');
	});

	it('deve retornar 404 quando conversa não é encontrada', async () => {

		db.getConversationCheckpoints.mockResolvedValue([]);
		formatConversation.mockReturnValue(null);

		const result = await service.getConversation('thread_123');

		expect(result.status).toBe(404);
		expect(result.data.error).toBe('Conversa não encontrada');
	});

	it('deve retornar conversa formatada quando encontrada', async () => {
		const mockCheckpoints = [{ some: 'data' }];
		const mockFormattedConv = {
			threadId: 'thread_123',
			messages: [{ role: 'user', content: 'Olá' }]
		};
    
		db.getConversationCheckpoints.mockResolvedValue(mockCheckpoints);
		formatConversation.mockReturnValue(mockFormattedConv);

		const result = await service.getConversation('thread_123');

		expect(result.status).toBe(200);
		expect(result.data).toEqual(mockFormattedConv);
		expect(db.getConversationCheckpoints).toHaveBeenCalledWith('thread_123');
	});
});

describe('Service - createThread', () => {
	it('deve criar thread com ID único', async () => {
		const result = await service.createThread();

		expect(result.status).toBe(201);
		expect(result.data.threadId).toMatch(/^thread_[a-f0-9-]+$/);
		expect(result.data.createdAt).toBeDefined();
	});

	it('deve gerar IDs diferentes em chamadas consecutivas', async () => {
		const result1 = await service.createThread();
		const result2 = await service.createThread();

		expect(result1.data.threadId).not.toBe(result2.data.threadId);
	});
});

describe('Service - sendMessage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deve retornar erro 400 quando threadId não é fornecido', async () => {
		const result = await service.sendMessage(null, 'Olá');

		expect(result.status).toBe(400);
		expect(result.data.error).toBe('threadId obrigatório');
	});

	it('deve retornar erro 400 quando message está vazio', async () => {
		const result = await service.sendMessage('thread_123', '');

		expect(result.status).toBe(400);
		expect(result.data.error).toBe('message é obrigatório');
	});

	it('deve retornar erro 400 quando message não é string', async () => {
		const result = await service.sendMessage('thread_123', 123);

		expect(result.status).toBe(400);
		expect(result.data.error).toBe('message é obrigatório');
	});

	it('deve processar mensagem com sucesso', async () => {
		const mockFlowResult = {
			message: 'Olá',
			classification: true,
			finalAnswer: { answer: 'Resposta' }
		};
		flow.invoke.mockResolvedValue(mockFlowResult);

		const result = await service.sendMessage('thread_123', 'Olá');

		expect(result.status).toBe(200);
		expect(result.data.threadId).toBe('thread_123');
		expect(result.data.message).toBe('Olá');
		expect(flow.invoke).toHaveBeenCalledWith(
			{ message: 'Olá' },
			{ configurable: { thread_id: 'thread_123' } }
		);
	});
});

describe('Service - deleteThread', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deve retornar erro 400 quando threadId não é fornecido', async () => {

		const result = await service.deleteThread(null);

		expect(result.status).toBe(400);
		expect(result.data.error).toBe('threadId obrigatório');
	});

	it('deve retornar 404 quando thread não existe', async () => {

		db.checkThreadExists.mockResolvedValue(false);

		const result = await service.deleteThread('thread_123');

		expect(result.status).toBe(404);
		expect(result.data.error).toBe('Thread não encontrada');
	});

	it('deve deletar thread com sucesso', async () => {
	  

		db.checkThreadExists.mockResolvedValue(true);
		db.deleteThreadById.mockResolvedValue();

		const result = await service.deleteThread('thread_123');

		expect(result.status).toBe(200);
		expect(result.data.message).toBe('Thread deletada com sucesso');
		expect(result.data.threadId).toBe('thread_123');
		expect(db.deleteThreadById).toHaveBeenCalledWith('thread_123');
	});
});
