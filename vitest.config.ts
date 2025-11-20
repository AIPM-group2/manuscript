import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({ path: ".env.test" });

export default defineConfig({
  test: {
    env: {
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    },
    environment: "node",
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

