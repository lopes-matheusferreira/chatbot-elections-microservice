import {
	chatbotPromptTemplate,
	getEntityIdPromptTemplate,
	scopeValidationPromptTemplate,
	generateFinalQueryPromptTemplate,
	finalResultFormatter
} from '../prompts/prompt-templates.mjs';
import {
	chatbotPrompt,
	getEntityId,
	scopeValidationPrompt,
	generateFinalQueryPrompt,
	finalResultFormatterPrompt
} from '../prompts/prompts.mjs';
import {
	chatbotllm,
	scopeValidationllm,
	getEntityIdllm,
	generateFinalQueryllm,
	finalResultsFormatterllm
} from '../llm-conections/conections.mjs';

export const callScopeValidationllm = async (message) => {
	const scopeValidatorFormattedPrompt = await scopeValidationPromptTemplate.format({
		systemPrompt: scopeValidationPrompt,
		message: message
	});

	const response = await scopeValidationllm.invoke(scopeValidatorFormattedPrompt);
	return response;
};

export const callChatbot = async (message, context) => {
	const chatbotFormattedPrompt = await chatbotPromptTemplate.format({
		systemPrompt: chatbotPrompt,
		context: context,
		message: message
	});

	const response = await chatbotllm.invoke(chatbotFormattedPrompt);
	return response;
};

export const getEntityIdGenerateQuery = async (summary) => {
	const getEntityIdFormattedPrompt = await getEntityIdPromptTemplate.format({
		systemPrompt: getEntityId,
		note: 'Busque na coluna nm_votavel',
		message: summary
	});

	const response = await getEntityIdllm.invoke(getEntityIdFormattedPrompt);
	return response;
};

export const getEntityIdFormalNameGenerateQuery = async (summary) => {
	const getEntityIdFormattedPrompt = await getEntityIdPromptTemplate.format({
		systemPrompt: getEntityId,
		note: 'Busque na coluna nm_candidato',
		message: summary
	});

	const response = await getEntityIdllm.invoke(getEntityIdFormattedPrompt);
	return response;
};

export const generateFinalSql = async (id, summary) => {
	const finalSqlFormattedPrompt = await generateFinalQueryPromptTemplate.format({
		systemPrompt: generateFinalQueryPrompt,
		id: id,
		message: summary
	});
	
	const response = await generateFinalQueryllm.invoke(finalSqlFormattedPrompt);
	return response;
};

export const callFinalResultFormatter = async (result, message) => {
	const finalFormatterFormattedPrompt = await finalResultFormatter.format({
		systemPrompt: finalResultFormatterPrompt,
		result: result,
		message: message
	});
	
	const response = await finalResultsFormatterllm.invoke(finalFormatterFormattedPrompt);
	return response;
};
