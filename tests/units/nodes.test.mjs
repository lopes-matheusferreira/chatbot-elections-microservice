import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	scopeValidation,
	outOfScope,
	chatbot,
	appError,
	formatClarificationQuestion,
	generateQueryEntityIdByVotableName,
	executeVotableNameQuery,
	noCouncillorFound,
	setContext
} from '../../chatbot/config-model/functions/nodes.mjs';

vi.mock('../../chatbot/config-model/functions/searchagents-calling.mjs', () => ({
	callScopeValidationllm: vi.fn(),
	callChatbot: vi.fn(),
	getEntityIdGenerateQuery: vi.fn(),
	getEntityIdFormalNameGenerateQuery: vi.fn(),
	generateFinalSql: vi.fn(),
	callFinalResultFormatter: vi.fn()
}));

vi.mock('../../src/db/sql/sequelize-config.mjs', () => ({
	sequelize: {
		query: vi.fn()
	}
}));

import * as searchAgents from '../../chatbot/config-model/functions/searchagents-calling.mjs';
import { sequelize } from '../../src/db/sql/sequelize-config.mjs';

describe('Node - scopeValidation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deve validar mensagem dentro do escopo', async () => {
		const state = { message: 'Quantos votos teve João?' };
		searchAgents.callScopeValidationllm.mockResolvedValue({
			isValidInput: true
		});

		const result = await scopeValidation(state);

		expect(result.classification).toBe(true);
		expect(result.message).toBe('Quantos votos teve João?');
		expect(searchAgents.callScopeValidationllm).toHaveBeenCalledWith('Quantos votos teve João?');
	});

	it('deve invalidar mensagem fora do escopo', async () => {
		const state = { message: 'Qual a previsão do tempo?' };
		searchAgents.callScopeValidationllm.mockResolvedValue({
			isValidInput: false
		});

		const result = await scopeValidation(state);

		expect(result.classification).toBe(false);
	});

	it('deve marcar como válido quando LLM falha', async () => {
		const state = { message: 'Teste' };
		searchAgents.callScopeValidationllm.mockRejectedValue(new Error('LLM Error'));

		const result = await scopeValidation(state);

		expect(result.classification).toBe(true);
	});
});

describe('Node - outOfScope', () => {
	it('deve retornar mensagem padrão de fora de escopo', () => {
		const state = { message: 'Teste', someData: 'value' };

		const result = outOfScope(state);

		expect(result.finalAnswer.answer).toContain('fora de escopo');
		expect(result.finalAnswer.answer).toContain('consulta de quantidade de votos');
		expect(result.someData).toBe('value');
	});
});

describe('Node - chatbot', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deve processar mensagem sem necessidade de clarificação', async () => {
		const state = {
			message: 'Quantos votos teve João Silva em São Paulo?',
			context: ''
		};
		searchAgents.callChatbot.mockResolvedValue({
			needFurtherClarification: false,
			clarificationQuestion: null,
			summary: 'Buscar votos de João Silva em São Paulo'
		});

		const result = await chatbot(state);

		expect(result.needFurtherClarification).toBe(false);
		expect(result.summary).toBe('Buscar votos de João Silva em São Paulo');
		expect(result.error).toBeUndefined();
	});

	it('deve solicitar clarificação quando necessário', async () => {
		const state = {
			message: 'Quantos votos teve João?',
			context: ''
		};
		searchAgents.callChatbot.mockResolvedValue({
			needFurtherClarification: true,
			clarificationQuestion: 'Em qual cidade você quer saber?',
			summary: null
		});

		const result = await chatbot(state);

		expect(result.needFurtherClarification).toBe(true);
		expect(result.clarificationQuestion).toBe('Em qual cidade você quer saber?');
	});

	it('deve marcar erro quando LLM falha', async () => {
		const state = { message: 'Teste', context: '' };
		searchAgents.callChatbot.mockRejectedValue(new Error('LLM Error'));

		const result = await chatbot(state);

		expect(result.error).toBe(true);
	});
});

describe('Node - appError', () => {
	it('deve retornar mensagem de erro padrão', () => {
		const state = { error: true, message: 'Teste' };

		const result = appError(state);

		expect(result.finalAnswer.answer).toContain('instabilidades');
		expect(result.finalAnswer.answer).toContain('tente novamente mais tarde');
	});
});

describe('Node - formatClarificationQuestion', () => {
	it('deve formatar pergunta de clarificação quando existe', () => {
		const state = {
			clarificationQuestion: 'Em qual cidade?',
			message: 'Teste'
		};

		const result = formatClarificationQuestion(state);

		expect(result.finalAnswer.answer).toBe('Em qual cidade?');
	});

	it('deve retornar estado inalterado quando não há clarificação', () => {
		const state = {
			clarificationQuestion: null,
			message: 'Teste'
		};

		const result = formatClarificationQuestion(state);

		expect(result).toEqual(state);
		expect(result.finalAnswer).toBeUndefined();
	});
});

describe('Node - generateQueryEntityIdByVotableName', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deve gerar query SQL com sucesso', async () => {
		const state = { summary: 'João Silva em São Paulo' };
		searchAgents.getEntityIdGenerateQuery.mockResolvedValue({
			getEntityIdQuery: "SELECT sq_candidato FROM candidatos WHERE nm_votavel LIKE '%João Silva%'"
		});

		const result = await generateQueryEntityIdByVotableName(state);

		expect(result.getEntityIdQuery).toContain('SELECT sq_candidato');
		expect(result.getEntityIdQuery).toContain('nm_votavel');
		expect(result.finalAnswer.answer).toBe('');
		expect(result.error).toBeUndefined();
	});

	it('deve marcar erro quando geração de query falha', async () => {
		const state = { summary: 'Teste' };
		searchAgents.getEntityIdGenerateQuery.mockRejectedValue(new Error('Query Error'));

		const result = await generateQueryEntityIdByVotableName(state);

		expect(result.error).toBe(true);
	});
});

describe('Node - executeVotableNameQuery', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deve executar query e retornar resultados', async () => {
		const state = {
			getEntityIdQuery: "SELECT sq_candidato FROM candidatos WHERE nm_votavel = 'João'"
		};
		const mockResults = [
			{ sq_candidato: 123, nm_votavel: 'João Silva' }
		];
		sequelize.query.mockResolvedValue([mockResults, {}]);

		const result = await executeVotableNameQuery(state);

		expect(result.getEntityIdResult).toEqual(mockResults);
		expect(result.error).toBeUndefined();
		expect(sequelize.query).toHaveBeenCalledWith(state.getEntityIdQuery);
	});

	it('deve retornar array vazio quando não há resultados', async () => {
		const state = { getEntityIdQuery: 'SELECT * FROM candidatos' };
		sequelize.query.mockResolvedValue([[], {}]);

		const result = await executeVotableNameQuery(state);

		expect(result.getEntityIdResult).toEqual([]);
	});

	it('deve marcar erro quando execução falha', async () => {
		const state = { getEntityIdQuery: 'INVALID SQL' };
		sequelize.query.mockRejectedValue(new Error('SQL Error'));

		const result = await executeVotableNameQuery(state);

		expect(result.error).toBe(true);
		expect(result.getEntityIdResult).toEqual([]);
	});
});

describe('Node - noCouncillorFound', () => {
	it('deve retornar mensagem de político não encontrado', () => {
		const state = { message: 'João Silva' };

		const result = noCouncillorFound(state);

		expect(result.finalAnswer.answer).toContain('Não encontrei nenhum político');
		expect(result.finalAnswer.answer).toContain('Tente novamente');
	});
});

describe('Node - setContext', () => {
	it('deve criar contexto inicial quando não existe', () => {
		const state = {
			message: 'Olá',
			finalAnswer: { answer: 'Oi!' },
			context: ''
		};

		const result = setContext(state);

		expect(result.context).toContain('Human:Olá');
		expect(result.context).toContain('System:Oi!');
	});

	it('deve adicionar interação ao contexto existente', () => {
		const state = {
			message: 'Como vai?',
			finalAnswer: { answer: 'Bem!' },
			context: '\nHuman:Olá\nSystem:Oi!'
		};

		const result = setContext(state);

		expect(result.context).toContain('Human:Olá');
		expect(result.context).toContain('Human:Como vai?');
		expect(result.context).toContain('System:Bem!');
	});

	it('deve manter apenas as últimas 3 interações', () => {
		const state = {
			message: 'Mensagem 4',
			finalAnswer: { answer: 'Resposta 4' },
			context: '\nHuman:Msg 1\nSystem:Resp 1\nHuman:Msg 2\nSystem:Resp 2\nHuman:Msg 3\nSystem:Resp 3'
		};

		const result = setContext(state);

		const interactions = result.context.split('\nHuman:').filter(Boolean);
		expect(interactions).toHaveLength(3);
		expect(result.context).not.toContain('Msg 1');
		expect(result.context).toContain('Msg 2');
		expect(result.context).toContain('Msg 3');
		expect(result.context).toContain('Mensagem 4');
	});
});
