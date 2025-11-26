import { config } from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
config();

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.error('❌ OPENROUTER_API_KEY not found in .env file');
  process.exit(1);
}

console.log('✅ API Key loaded from .env');
console.log(`🔑 Key starts with: ${apiKey.substring(0, 15)}...`);

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: apiKey,
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/AIPM-group2/manuscript",
    "X-Title": "ManuScript Formatter"
  }
});

async function testAPI() {
  try {
    console.log('\n📡 Testing API call with model: openrouter/sherlock-think-alpha');
    
    const startTime = Date.now();
    const response = await client.chat.completions.create({
      model: "openrouter/sherlock-think-alpha",
      messages: [
        { role: "user", content: "Say 'Hello' in JSON format: {\"message\": \"...\"}" }
      ],
    });
    const duration = Date.now() - startTime;

    console.log(`✅ API call successful! (${duration}ms)`);
    console.log('📝 Response:', response.choices[0].message.content);
    console.log('\n✨ All systems working!');
    
  } catch (error) {
    console.error('❌ API call failed:', (error as Error).message);
    if ((error as any).response) {
      console.error('Response status:', (error as any).response.status);
      console.error('Response data:', (error as any).response.data);
    }
    process.exit(1);
  }
}

testAPI();
