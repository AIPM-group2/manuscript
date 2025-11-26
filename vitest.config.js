import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/routes/',
        '*.config.js',
      ],
    },
    testTimeout: 60000, // 60 seconds per test (AI analysis can be slow)
  },
});
