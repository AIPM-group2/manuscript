/**
 * DOCX to XML Token Counter
 * 
 * This script:
 * 1. Converts a DOCX file to structured XML/text using the DocxConverter
 * 2. Calculates the approximate token count for API calls
 * 
 * Usage:
 *   tsx scripts/docx-to-xml-token-count.ts <path-to-docx-file>
 */

import { DocxConverter } from '../src/docx-converter';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Approximate token counter using the common rule of thumb:
 * 1 token ≈ 4 characters for English text
 * This is a simplification; actual tokenization varies by model
 */
function estimateTokenCount(text: string): number {
  // Remove excessive whitespace
  const normalized = text.replace(/\s+/g, ' ').trim();
  
  // Rough estimation: 1 token per 4 characters
  const charBasedEstimate = Math.ceil(normalized.length / 4);
  
  // Alternative estimation: count words and multiply by 1.3
  // (accounts for punctuation and special tokens)
  const words = normalized.split(/\s+/).length;
  const wordBasedEstimate = Math.ceil(words * 1.3);
  
  // Return the average of both methods for better accuracy
  return Math.ceil((charBasedEstimate + wordBasedEstimate) / 2);
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: tsx scripts/docx-to-xml-token-count.ts <path-to-docx-file>');
    process.exit(1);
  }
  
  const docxPath = resolve(args[0]);
  
  console.log('='.repeat(60));
  console.log('DOCX to XML Token Counter');
  console.log('='.repeat(60));
  console.log(`Input file: ${docxPath}`);
  console.log();
  
  try {
    // Load and convert DOCX
    console.log('Converting DOCX to structured format...');
    const converter = new DocxConverter();
    const doc = await converter.convert(docxPath);
    
    // Generate different output formats
    const markdown = doc.toMarkdown();
    const plainText = doc.toPlainText();
    const structuredText = doc.toStructuredText();
    
    // Calculate statistics
    const fileSize = readFileSync(docxPath).length;
    
    console.log('Conversion complete!');
    console.log();
    console.log('-'.repeat(60));
    console.log('DOCUMENT STATISTICS');
    console.log('-'.repeat(60));
    console.log(`Original file size: ${formatBytes(fileSize)}`);
    console.log(`Paragraphs: ${doc.paragraphs.length}`);
    console.log(`Tables: ${doc.tables.length}`);
    console.log(`Styles defined: ${doc.styles.size}`);
    console.log();
    
    console.log('-'.repeat(60));
    console.log('TOKEN ESTIMATES (for API calls)');
    console.log('-'.repeat(60));
    
    // Markdown format
    const mdTokens = estimateTokenCount(markdown);
    const mdChars = markdown.length;
    console.log(`\nMarkdown format:`);
    console.log(`  Characters: ${mdChars.toLocaleString()}`);
    console.log(`  Estimated tokens: ~${mdTokens.toLocaleString()}`);
    console.log(`  Size: ${formatBytes(mdChars)}`);
    
    // Plain text format
    const plainTokens = estimateTokenCount(plainText);
    const plainChars = plainText.length;
    console.log(`\nPlain text format:`);
    console.log(`  Characters: ${plainChars.toLocaleString()}`);
    console.log(`  Estimated tokens: ~${plainTokens.toLocaleString()}`);
    console.log(`  Size: ${formatBytes(plainChars)}`);
    
    // Structured text format
    const structuredTokens = estimateTokenCount(structuredText);
    const structuredChars = structuredText.length;
    console.log(`\nStructured text format (with metadata):`);
    console.log(`  Characters: ${structuredChars.toLocaleString()}`);
    console.log(`  Estimated tokens: ~${structuredTokens.toLocaleString()}`);
    console.log(`  Size: ${formatBytes(structuredChars)}`);
    
    console.log();
    console.log('-'.repeat(60));
    console.log('API COST ESTIMATES');
    console.log('-'.repeat(60));
    
    // Example pricing (approximate, as of 2024)
    const gpt4InputCost = 0.03 / 1000;  // $0.03 per 1K tokens
    const gpt4OutputCost = 0.06 / 1000; // $0.06 per 1K tokens
    const gpt35Cost = 0.0015 / 1000;    // $0.0015 per 1K tokens
    
    console.log(`\nUsing Markdown format (~${mdTokens.toLocaleString()} tokens):`);
    console.log(`  GPT-4 input: ~$${(mdTokens * gpt4InputCost).toFixed(4)}`);
    console.log(`  GPT-3.5-turbo: ~$${(mdTokens * gpt35Cost).toFixed(4)}`);
    
    console.log();
    console.log('-'.repeat(60));
    console.log('PREVIEW (first 500 characters of markdown)');
    console.log('-'.repeat(60));
    console.log(markdown.substring(0, 500));
    if (markdown.length > 500) {
      console.log('\n... (truncated)');
    }
    console.log();
    
    // Save outputs to files (optional)
    const saveSample = args.includes('--save');
    if (saveSample) {
      const { writeFileSync } = await import('fs');
      const { basename } = await import('path');
      const baseName = basename(docxPath, '.docx');
      
      writeFileSync(`test-output/${baseName}-markdown.md`, markdown);
      writeFileSync(`test-output/${baseName}-plain.txt`, plainText);
      writeFileSync(`test-output/${baseName}-structured.txt`, structuredText);
      
      console.log('Sample outputs saved to test-output/');
      console.log(`  - ${baseName}-markdown.md`);
      console.log(`  - ${baseName}-plain.txt`);
      console.log(`  - ${baseName}-structured.txt`);
      console.log();
    }
    
    console.log('='.repeat(60));
    console.log('Tip: Add --save flag to save output samples to test-output/');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error processing DOCX file:');
    console.error(error);
    process.exit(1);
  }
}

main();
