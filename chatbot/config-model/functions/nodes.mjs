import {
	callScopeValidationllm,
	callChatbot,
	getEntityIdGenerateQuery,
	getEntityIdFormalNameGenerateQuery,
	generateFinalSql,
	callFinalResultFormatter
} from './searchagents-calling.mjs';
import { logger } from '../../../src/config/logger.mjs';
import { sequelize } from '../../../src/db/sql/sequelize-config.mjs';


export const scopeValidation = async (state) => {
	const message = state.message;
	let isValidForTheScope = true;
	try {
		const llmResponse = await callScopeValidationllm(message);

		logger.info(
			{ llmResponse, message },
			'Resposta da validação'
		);

		isValidForTheScope = llmResponse.isValidInput;
	} catch (error) {

		logger.error(
			{ err: error },
			'Erro na validação'
		);

	}
	const newState = {
		...state,
		classification: isValidForTheScope
	};
	return newState;
};


export const outOfScope = (state) => {
	const response = 'Input fora de escopo. Minha especialidade é a consulta de quantidade de votos. Por gentileza faça uma pergunta a respeito.';
	
	logger.info('Enviando mensagem padronizada. Fora de escopo');

	const newState = {
		...state,
		finalAnswer: { answer: response }
	};
	return newState;
};


export const chatbot = async (state) => {
	const message = state.message;
	const context = state.context;
	try {
		const llmResponse = await callChatbot(message, context);

		logger.info(
			{ llmResponse, message, context },
			'Informações do chatbot'
		);

		return  {
			...state,
			needFurtherClarification: llmResponse.needFurtherClarification,
			clarificationQuestion: llmResponse.clarificationQuestion,
			summary: llmResponse.summary
		};
	} catch (error) {
		
		logger.error(
			{ err: error },
			'Erro no chatbot/core'
		);

		return {
			...state,
			error: true
		};
	}
};


export const appError = (state) => {    
	const response = 'Sinto muito, mas estamos enfrentando instabilidades no momento. Por gentileza, tente novamente mais tarde!';
	
	logger.info('Enviando mensagem padronizada de erro na aplicação');

	return {  
		...state,
		finalAnswer: { answer: response }
	};
};


export const formatClarificationQuestion = (state) => {
	const clarificationQuestion = state.clarificationQuestion;

	if (state.clarificationQuestion) {
		return {
			...state,
			finalAnswer: { answer: clarificationQuestion }
		};
	} else {
		return state;
	}

};


export const generateQueryEntityIdByVotableName = async (state) => {
	const summary = state.summary;

	try {
		const llmResponse = await getEntityIdGenerateQuery(summary);

		logger.info(
			{ llmResponse },
			'Resposta do modelo gerador de queries para nome votável'
		);

		return {
			...state,
			getEntityIdQuery: llmResponse.getEntityIdQuery,
			finalAnswer: { answer: '' }
		};
	} catch (error) {

		logger.error(
			{ err: error },
			'Erro na geração de query para nome votável'
		);

		return {
			...state,
			error: true
		};
	}
};


export const executeVotableNameQuery = async (state) => {
	const query = state.getEntityIdQuery;

	try {
		const [results, _metadata] = await sequelize.query(query);
    
		logger.info(
			{ results },
			'Resultado da execução da query de nome votável'
		);

		return {
			...state,
			getEntityIdResult: results || []
		};
	} catch (error) {

		logger.error(
			{ err: error },
			'Erro na execução de query para nome votável'
		);

		return {
			...state,
			getEntityIdResult: [],
			error: true
		};
	}
};


export const generateQueryEntityIdByFormalName = async (state) => {
	const summary = state.summary;

	try {
		const llmResponse = await getEntityIdFormalNameGenerateQuery(summary);

		logger.info(
			{ llmResponse },
			'Resposta do modelo gerador de queries para nome formal'
		);

		return {
			...state,
			getEntityIdQuery: llmResponse.getEntityIdQuery,
			finalAnswer: { answer: '' }
		};
	} catch (error) {

		logger.error(
			{ err: error },
			'Erro na geração de query para nome formal'
		);

		return {
			...state,
			error: true
		};
	}
};


export const executeFormalNameQuery = async (state) => {
	const query = state.getEntityIdQuery;

	try {
		const [results, _metadata] = await sequelize.query(query);
    
		logger.info(
			{ results },
			'Resultado da execução da query de nome formal'
		);

		return {
			...state,
			getEntityIdResult: results || []
		};
	} catch (error) {

		logger.error(
			{ err: error },
			'Erro na execução de query para nome formal'
		);

		return {
			...state,
			getEntityIdResult: [],
			error: true
		};
	}
};


export const generateFinalQuery = async (state) => {
	const id = state.getEntityIdResult[0].sq_candidato;
	const summary = state.summary;
	try {
		const llmResponse = await generateFinalSql(id, summary);

		logger.info(
			{ llmResponse },
			'Resultado de geração da query final'
		);

		return {
			...state,
			getVotesInformationSql: llmResponse.finalQuery
		};
	} catch (error) {

		logger.error(
			{ err: error },
			'Erro na geração da query final'
		);


		return {
			...state,
			error: true
		};
	}
};


export const executeFinalQuery = async (state) => {
	const query = state.getVotesInformationSql;
	try {
		const [results, _metadata] = await sequelize.query(query);

		logger.info(
			{ query, results },
			'Execução da query final'
		);

		return {
			...state,
			getVotesInformationResult: results || []
		};
	} catch (error) {

		logger.error(
			{ err: error },
			'Erro na execução a query final'
		);

		return {
			...state,
			getVotesInformationResult: [],
			error: true
		};
	}
};


export const noCouncillorFound = (state) => {
	const noCouncillorsFoundMessage = 'Não encontrei nenhum político com esse nome ne cidade requisitada. Tente novamente por favor!';
	return {
		...state,
		finalAnswer: { answer: noCouncillorsFoundMessage }
	};
};


export const noInformationFound = (state) => {
	const noInformationFoundMessage = 'Não encontrei nenhuma informação a respeito. Tente novamente por favor!';
	return {
		...state,
		finalAnswer: { answer: noInformationFoundMessage }
	};
};


export const formatFinalAnswer = async(state) => {
	const result = state.getVotesInformationResult;
	const message = state.summary;
	try {
		const llmResponse = await callFinalResultFormatter(result, message);

		logger.info({
			llmResponse
		}, 'Formatação de resposta final'
		);

		return {
			...state,
			finalAnswer: { answer: llmResponse.finalResult }
		};

	} catch (error) {
		
		logger.error(
			{err: error},
			'Erro na formatação da resposta final'
		);

		return {
			...state,
			error: true
		};
	}
};


export const setContext = (state) => {

	logger.info('Setando Contexto | Encerrando interação');

	const actualContext = state.context || '';
	const actualMessage = state.message;
	const actualResponse = state.finalAnswer.answer;
	
	const newInteraction = `\nHuman:${actualMessage}\nSystem:${actualResponse}`;
	const fullContext = `${actualContext}${newInteraction}`;
	
	const interactions = fullContext.split('\nHuman:').filter(Boolean);
	
	const last3Interactions = interactions.slice(-3);
	
	const formattedContext = last3Interactions
		.map(interaction => `\nHuman:${interaction}`)
		.join('');
	
	return {
		...state,
		context: formattedContext
	};
};


