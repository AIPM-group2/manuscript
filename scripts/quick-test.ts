import { config } from 'dotenv';
import { AIAnalyser, FormattingRule } from '../src/smarts.js';
import { join } from 'path';

// Load environment variables
config();

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.error('❌ OPENROUTER_API_KEY not found');
  process.exit(1);
}

console.log('✅ Testing with structured XML converter\n');

const analyzer = new AIAnalyser(apiKey, 8);

// Test with just 3 rules
const testRules = [
  new FormattingRule("File Format", "Manuscripts must be submitted in .docx format"),
  new FormattingRule("Font Style and Size", "Use Times New Roman, 12pt font"),
  new FormattingRule("Page Numbering", "Include page numbers"),
];

async function quickTest() {
  const startTime = Date.now();
  const filePath = join(process.cwd(), 'data', 'article1-0.docx');
  
  console.log(`📄 Analyzing: ${filePath}`);
  console.log(`🔢 Rules to check: ${testRules.length}`);
  console.log(`🚀 Starting analysis...\n`);
  
  try {
    const results = await analyzer.analyzeRulesFromDocx(filePath, testRules, {
      debug: false,
      useStructured: true
    });
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ Analysis complete in ${(duration/1000).toFixed(1)}s`);
    console.log('\nResults:');
    
    Object.entries(results).forEach(([rule, result]) => {
      const icon = result.decision ? '✅' : '❌';
      console.log(`${icon} ${rule}: ${result.decision ? 'PASS' : 'FAIL'}`);
      console.log(`   ${result.justification}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

quickTest();
