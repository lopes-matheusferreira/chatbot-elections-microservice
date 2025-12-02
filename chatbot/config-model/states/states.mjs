export const graphState = {
	message: {
		value: (x, y) => y ?? x,
		default: () => ''
	},
	classification: {
		value: (x, y) => y ?? x,
		default: () => 'not_evaluated'
	},
	context: {
		value: (x, y) => y ?? x,
		default: () => ''
	},
	needFurtherClarification: {
		value: (x, y) => y ?? x,
		default: () => 'not_evaluated'
	},
	clarificationQuestion: {
		value: (x, y) => y ?? x, 
		default: () => ''
	},
	summary: {
		value: (x, y) => y ?? x, 
		default: () => ''
	},
	getEntityIdQuery: {
		value: (x, y) => y ?? x, 
		default: () => ''
	},
	getEntityIdResult: {
		value: (x, y) => y ?? x, 
		default: () => {
			
		}
	},
	getVotesInformationSql: {
		value: (x, y) => y ?? x, 
		default: () => {

		}
	},
	getVotesInformationResult: {
		value: (x, y) => y ?? x, 
		default: () => {
			
		}
	},
	finalAnswer: {
		value: (x, y) => y ?? x,  
		default: () => ({ answer: '' })
	},
	error: {
		value: (x, _y) => x,  
		default: () => false
	}
};
