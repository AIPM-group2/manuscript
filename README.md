# ManuScript — AI-assisted formatting checker

ManuScript helps discover and fix formatting issues in academic article drafts by analyzing document text against configurable formatting rules using an AI backend.

## Features
- Upload DOCX files in the browser and extract HTML using `mammoth`.
- Analyze documents against a set of formatting rules using an AI model.
- Interactive web UI with per-rule pass/fail and justifications.
- Export analysis results as JSON.

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
  - Methods: [`AIAnalyser.analyzeFile`](src/smarts.ts), [`AIAnalyser.analyzeRules`](src/smarts.ts)
- Rule type: [`FormattingRule`](src/smarts.ts)
- Default rule set: [`rules`](src/pediatric_journal.ts)
Files:
- UI: [src/routes/+page.svelte](src/routes/+page.svelte)
- Analyzer: [src/smarts.ts](src/smarts.ts)
- Rules: [src/pediatric_journal.ts](src/pediatric_journal.ts)

## Adding or editing rules
Rules live in [src/pediatric_journal.ts](src/pediatric_journal.ts). Each rule is a `new FormattingRule(name, instruction)` which is consumed by [`AIAnalyser.analyzeRules`](src/smarts.ts). To add a new rule:
1. Edit [src/pediatric_journal.ts](src/pediatric_journal.ts) and add a new `FormattingRule`.
2. Re-run the app and upload a DOCX to see the rule evaluated in the UI.

