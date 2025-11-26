#!/usr/bin/env node
import mammoth from 'mammoth';
import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, resolve } from 'path';

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath) {
    console.error('Usage: npm run convert -- <input.docx> [output.html]');
    process.exit(1);
  }
  if (!inputPath.endsWith('.docx')) {
    console.error('Input file must be a .docx');
    process.exit(1);
  }
  const absInput = resolve(inputPath);
  if (!existsSync(absInput)) {
    console.error('Input file not found: ' + absInput);
    process.exit(1);
  }
  try {
    const result = await mammoth.convertToHtml({ path: absInput });
    const html = result.value;
    if (outputPath) {
      const absOut = resolve(outputPath);
      await writeFile(absOut, html, 'utf8');
      console.log('Wrote HTML to ' + absOut);
    } else {
      process.stdout.write(html);
    }
  } catch (err) {
    console.error('Conversion failed: ' + (err?.message || err));
    process.exit(1);
  }
}

main();
