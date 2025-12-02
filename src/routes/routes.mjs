import express from 'express';
import authenticate from '../middleware/auth.mjs';
import * as controller from '../controller/controller.mjs';
import { validate } from '../middleware/validation.mjs';
import {
	sendMessageSchema,
	getConversationSchema,
	deleteConversationSchema
} from '../schemas/input-schemas.mjs';

const router = express.Router();

router.get('/threads', authenticate, controller.getThreads);

router.get(
	'/conversation/:threadId',
	authenticate,
	validate(getConversationSchema),
	controller.getConversation);

router.post('/new-thread', authenticate, controller.createThread);

router.post(
	'/:threadId/send-message', 
	authenticate,
  	validate(sendMessageSchema), 
  	controller.sendMessage
);

router.delete(
	'/:threadId',
	authenticate,
	validate(deleteConversationSchema),
	controller.deleteThread);

export default router;
