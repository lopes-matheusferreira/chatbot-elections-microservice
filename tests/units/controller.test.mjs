import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as controller from '../../src/controller/controller.mjs';

vi.mock('../../src/service/service.mjs', () => ({
	getThreads: vi.fn(),
	getConversation: vi.fn(),
	createThread: vi.fn(),
	sendMessage: vi.fn(),
	deleteThread: vi.fn()
}));

import * as service from '../../src/service/service.mjs';

const createMockReqRes = () => {
	const req = {
		validatedData: {},
		params: {},
		body: {}
	};
  
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis()
	};
  
	return { req, res };
};

describe('Controller - getThreads', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deve retornar threads com sucesso', async () => {
		const { req, res } = createMockReqRes();
		const mockResult = {
			status: 200,
			data: { threads: [{ threadId: 'thread_123' }], count: 1 }
		};
		service.getThreads.mockResolvedValue(mockResult);

		await controller.getThreads(req, res);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(mockResult.data);
	});

	it('deve retornar erro 500 quando service falha', async () => {
		const { req, res } = createMockReqRes();
		service.getThreads.mockRejectedValue(new Error('Database error'));

		await controller.getThreads(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			error: 'Erro ao buscar threads'
		});
	});
});

describe('Controller - getConversation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deve retornar conversa com sucesso', async () => {
		const { req, res } = createMockReqRes();
		req.validatedData = { threadId: 'thread_123' };
		const mockResult = {
			status: 200,
			data: {
				threadId: 'thread_123',
				messages: [{ role: 'user', content: 'Olá' }]
			}
		};
		service.getConversation.mockResolvedValue(mockResult);

		await controller.getConversation(req, res);

		expect(service.getConversation).toHaveBeenCalledWith('thread_123');
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(mockResult.data);
	});

	it('deve retornar 404 quando conversa não existe', async () => {
		const { req, res } = createMockReqRes();
		req.validatedData = { threadId: 'thread_999' };
		const mockResult = {
			status: 404,
			data: { error: 'Conversa não encontrada' }
		};
		service.getConversation.mockResolvedValue(mockResult);

		await controller.getConversation(req, res);

		expect(res.status).toHaveBeenCalledWith(404);
	});

	it('deve retornar erro 500 quando service falha', async () => {
		const { req, res } = createMockReqRes();
		req.validatedData = { threadId: 'thread_123' };
		req.params = { threadId: 'thread_123' };
		service.getConversation.mockRejectedValue(new Error('Service error'));

		await controller.getConversation(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			error: 'Erro ao buscar conversa'
		});
	});
});

describe('Controller - createThread', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deve criar thread com sucesso', async () => {
		const { req, res } = createMockReqRes();
		const mockResult = {
			status: 201,
			data: {
				threadId: 'thread_new_123',
				createdAt: '2024-01-01T00:00:00Z'
			}
		};
		service.createThread.mockResolvedValue(mockResult);

		await controller.createThread(req, res);

		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith(mockResult.data);
	});

	it('deve retornar erro 500 quando service falha', async () => {
		const { req, res } = createMockReqRes();
		service.createThread.mockRejectedValue(new Error('Creation failed'));

		await controller.createThread(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
	});
});

describe('Controller - sendMessage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deve enviar mensagem com sucesso', async () => {
		const { req, res } = createMockReqRes();
		req.validatedData = {
			threadId: 'thread_123',
			message: 'Quantos votos teve João?'
		};
		const mockResult = {
			status: 200,
			data: {
				threadId: 'thread_123',
				message: 'Quantos votos teve João?',
				finalAnswer: { answer: 'João teve 1000 votos' }
			}
		};
		service.sendMessage.mockResolvedValue(mockResult);

		await controller.sendMessage(req, res);

		expect(service.sendMessage).toHaveBeenCalledWith(
			'thread_123',
			'Quantos votos teve João?'
		);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(mockResult.data);
	});

	it('deve retornar erro 400 quando validação falha no service', async () => {
		const { req, res } = createMockReqRes();
		req.validatedData = {
			threadId: 'thread_123',
			message: ''
		};
		const mockResult = {
			status: 400,
			data: { error: 'message é obrigatório' }
		};
		service.sendMessage.mockResolvedValue(mockResult);

		await controller.sendMessage(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
	});

	it('deve retornar erro 500 quando service falha', async () => {
		const { req, res } = createMockReqRes();
		req.validatedData = {
			threadId: 'thread_123',
			message: 'Teste'
		};
		req.params = { threadId: 'thread_123' };
		service.sendMessage.mockRejectedValue(new Error('Flow error'));

		await controller.sendMessage(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
	});
});

describe('Controller - deleteThread', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deve deletar thread com sucesso', async () => {
		const { req, res } = createMockReqRes();
		req.validatedData = { threadId: 'thread_123' };
		const mockResult = {
			status: 200,
			data: {
				message: 'Thread deletada com sucesso',
				threadId: 'thread_123'
			}
		};
		service.deleteThread.mockResolvedValue(mockResult);

		await controller.deleteThread(req, res);

		expect(service.deleteThread).toHaveBeenCalledWith('thread_123');
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it('deve retornar 404 quando thread não existe', async () => {
		const { req, res } = createMockReqRes();
		req.validatedData = { threadId: 'thread_999' };
		const mockResult = {
			status: 404,
			data: { error: 'Thread não encontrada' }
		};
		service.deleteThread.mockResolvedValue(mockResult);

		await controller.deleteThread(req, res);

		expect(res.status).toHaveBeenCalledWith(404);
	});

	it('deve retornar erro 500 quando service falha', async () => {
		const { req, res } = createMockReqRes();
		req.validatedData = { threadId: 'thread_123' };
		req.params = { threadId: 'thread_123' };
		service.deleteThread.mockRejectedValue(new Error('Delete failed'));

		await controller.deleteThread(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
	});
});
