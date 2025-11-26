# DOCX Converter Comparison

This project now includes two DOCX conversion approaches:

## 1. Mammoth HTML Converter (Legacy)
- **Location**: Used in `src/smarts.ts` via `mammoth` npm package
- **Output**: HTML format
- **Pros**: 
  - Simple, well-tested
  - Good for basic text extraction
- **Cons**: 
  - Loses document structure metadata
  - Output is ~1.1MB HTML for typical document
  - Doesn't preserve formatting details like spacing, styles, fonts

## 2. Structured DOCX Converter (New - ContextGem-inspired)
- **Location**: `src/docx-converter.ts`
- **Output**: Rich structured format with metadata
- **Pros**:
  - **2x faster** (200ms vs 439ms)
  - **97% smaller** output (33KB vs 1.1MB)
  - Preserves paragraph styles (Heading 1-6, Normal, Title, etc.)
  - Extracts font details (family, size, bold, italic, underline)
  - Captures spacing (before/after paragraphs, line spacing)
  - Preserves list information (numbered/bulleted, nesting level)
  - Maintains table structure with cell metadata
  - Individual text run formatting
  - **Better for AI formatting rule analysis**

## Structured Converter Output Formats

The structured converter provides three output formats:

### 1. Plain Text (`doc.toPlainText()`)
Simple concatenated text without any markup - smallest output.

### 2. Markdown (`doc.toMarkdown()`)
Markdown format with:
- Headings converted to `# Heading 1`, `## Heading 2`, etc.
- Bold, italic, underline formatting
- Tables in markdown format
- Lists preserved

### 3. Structured Annotated (`doc.toStructuredText()`)
Text with metadata annotations for LLM analysis:
```
[style=Heading1, space-before=240, align=center] Introduction
[style=Normal, space-before=120, space-after=120] This is a paragraph...
  RUN[bold, size=12pt, font=Times New Roman]: "emphasized text"
  RUN[size=12pt, font=Times New Roman]: "normal text"
```

## Testing the Converters

Compare both converters on any DOCX file:

```bash
npm run compare-converters data/article1-0.docx
```

This will show:
- Conversion times
- Output sizes
- Sample metadata
- All three output formats

## Using in Your Code

### Legacy Mammoth approach:
```typescript
import { AIAnalyser } from './smarts';

const analyser = new AIAnalyser(apiKey);
const htmlContent = await analyser.analyzeFilePath('document.docx');
```

### New Structured approach:
```typescript
import { AIAnalyser } from './smarts';
import { DocxConverter } from './docx-converter';

const analyser = new AIAnalyser(apiKey);

// Get structured document
const doc = await analyser.analyzeFilePathStructured('document.docx');

// Use the format that best suits your needs
const plainText = doc.toPlainText();
const markdown = doc.toMarkdown();
const annotated = doc.toStructuredText();

// Or use the integrated method
const results = await analyser.analyzeRulesFromDocx(
  'document.docx',
  formattingRules,
  { debug: true, useStructured: true }  // useStructured: true for new converter
);
```

## Why the Structured Converter is Better for Formatting Rule Analysis

The structured converter preserves critical formatting metadata that the AI needs to evaluate rules:

**Example Rule**: "All headings must be in Arial font, 14pt"

**Mammoth HTML** (Hard for AI to extract font info):
```html
<h1>Introduction</h1>
```

**Structured Annotated** (Easy for AI to parse):
```
[style=Heading1, space-before=240] Introduction
  RUN[bold, size=14pt, font=Arial]: "Introduction"
```

The AI can directly see:
- Style type (Heading1)
- Font family (Arial)
- Font size (14pt)
- Spacing values
- Bold/italic/underline formatting
- List levels
- Alignment

This makes AI rule evaluation **more accurate and reliable**.

## Implementation Details

The structured converter:
1. Unzips the DOCX file (DOCX is a ZIP containing XML files)
2. Parses `word/document.xml` for document structure
3. Parses `word/styles.xml` for style definitions
4. Parses `word/numbering.xml` for list formatting
5. Extracts rich metadata for each paragraph and text run
6. Provides multiple output format options

Technologies used:
- `jszip` - Extract DOCX ZIP contents
- `fast-xml-parser` - Parse Word XML efficiently

## Migration Recommendation

For formatting rule analysis, **switch to the structured converter** by setting `useStructured: true`:

```typescript
// Before
const results = await analyser.analyzeRulesFromDocx(filePath, rules, { debug: true });

// After (better accuracy)
const results = await analyser.analyzeRulesFromDocx(filePath, rules, { 
  debug: true, 
  useStructured: true 
});
```

The AI will have access to complete formatting metadata, leading to more accurate rule evaluation.
