//esse arquivo armazena a conexão com os llms e suas configurações
import { ChatOpenAI } from '@langchain/openai';
import {
	chatbotSchema,
	scopeValidationSchema,
	getEntityIdSchema,
	generateFinalQuerySchema,
	finalResponseFormatterSchema
} from '../../../src/schemas/output-schemas.mjs';

export const scopeValidationllm = new ChatOpenAI({
	model: 'gpt-4o',
	temperature: 0.1,
	maxRetries: 2
}).withStructuredOutput(scopeValidationSchema);

export const chatbotllm = new ChatOpenAI({
	model: 'gpt-4o',
	temperature: 0.2,
	maxRetries: 2
}).withStructuredOutput(chatbotSchema);

export const getEntityIdllm = new ChatOpenAI({
	model: 'gpt-4o',
	temperature: 0,
	maxRetries: 2
}).withStructuredOutput(getEntityIdSchema);

export const generateFinalQueryllm = new ChatOpenAI({
	model: 'gpt-4o',
	temperature: 0.2,
	maxRetries: 2
}).withStructuredOutput(generateFinalQuerySchema);

export const finalResultsFormatterllm = new ChatOpenAI({
	model: 'gpt-4o',
	temperature: 0.2,
	maxRetries: 2
}).withStructuredOutput(finalResponseFormatterSchema);
