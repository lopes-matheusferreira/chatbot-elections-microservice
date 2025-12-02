import { z } from 'zod';

export const scopeValidationSchema = z.object({
	  isValidInput: z.boolean()

});

export const chatbotSchema = z.object({
	  needFurtherClarification: z.boolean(),
	  clarificationQuestion: z.string(),
	  summary: z.string(),
	  notes: z.string()
});

export const getEntityIdSchema = z.object({
	  getEntityIdQuery: z.string()
});

export const generateFinalQuerySchema = z.object({
	  finalQuery: z.string()
});

export const finalResponseFormatterSchema = z.object({
	  finalResult: z.string()
});
