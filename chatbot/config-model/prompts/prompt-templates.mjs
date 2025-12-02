import { ChatPromptTemplate } from '@langchain/core/prompts';

export const scopeValidationPromptTemplate = ChatPromptTemplate.fromMessages([
	['system', '{systemPrompt}'],
	['human', '{message}']
]);

export const chatbotPromptTemplate = ChatPromptTemplate.fromMessages([
	['system', '{systemPrompt}'],
	['system', '{context}'],
	['human', '{message}']
]);

export const getEntityIdPromptTemplate = ChatPromptTemplate.fromMessages([
	['system', '{systemPrompt}'],
	['system', '{note}'],
	['human', '{message}']
]);

export const generateFinalQueryPromptTemplate = ChatPromptTemplate.fromMessages([
	['system', '{systemPrompt}'],
	['system', 'O sq_candidato: {id}'],
	['human', '{message}']
]);

export const finalResultFormatter = ChatPromptTemplate.fromMessages([
	['system', '{systemPrompt}'],
	['system', 'Resultados: {result}'],
	['human', '{message}']
]);
