import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'tests/',
				'**/*.test.mjs',
				'**/*.spec.mjs',
				'vitest.config.mjs'
			]
		},
		setupFiles: ['./tests/setup.mjs']
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@chatbot': path.resolve(__dirname, './chatbot')
		}
	}
});
