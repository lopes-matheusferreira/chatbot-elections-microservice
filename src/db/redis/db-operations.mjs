import { redisClient } from './config.mjs';
import { memory } from '../../../chatbot/config-model/memory/redis-memory.mjs';

async function* scanKeys(client, pattern) {
	let cursor = '0';
	
	do {
		const reply = await client.scan(cursor, {
			MATCH: pattern,
			COUNT: 100
		});
		
		cursor = reply.cursor;
		
		for (const key of reply.keys) {
			yield key;
		}
	} while (cursor !== '0');
}


export const getThreads = async () => {
	const pattern = 'checkpoint:*';
	const keys = [];
	
	for await (const key of scanKeys(redisClient, pattern)) {
		keys.push(key);
	}
	
	return keys;  
};

export const getConversationCheckpoints = async (threadId) => {
	return memory.list({ configurable: { thread_id: threadId } });
};

export const checkThreadExists = async (threadId) => {
	const pattern = `checkpoint:${threadId}:*`;
	
	for await (const key of scanKeys(redisClient, pattern)) {
		return true;
	}
	
	return false;
};

export const deleteThreadById = async (threadId) => {
	const patterns = [
		`checkpoint:${threadId}:*`,
		`checkpoint_write:${threadId}:*`,
		`write_keys_zset:${threadId}:*`
	];
	
	let deletedCount = 0;
	
	for (const pattern of patterns) {
		for await (const key of scanKeys(redisClient, pattern)) {
			await redisClient.del(key);
			deletedCount++;
		}
	}
	
	return deletedCount;
};
