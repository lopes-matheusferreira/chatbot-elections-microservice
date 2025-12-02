export const formatConversation = (checkpoints) => {
	if (!checkpoints.length) return null;

	const latest = checkpoints[0];
	const channelValues = latest.checkpoint?.channel_values;

	if (!channelValues) return null;

	const messages = [];

	for (const item of channelValues.context || []) {
		if (item.Humano) {
			messages.push({ role: 'user', content: item.Humano, timestamp: latest.checkpoint.ts });
		}
		if (item.Assistente) {
			messages.push({ role: 'assistant', content: item.Assistente, timestamp: latest.checkpoint.ts });
		}
	}

	return {
		threadId: latest.configurable.thread_id,
		messages,
		checkpointCount: checkpoints.length,
		createdAt: checkpoints[checkpoints.length - 1]?.checkpoint?.ts,
		updatedAt: latest.checkpoint.ts
	};
};
