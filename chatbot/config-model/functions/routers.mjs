export const anyEntityFound = (state) => {
	return state.getEntityIdResult && state.getEntityIdResult.length > 0 ? true : false;
};


export const checkFinalQueryResult = (state) => {
	return state.getVotesInformationResult && state.getVotesInformationResult.length > 0 ? true : false;
};


export const routeByClassification = (state) => {
	return state.classification ? true : false;
};


export const routeByClarification = (state) => {
	return state.needFurtherClarification ? true : false;
};


export const lookForErrors = (state) => {
	return state.error ? true : false;
};
