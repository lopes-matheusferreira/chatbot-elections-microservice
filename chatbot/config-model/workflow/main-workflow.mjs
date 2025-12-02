import { StateGraph, START, END } from '@langchain/langgraph';
import { graphState } from '../states/states.mjs';
import {
	scopeValidation,
	outOfScope,
	chatbot,
	appError,
	formatClarificationQuestion,
	generateQueryEntityIdByVotableName,
	executeVotableNameQuery,
	generateQueryEntityIdByFormalName,
	executeFormalNameQuery,
	generateFinalQuery,
	executeFinalQuery,
	noCouncillorFound,
	noInformationFound,
	formatFinalAnswer,
	setContext
} from '../functions/nodes.mjs';
import {
	anyEntityFound,
	checkFinalQueryResult,
	routeByClassification,
	routeByClarification,
	lookForErrors
} from '../functions/routers.mjs';
import { memory } from '../memory/redis-memory.mjs';

const workflow = new StateGraph({ channels: graphState });

workflow.addNode('scopeValidator', scopeValidation);
workflow.addNode('outOfScope', outOfScope);
workflow.addNode('chatbot', chatbot);
workflow.addNode('appError', appError);
workflow.addNode('checkClarification', (state) => state);
workflow.addNode('formatClarificationQuestion', formatClarificationQuestion);
workflow.addNode('generateQueryEntityIdByVotableName', generateQueryEntityIdByVotableName);
workflow.addNode('executeVotableNameQuery', executeVotableNameQuery);
workflow.addNode('generateQueryEntityIdByFormalName', generateQueryEntityIdByFormalName);
workflow.addNode('executeFormalNameQuery', executeFormalNameQuery);
workflow.addNode('generateFinalQuery', generateFinalQuery);
workflow.addNode('executeFinalQuery', executeFinalQuery);
workflow.addNode('noCouncillorFound', noCouncillorFound);
workflow.addNode('noInformationFound', noInformationFound);
workflow.addNode('finalResult', formatFinalAnswer);
workflow.addNode('setContext', setContext);

workflow.addEdge(START, 'scopeValidator');

workflow.addConditionalEdges(
	'scopeValidator',
	routeByClassification,
	{
		true: 'chatbot',
		false: 'outOfScope'
	}
);

workflow.addConditionalEdges(
	'chatbot',
	lookForErrors,
	{
		true: 'appError',
		false: 'checkClarification'
	}
);

workflow.addConditionalEdges(
	'checkClarification',
	routeByClarification,
	{
		true: 'formatClarificationQuestion',
		false: 'generateQueryEntityIdByVotableName' 
	}
);

workflow.addConditionalEdges(
	'generateQueryEntityIdByVotableName',
	lookForErrors,
	{
		true: 'appError',
		false: 'executeVotableNameQuery'
	}
);

workflow.addConditionalEdges(
	'executeVotableNameQuery',
	anyEntityFound,
	{
		true: 'generateFinalQuery',
		false: 'generateQueryEntityIdByFormalName' 
	}
);

workflow.addConditionalEdges(
	'generateQueryEntityIdByFormalName',
	lookForErrors,
	{
		true: 'appError',
		false: 'executeFormalNameQuery'
	}
);

workflow.addConditionalEdges(
	'executeFormalNameQuery',
	anyEntityFound,
	{
		true: 'generateFinalQuery', 
		false: 'noCouncillorFound'
	}
);

workflow.addConditionalEdges(
	'generateFinalQuery',
	lookForErrors,
	{
		true: 'appError',
		false: 'executeFinalQuery'
	}
);

workflow.addConditionalEdges(
	'executeFinalQuery',
	checkFinalQueryResult,
	{
		true: 'finalResult',
		false: 'noInformationFound'
	}
);

workflow.addConditionalEdges(
	'finalResult',
	lookForErrors,
	{
		true: 'appError',
		false: 'setContext'
	}
);

workflow.addEdge('outOfScope', 'setContext');
workflow.addEdge('appError', 'setContext');
workflow.addEdge('formatClarificationQuestion', 'setContext');
workflow.addEdge('noCouncillorFound', 'setContext');
workflow.addEdge('noInformationFound', END);
workflow.addEdge('setContext', END);


export const flow = workflow.compile({ checkpointer: memory });
