import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { AIAnalyser } from '../smarts.js';
import { generalRules } from '../general_rules.js';
import { guidelineToRuleMap } from './guideline-mapping.js';
import { articleTestCases, getExpectedPassingGuidelines, originalArticle } from './test-data-config.js';

// Load environment variables from .env file
config();

/**
 * Automated Accuracy Test Suite for ManuScript AI Formatting Checker
 *
 * This suite tests the AI analyzer's ability to correctly identify formatting violations
 * using the modified test articles in the data/ directory.
 */

// Skip tests if API key is not set
const API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
const shouldRunTests = !!API_KEY;
const exportEnabled = process.env.EXPORT_RESULTS === '1';

// Container for exporting detailed rule decisions
interface ExportRecord {
  scope: 'baseline' | 'version';
  version?: number;
  filename: string;
  description?: string;
  rules: Record<string, any>; // RuleAnalysisResult with debug fields if enabled
}
const exportRecords: ExportRecord[] = [];

// Helper function to write export file
function writeExport() {
  if (!exportEnabled) return;
  try {
    const outDir = join(process.cwd(), 'test-output');
    if (!existsSync(outDir)) {
      mkdirSync(outDir);
    }
    const exportPayload = {
      generatedAt: new Date().toISOString(),
      totalScopes: exportRecords.length,
      baseline: exportRecords.find(r => r.scope === 'baseline') || null,
      versions: exportRecords.filter(r => r.scope === 'version'),
      ruleCount: generalRules.length,
      debugIncluded: process.env.DEBUG_RULES === '1',
    };
    const fileName = `analysis-run-${new Date().toISOString().replace(/[:]/g, '-').split('.')[0]}.json`;
    const fullPath = join(outDir, fileName);
    writeFileSync(fullPath, JSON.stringify(exportPayload, null, 2), 'utf8');
    console.log(`\n📝 Exported to: ${fullPath}`);
  } catch (err) {
    console.warn('Failed to write export:', (err as Error).message);
  }
}

if (!shouldRunTests) {
  console.warn('\n⚠️  Skipping accuracy tests: No API key found.');
  console.warn('Set OPENROUTER_API_KEY or OPENAI_API_KEY environment variable to run these tests.\n');
}

describe.skipIf(!shouldRunTests)('Manuscript Accuracy Test Suite', () => {
  let analyzer: AIAnalyser;
  const dataDir = join(process.cwd(), 'data');

  beforeAll(() => {
    if (API_KEY) {
      analyzer = new AIAnalyser(API_KEY, 8);
    }
  });

  describe('Baseline: Original Article', () => {
    test('should pass most guidelines for unmodified article', async () => {
      const filePath = join(dataDir, originalArticle.filename);

      // Use structured converter for better formatting metadata extraction
      const results = await analyzer.analyzeRulesFromDocx(filePath, generalRules, { 
        debug: process.env.DEBUG_RULES === '1',
        useStructured: true 
      });

      if (exportEnabled) {
        exportRecords.push({
          scope: 'baseline',
          filename: originalArticle.filename,
          description: originalArticle.description,
          rules: results,
        });
        
        // Export immediately after baseline
        writeExport();
      }

      // Count passing rules
      const passingCount = Object.values(results).filter(r => r.decision === true).length;
      const totalCount = Object.values(results).length;
      const passRate = (passingCount / totalCount) * 100;

      console.log(`\n Original article: ${passingCount}/${totalCount} rules passed (${passRate.toFixed(1)}%)`);

      // We expect the original to pass most rules (at least 80%)
      // Some rules may fail due to AI interpretation or edge cases
      expect(passRate).toBeGreaterThanOrEqual(80);
    }, 300000); // 5 minute timeout for baseline test
  });

  describe('Modified Articles: Violation Detection', () => {
    // Test each modified article version
    articleTestCases.forEach((testCase) => {
      describe(`Version ${testCase.version}: ${testCase.description}`, () => {
        let results: any;

        beforeAll(async () => {
          const filePath = join(dataDir, testCase.filename);

          // Use structured converter for better formatting metadata extraction
          results = await analyzer.analyzeRulesFromDocx(filePath, generalRules, { 
            debug: process.env.DEBUG_RULES === '1',
            useStructured: true 
          });

          if (exportEnabled) {
            exportRecords.push({
              scope: 'version',
              version: testCase.version,
              filename: testCase.filename,
              description: testCase.description,
              rules: results,
            });
            
            // Export after each version
            writeExport();
          }
        }, 300000); // 5 minute timeout

        test('should detect intentionally broken guidelines', () => {
          const detectedViolations: number[] = [];
          const missedViolations: number[] = [];

          testCase.brokenGuidelines.forEach(guidelineNum => {
            const ruleName = guidelineToRuleMap[guidelineNum];
            const result = results[ruleName];

            if (result) {
              if (result.decision === false) {
                detectedViolations.push(guidelineNum);
              } else {
                missedViolations.push(guidelineNum);
              }
            } else {
              console.warn(`Rule not found for guideline ${guidelineNum}: ${ruleName}`);
            }
          });

          const detectionRate = (detectedViolations.length / testCase.brokenGuidelines.length) * 100;

          console.log(`\n v${testCase.version} Violation Detection:`);
          console.log(`   Detected: ${detectedViolations.length}/${testCase.brokenGuidelines.length} (${detectionRate.toFixed(1)}%)`);
          if (detectedViolations.length > 0) {
            console.log(`Found violations in guidelines: ${detectedViolations.join(', ')}`);
          }
          if (missedViolations.length > 0) {
            console.log(`Missed violations in guidelines: ${missedViolations.join(', ')}`);
          }

          // We expect at least 70% detection rate for intentional violations
          expect(detectionRate).toBeGreaterThanOrEqual(70);
        });

        test('should not flag false positives on non-broken guidelines', () => {
          const expectedPassing = getExpectedPassingGuidelines(testCase.version);
          const falsePositives: number[] = [];
          const correctPasses: number[] = [];

          expectedPassing.forEach(guidelineNum => {
            const ruleName = guidelineToRuleMap[guidelineNum];
            const result = results[ruleName];

            if (result) {
              if (result.decision === false) {
                falsePositives.push(guidelineNum);
              } else {
                correctPasses.push(guidelineNum);
              }
            }
          });

          const accuracy = (correctPasses.length / expectedPassing.length) * 100;
          const falsePositiveRate = (falsePositives.length / expectedPassing.length) * 100;

          console.log(`\n v${testCase.version} False Positive Analysis:`);
          console.log(`Correct passes: ${correctPasses.length}/${expectedPassing.length} (${accuracy.toFixed(1)}%)`);
          if (falsePositives.length > 0) {
            console.log(`False positives: ${falsePositives.length} (${falsePositiveRate.toFixed(1)}%) in guidelines: ${falsePositives.slice(0, 10).join(', ')}${falsePositives.length > 10 ? '...' : ''}`);
          }

          // We expect false positive rate to be under 30%
          expect(falsePositiveRate).toBeLessThan(30);
        });

        test('should calculate overall accuracy metrics', () => {
          const brokenGuidelines = testCase.brokenGuidelines;
          const passingGuidelines = getExpectedPassingGuidelines(testCase.version);

          let truePositives = 0;  // Correctly identified violations
          let falseNegatives = 0; // Missed violations
          let trueNegatives = 0;  // Correctly identified as passing
          let falsePositives = 0; // Incorrectly flagged as violations

          // Check violations
          brokenGuidelines.forEach(guidelineNum => {
            const ruleName = guidelineToRuleMap[guidelineNum];
            const result = results[ruleName];
            if (result && result.decision === false) {
              truePositives++;
            } else {
              falseNegatives++;
            }
          });

          // Check passing guidelines
          passingGuidelines.forEach(guidelineNum => {
            const ruleName = guidelineToRuleMap[guidelineNum];
            const result = results[ruleName];
            if (result && result.decision === true) {
              trueNegatives++;
            } else if (result && result.decision === false) {
              falsePositives++;
            }
          });

          // Calculate metrics
          const precision = truePositives / (truePositives + falsePositives) || 0;
          const recall = truePositives / (truePositives + falseNegatives) || 0;
          const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
          const accuracy = (truePositives + trueNegatives) /
                          (truePositives + trueNegatives + falsePositives + falseNegatives) || 0;

          console.log(`\n v${testCase.version} Overall Metrics:`);
          console.log(`   Accuracy:  ${(accuracy * 100).toFixed(1)}%`);
          console.log(`   Precision: ${(precision * 100).toFixed(1)}%`);
          console.log(`   Recall:    ${(recall * 100).toFixed(1)}%`);
          console.log(`   F1 Score:  ${(f1Score * 100).toFixed(1)}%`);
          console.log(`   TP: ${truePositives}, FP: ${falsePositives}, TN: ${trueNegatives}, FN: ${falseNegatives}`);

          // Store metrics for potential reporting
          expect(accuracy).toBeGreaterThan(0.5); // At least 50% overall accuracy
        });
      });
    });
  });

  describe('Overall Test Suite Summary', () => {
    test('should generate summary report', async () => {
      console.log('\n' + '='.repeat(60));
      console.log('AUTOMATED ACCURACY TEST SUITE SUMMARY');
      console.log('='.repeat(60));
      console.log(`Tested ${articleTestCases.length} modified article versions`);
      console.log(`Validated against ${generalRules.length} formatting rules`);
      console.log(`Total broken guidelines tested: ${articleTestCases.reduce((sum, tc) => sum + tc.brokenGuidelines.length, 0)}`);
      console.log('='.repeat(60) + '\n');

      expect(true).toBe(true);
    });
  });

  afterAll(() => {
    if (!exportEnabled) return;
    try {
      const outDir = join(process.cwd(), 'test-output');
      if (!existsSync(outDir)) {
        mkdirSync(outDir);
      }
      const exportPayload = {
        generatedAt: new Date().toISOString(),
        totalScopes: exportRecords.length,
        baseline: exportRecords.find(r => r.scope === 'baseline') || null,
        versions: exportRecords.filter(r => r.scope === 'version'),
        ruleCount: generalRules.length,
        debugIncluded: process.env.DEBUG_RULES === '1',
      };
      const fileName = `analysis-run-${new Date().toISOString().replace(/[:]/g, '-').split('.')[0]}.json`;
      const fullPath = join(outDir, fileName);
      writeFileSync(fullPath, JSON.stringify(exportPayload, null, 2), 'utf8');
      console.log(`\n📝 Exported detailed analysis JSON to: ${fullPath}`);
      console.log(`Contains raw model responses: ${process.env.DEBUG_RULES === '1' ? 'yes' : 'no (set DEBUG_RULES=1 to include)'}`);
    } catch (err) {
      console.warn('Failed to write export JSON:', (err as Error).message);
    }
  });
});
