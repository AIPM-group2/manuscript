# ManuScript — AI-assisted formatting checker

ManuScript helps discover and fix formatting issues in academic article drafts by analyzing document text against configurable formatting rules using an AI backend.

## Features
- Upload DOCX files and extract content with **two conversion methods**:
  - **Legacy**: HTML conversion via `mammoth` (simple, well-tested)
  - **New (Recommended)**: Structured metadata extraction (2x faster, 97% smaller, preserves formatting details)
- Analyze documents against a set of formatting rules using an AI model.
- Interactive web UI with per-rule pass/fail and justifications.
- Export analysis results as JSON.
- Debug mode to inspect AI decisions and raw responses.

## Quick start
Install and run locally
```sh
npm install
npm run dev -- --open
```

Build and preview
```sh
npm run build
npm run preview
```

## Core code and important symbols
- Analyzer implementation: [`AIAnalyser`](src/smarts.ts) — main client wrapper around the AI API and file extraction.
  - Methods: [`AIAnalyser.analyzeFile`](src/smarts.ts), [`AIAnalyser.analyzeRules`](src/smarts.ts), [`AIAnalyser.analyzeRulesFromDocx`](src/smarts.ts)
- **NEW**: Structured DOCX Converter: [`DocxConverter`](src/docx-converter.ts) — ContextGem-inspired rich metadata extraction
  - See [DOCX Converter Comparison](docs/DOCX-CONVERTER-COMPARISON.md) for detailed comparison
- Rule type: [`FormattingRule`](src/smarts.ts)
- Default rule set: [`rules`](src/pediatric_journal.ts)
Files:
- UI: [src/routes/+page.svelte](src/routes/+page.svelte)
- Analyzer: [src/smarts.ts](src/smarts.ts)
- **NEW** Structured Converter: [src/docx-converter.ts](src/docx-converter.ts)
- Rules: [src/pediatric_journal.ts](src/pediatric_journal.ts)

## Adding or editing rules
Rules live in [src/pediatric_journal.ts](src/pediatric_journal.ts). Each rule is a `new FormattingRule(name, instruction)` which is consumed by [`AIAnalyser.analyzeRules`](src/smarts.ts). To add a new rule:
1. Edit [src/pediatric_journal.ts](src/pediatric_journal.ts) and add a new `FormattingRule`.
2. Re-run the app and upload a DOCX to see the rule evaluated in the UI.

## Testing and Utilities

### Compare DOCX Converters
```sh
npm run compare-converters data/article1-0.docx
```
Compares the legacy Mammoth HTML converter vs. the new structured converter. See [docs/DOCX-CONVERTER-COMPARISON.md](docs/DOCX-CONVERTER-COMPARISON.md) for details.

### Run Test Suite
```sh
# Run all tests
npm test

# Run tests with debug output
DEBUG_RULES=1 npm test

# Export test results to JSON
EXPORT_RESULTS=1 npm test
```

### Convert DOCX to HTML (standalone)
```sh
npm run convert data/article1-0.docx [output.html]
```

