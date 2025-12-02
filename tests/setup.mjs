import { vi } from 'vitest';

vi.mock('../src/config/logger.mjs', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn()
	}
}));
