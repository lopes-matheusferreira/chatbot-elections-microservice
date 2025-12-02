import { z } from 'zod';

export const sendMessageSchema = z.object({
	threadId: z.string()
		.min(1, 'threadId é obrigatório')
		.regex(/^thread_/, 'threadId deve começar com thread_'),
  
	message: z.string()
		.min(1, 'message é obrigatória')
		.max(5000, 'message muito longa (máx 5000 caracteres)')
		.trim()
});

export const getConversationSchema = z.object({
	threadId: z.string().min(1, 'threadId é obrigatório')
});

export const deleteConversationSchema = z.object({
	threadId: z.string().min(1, 'threadId é obrigatório')
});
