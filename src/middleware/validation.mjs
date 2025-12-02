import { logger } from '../config/logger.mjs';

export const validate = (schema) => {
	return (req, res, next) => {
		try {
			const dataToValidate = {
				...req.params,
				...req.query,
				...req.body
			};

			const result = schema.safeParse(dataToValidate);

			if (!result.success) {
				const errors = result.error.errors || result.error.issues || [];
        
		  logger.error('Dados de requisição inválidos');
		  
				return res.status(400).json({
					error: 'Dados inválidos',
					details: errors.map(err => ({
						field: err.path?.join('.') || 'unknown',
						message: err.message
					}))
				});
			}

			req.validatedData = result.data;
			next();
		} catch (error) {
      
			logger.error(
				{ err: error },
				'Erro na validação de input ZOD'
			);

			return res.status(500).json({
				error: 'Erro interno na validação',
				message: error.message
			});
		}
	};
};
