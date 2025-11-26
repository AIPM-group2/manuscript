/**
 * Test script to compare Mammoth HTML conversion vs. Structured DOCX converter
 * 
 * Usage:
 *   npx tsx scripts/test-converter-comparison.ts <path-to-docx>
 * 
 * Example:
 *   npx tsx scripts/test-converter-comparison.ts data/article1-0.docx
 */

import { DocxConverter } from '../src/docx-converter';
import mammoth from 'mammoth';
import { resolve } from 'path';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node scripts/test-converter-comparison.js <path-to-docx>');
    process.exit(1);
  }

  const filePath = resolve(args[0]);
  console.log(`\n📄 Analyzing file: ${filePath}\n`);
  console.log('═'.repeat(80));

  try {
    // Method 1: Mammoth HTML conversion
    console.log('\n🔧 METHOD 1: Mammoth HTML Conversion');
    console.log('─'.repeat(80));
    const mammothStart = Date.now();
    const mammothResult = await mammoth.convertToHtml({ path: filePath });
    const mammothTime = Date.now() - mammothStart;
    
    console.log(`✓ Conversion time: ${mammothTime}ms`);
    console.log(`✓ HTML length: ${mammothResult.value.length} characters`);
    console.log('\nFirst 500 characters:');
    console.log(mammothResult.value.substring(0, 500));
    console.log('...\n');

    // Method 2: Structured DOCX converter (ContextGem-style)
    console.log('\n🔧 METHOD 2: Structured DOCX Converter (ContextGem-style)');
    console.log('─'.repeat(80));
    const converter = new DocxConverter();
    const structuredStart = Date.now();
    const doc = await converter.convert(filePath);
    const structuredTime = Date.now() - structuredStart;

    console.log(`✓ Conversion time: ${structuredTime}ms`);
    console.log(`✓ Paragraphs extracted: ${doc.paragraphs.length}`);
    console.log(`✓ Tables extracted: ${doc.tables.length}`);
    console.log(`✓ Styles defined: ${doc.styles.size}`);

    // Show paragraph metadata sample
    console.log('\n📋 Sample Paragraph Metadata (first 3 paragraphs):');
    for (let i = 0; i < Math.min(3, doc.paragraphs.length); i++) {
      const para = doc.paragraphs[i];
      console.log(`\nParagraph ${i + 1}:`);
      console.log(`  Text: "${para.text.substring(0, 100)}${para.text.length > 100 ? '...' : ''}"`);
      console.log(`  Style: ${para.style || 'None'}`);
      console.log(`  Runs: ${para.runs.length}`);
      
      if (para.spacingBefore || para.spacingAfter) {
        console.log(`  Spacing: before=${para.spacingBefore || 0}, after=${para.spacingAfter || 0}`);
      }
      
      if (para.alignment) {
        console.log(`  Alignment: ${para.alignment}`);
      }

      if (para.listLevel !== undefined) {
        console.log(`  List level: ${para.listLevel}`);
      }

      // Show run details if multiple runs with different formatting
      if (para.runs.length > 1) {
        console.log('  Text runs:');
        para.runs.forEach((run, idx) => {
          const formatting = [];
          if (run.bold) formatting.push('bold');
          if (run.italic) formatting.push('italic');
          if (run.underline) formatting.push('underline');
          if (run.fontSize) formatting.push(`${run.fontSize / 2}pt`);
          
          const formatStr = formatting.length > 0 ? ` [${formatting.join(', ')}]` : '';
          console.log(`    ${idx + 1}. "${run.text}"${formatStr}`);
        });
      }
    }

    // Compare output formats
    console.log('\n\n📊 OUTPUT FORMATS COMPARISON');
    console.log('═'.repeat(80));

    console.log('\n▶ Plain Text Format:');
    console.log('─'.repeat(80));
    const plainText = doc.toPlainText();
    console.log(plainText.substring(0, 500));
    console.log(`... (${plainText.length} total characters)\n`);

    console.log('\n▶ Markdown Format:');
    console.log('─'.repeat(80));
    const markdown = doc.toMarkdown();
    console.log(markdown.substring(0, 500));
    console.log(`... (${markdown.length} total characters)\n`);

    console.log('\n▶ Structured Text Format (with metadata annotations):');
    console.log('─'.repeat(80));
    const structured = doc.toStructuredText();
    console.log(structured.substring(0, 800));
    console.log(`... (${structured.length} total characters)\n`);

    // Summary comparison
    console.log('\n\n📈 COMPARISON SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Mammoth HTML:           ${mammothResult.value.length.toLocaleString()} chars (${mammothTime}ms)`);
    console.log(`Structured Plain Text:  ${plainText.length.toLocaleString()} chars (${structuredTime}ms)`);
    console.log(`Structured Markdown:    ${markdown.length.toLocaleString()} chars`);
    console.log(`Structured Annotated:   ${structured.length.toLocaleString()} chars`);
    console.log('\n💡 Benefits of Structured Converter:');
    console.log('  ✓ Preserves paragraph styles (Normal, Heading 1-6, etc.)');
    console.log('  ✓ Extracts font information (family, size, bold, italic, underline)');
    console.log('  ✓ Captures spacing (before/after paragraphs, line spacing)');
    console.log('  ✓ Preserves list information (numbered/bulleted, nesting level)');
    console.log('  ✓ Maintains table structure with cell metadata');
    console.log('  ✓ Provides individual text run formatting');
    console.log('  ✓ Better for AI formatting rule analysis\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
