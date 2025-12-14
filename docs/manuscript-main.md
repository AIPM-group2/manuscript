# Manuscript Validation System - Implementation Guide
## Accuracy Improvement Phase (Sprint 5-6)

**Scope**: Build the complete error detection and validation system before auto-fix capability.  
**Timeline**: Sprint 5 (Focus on accuracy only, no auto-fix yet)  
**Goal**: Achieve 90%+ accuracy on all 55 rules + generate accurate error reports  

---

## **📋 PART 1: RULE CLASSIFICATION (ALREADY DETERMINED)**

### **Programmatic Rules (40 Rules) - Code Only**
These rules use pattern matching, logic, and measurement. NO LLM needed.

#### **Categories & Examples**

##### **1. Pattern Matching Rules (12 rules)**
- Citation Format: `[1]`, `[2-4]`, `[1,3,5]` (not `[Smith 2023]`)
- Figure Numbering: Sequential `Fig. 1, Fig. 2, Fig. 3` (not `Figure 1a, 1b`)
- Table Numbering: Sequential `Table 1, Table 2, Table 3`
- Reference Numbering: `1, 2, 3...` in order
- ORCID Format: `XXXX-XXXX-XXXX-XXXL` with valid checksum
- DOI Format: `https://doi.org/10.xxxx/xxxxx`
- URL Format: Valid HTTP/HTTPS protocols
- Author Initials: `A.B.` or `AB` format

##### **2. Measurement Rules (8 rules)**
- Abstract Word Count: 150-250 words (count words, simple threshold)
- Title Word Count: 10-15 words
- Keywords Count: 3-6 keywords
- Figure Resolution: ≥300 DPI (from image metadata)
- Table Columns: ≤5-6 columns (from table structure)
- Line Spacing: Double-spaced (from XML formatting)
- Margins: 1 inch (2.54cm) on all sides (from page properties)
- Font Size: 12pt body, 14pt headers (from style XML)

##### **3. Presence Rules (12 rules)**
- Title Present: Document has a title section
- Abstract Present: Document has abstract section
- Keywords Present: Keywords section exists
- Introduction Present: Introduction/Background section exists
- Methods Present: Methods/Materials section exists
- Results Present: Results section exists
- Discussion Present: Discussion section exists
- Conclusion Present: Conclusion section (or conclusion in discussion)
- References Present: References section with ≥1 reference
- Author Information: Author names and affiliations present
- Page Numbers: Page numbers on each page
- Figure Captions: Every figure has a caption

##### **4. Structure Rules (8 rules)**
- Section Order: Correct logical sequence (Title → Abstract → Keywords → Intro → Methods → Results → Discussion → Conclusion → References)
- Heading Hierarchy: H1 > H2 > H3 (no H1 inside H3)
- Abbreviation First Use: Abbreviation defined before first use (e.g., "Magnetic Resonance Imaging (MRI)" comes before "MRI scan")
- Table Placement: Tables referenced before or at point of first mention
- Figure Placement: Figures referenced before or at point of first mention
- Reference Citation: Each citation in text has corresponding reference
- Supplementary Reference: Supplementary materials referenced in text
- Section Naming: Section names match journal guidelines (no unusual names)

---

### **Semantic Rules (15 Rules) - LLM Required**
These rules require understanding content, context, and judgment. Use LLM with Chain-of-Thought.

1. **Title Content**: Is title "concise and informative"? (Not just word count - requires judgment)
2. **Declarations (Title Page)**: Are competing interests and funding properly disclosed?
3. **Acknowledgments Placement**: Proper identification and placement of acknowledgments?
4. **Double-Blind Review Setup**: No identifying information in document?
5. **Keywords Quality**: Are keywords "suitable for indexing"? (Semantic relevance judgment)
6. **Manuscript Structure**: Logical flow from Intro → Methods → Results → Discussion?
7. **Abbreviations Consistency**: Abbreviations used consistently and defined on first use?
8. **Figure Caption Content**: Does caption explain all symbols, abbreviations, and findings?
9. **Table Caption/Title**: Is caption "descriptive" of table content and purpose?
10. **Table Prior Publication**: Is content adapted from previous publication (properly acknowledged)?
11. **Supplementary Captions**: Are supplementary materials adequately described?
12. **Abstract Length & Content**: Proper balance of all sections? Any undefined abbreviations?
13. **Abstract Structure Style**: Can you identify Background/Methods/Results/Conclusion sections?
14. **Clinical Trial Registration**: Is this a clinical trial? Properly registered?
15. **References Journal Abbreviations**: Are journal abbreviations ISSN LTWA compliant?

---

## **📐 PART 2: DOCUMENT PARSING ARCHITECTURE**

### **Goal**: Convert DOCX to Unified Document Object (UDO)

### **Layer 1: File Extraction (JSZip)**
```
DOCX File (ZIP archive)
    ↓
├─ word/document.xml (main content + structure)
├─ word/styles.xml (formatting rules)
├─ word/numbering.xml (lists, numbering)
├─ docProps/core.xml (metadata: author, dates)
├─ word/media/* (images, figures)
└─ word/footnotes.xml (footnotes, endnotes)
```

### **Layer 2: Content Extraction (mammoth.js)**
```
document.xml
    ↓ (mammoth.js)
Readable HTML/Text
    ↓
├─ Plain text (for word counting, searching)
├─ Semantic HTML (headings preserved)
└─ Structure information (paragraph types)
```

### **Layer 3: Structure Parsing (XML-based)**
```
document.xml
    ↓ (xml2js)
Parsed JSON structure
    ↓
Extract:
├─ Paragraphs with styles (heading levels)
├─ Tables with cell content
├─ Images/figures with captions
├─ Lists and list items
├─ Bookmarks and sections
└─ Metadata (page count, author, dates)
```

### **Layer 4: Entity Extraction**
```
Unified Document Object (UDO) Structure:

{
  // Metadata
  metadata: {
    fileName: string
    createdDate: Date
    modifiedDate: Date
    author: string
    pageCount: number
    wordCount: number
    characterCount: number
  }

  // Structured Content
  content: {
    title: string
    abstract: string
    keywords: string[]
    sections: Section[]  // {heading, headingLevel, content, startParagraph, endParagraph}
  }

  // Extracted Entities
  entities: {
    citations: Citation[]      // {text, pattern, position, context}
    figures: Figure[]          // {number, caption, position, resolution}
    tables: Table[]            // {number, caption, rows, columns, content}
    references: Reference[]    // {number, text, authors, year, journal}
    abbreviations: Abbrev[]    // {abbr, definition, firstUsePosition}
  }

  // Document Elements
  elements: {
    paragraphs: Paragraph[]    // {text, style, level, type}
    headings: Heading[]        // {text, level, position, section}
    images: Image[]            // {path, caption, resolution, type}
  }

  // Raw Access
  rawHTML: string             // For fallback processing
  rawText: string             // Plain text version
  documentXML: string         // Original XML (for edge cases)
}
```

### **Implementation Tasks**

#### **Task 1: JSZip + Mammoth Integration**
```typescript
// Step 1: Extract DOCX (JSZip)
const zip = await JSZip.loadAsync(file);
const documentXML = await zip.file('word/document.xml').async('string');
const metadataXML = await zip.file('docProps/core.xml').async('string');

// Step 2: Convert to readable format (mammoth.js)
const mammothResult = await mammoth.convertToHtml({ arrayBuffer: file });
const rawText = await mammoth.extractRawText({ arrayBuffer: file });

// Step 3: Parse XML (xml2js)
const parsedDoc = await parseStringPromise(documentXML);
const parsedMeta = await parseStringPromise(metadataXML);

// Step 4: Extract entities
const udo = buildUnifiedDocumentObject(mammothResult, rawText, parsedDoc, parsedMeta);
```

#### **Task 2: Entity Extraction Functions**
```typescript
// Extract Title (first heading OR paragraph styled as "Title")
function extractTitle(udo): string

// Extract Abstract (text between "Abstract" header and next section)
function extractAbstract(udo): string

// Extract Keywords (after keywords section)
function extractKeywords(udo): string[]

// Extract Sections (find all H1/H2 headings and content between them)
function extractSections(udo): Section[]

// Extract Citations (regex: /\[\d+(?:[-,]\d+)*\]/)
function extractCitations(udo): Citation[]

// Extract Figures (regex: /^Fig\.?\s*(\d+)/)
function extractFigures(udo): Figure[]

// Extract Tables (from XML table elements)
function extractTables(udo): Table[]

// Extract References (after References section)
function extractReferences(udo): Reference[]

// Extract Abbreviations (pattern: "Full Name (ABBR)" or standalone "ABBR")
function extractAbbreviations(udo): Abbreviation[]
```

---

## **⚙️ PART 3: PROGRAMMATIC VALIDATION ENGINE (40 Rules)**

### **Architecture**
```
Unified Document Object (UDO)
    ↓
Rule Router (by type: pattern, measurement, presence, structure)
    ↓
├─ Pattern Matcher (Regex rules)
├─ Measurer (Count/threshold rules)
├─ Presence Checker (Existence rules)
└─ Structure Analyzer (Hierarchy rules)
    ↓
Individual Rule Results
    ↓
Aggregated Programmatic Results
```

### **Rule Interface**
```typescript
interface ProgrammaticRule {
  id: number                    // 1-40
  name: string                  // "Citation Format"
  category: string              // "citations", "structure", etc.
  type: 'pattern' | 'measurement' | 'presence' | 'structure'
  validate(udo: UDO): RuleResult
}

interface RuleResult {
  ruleId: number
  status: 'PASS' | 'FAIL' | 'SKIP'
  confidence: 1.0               // Always 100% for programmatic
  message: string               // User-friendly message
  location?: string             // Where in document (e.g., "paragraph 3")
  suggestion?: string           // How to fix
  details?: {
    found?: number              // For measurements (word count, etc.)
    expected?: number
    instances?: string[]        // For pattern matches
  }
}
```

### **Example Rules**

#### **Pattern Matching Rule (Citation Format)**
```typescript
{
  id: 1,
  name: 'Citation Format',
  category: 'citations',
  type: 'pattern',
  validate(udo) {
    // Valid: [1], [2-4], [1,3,5]
    const validPattern = /\[\d+(?:[-,]\d+)*\]/g;
    // Invalid: (Author 2023), [Smith et al.]
    const invalidPattern = /\([A-Za-z\s.,]*\d{4}\)|\[[A-Za-z\s.,]+\]/g;
    
    const validMatches = udo.rawText.match(validPattern) || [];
    const invalidMatches = udo.rawText.match(invalidPattern) || [];
    
    if (invalidMatches.length > 0) {
      return {
        ruleId: 1,
        status: 'FAIL',
        confidence: 1.0,
        message: `Found ${invalidMatches.length} citations in wrong format (should be [1], not [Author 2023])`,
        location: `Line containing: "${invalidMatches[0]}"`,
        suggestion: 'Replace author-year citations with numbered format [1], [2], etc.',
        details: {
          invalidInstances: invalidMatches.slice(0, 3)
        }
      };
    }
    
    return {
      ruleId: 1,
      status: 'PASS',
      confidence: 1.0,
      message: `All ${validMatches.length} citations follow correct [#] format`
    };
  }
}
```

#### **Measurement Rule (Abstract Word Count)**
```typescript
{
  id: 41,  // Starting from 41 (programmatic rules 1-40, then semantic 41-55... wait, that's wrong)
  // Actually: programmatic are 1-40, semantic are 41-55 (15 total)
  // OR: number them separately within each category
  
  name: 'Abstract Word Count',
  category: 'abstract',
  type: 'measurement',
  validate(udo) {
    if (!udo.content.abstract) {
      return {
        ruleId: 2,
        status: 'FAIL',
        confidence: 1.0,
        message: 'Abstract section not found',
        suggestion: 'Add an Abstract section to your manuscript'
      };
    }
    
    const wordCount = udo.content.abstract.split(/\s+/).filter(w => w.length > 0).length;
    const minWords = 150;
    const maxWords = 250;
    
    if (wordCount < minWords) {
      return {
        ruleId: 2,
        status: 'FAIL',
        confidence: 1.0,
        message: `Abstract too short: ${wordCount} words (minimum: ${minWords})`,
        suggestion: `Add ${minWords - wordCount} more words`,
        details: { found: wordCount, expected: `${minWords}-${maxWords}` }
      };
    }
    
    if (wordCount > maxWords) {
      return {
        ruleId: 2,
        status: 'FAIL',
        confidence: 1.0,
        message: `Abstract too long: ${wordCount} words (maximum: ${maxWords})`,
        suggestion: `Remove ${wordCount - maxWords} words`,
        details: { found: wordCount, expected: `${minWords}-${maxWords}` }
      };
    }
    
    return {
      ruleId: 2,
      status: 'PASS',
      confidence: 1.0,
      message: `Abstract word count: ${wordCount} (acceptable range: ${minWords}-${maxWords})`,
      details: { found: wordCount, expected: `${minWords}-${maxWords}` }
    };
  }
}
```

#### **Presence Rule (Keywords Present)**
```typescript
{
  id: 3,
  name: 'Keywords Present',
  category: 'keywords',
  type: 'presence',
  validate(udo) {
    const keywords = udo.content.keywords;
    
    if (!keywords || keywords.length === 0) {
      return {
        ruleId: 3,
        status: 'FAIL',
        confidence: 1.0,
        message: 'Keywords section not found',
        suggestion: 'Add 3-6 keywords section before introduction'
      };
    }
    
    if (keywords.length < 3) {
      return {
        ruleId: 3,
        status: 'FAIL',
        confidence: 1.0,
        message: `Only ${keywords.length} keyword(s) found (minimum: 3)`,
        suggestion: 'Add more keywords'
      };
    }
    
    if (keywords.length > 6) {
      return {
        ruleId: 3,
        status: 'FAIL',
        confidence: 1.0,
        message: `Too many keywords: ${keywords.length} (maximum: 6)`,
        suggestion: 'Remove the least important keywords'
      };
    }
    
    return {
      ruleId: 3,
      status: 'PASS',
      confidence: 1.0,
      message: `Keywords section present with ${keywords.length} keywords: ${keywords.join(', ')}`
    };
  }
}
```

#### **Structure Rule (Abbreviation First Use)**
```typescript
{
  id: 4,
  name: 'Abbreviation First Use',
  category: 'abbreviations',
  type: 'structure',
  validate(udo) {
    const violations = [];
    
    for (const abbr of udo.entities.abbreviations) {
      // Check if defined on first use
      if (!abbr.firstDefinedOnUse) {
        violations.push({
          abbr: abbr.abbr,
          firstUse: abbr.firstUsePosition,
          definition: abbr.definition
        });
      }
    }
    
    if (violations.length > 0) {
      return {
        ruleId: 4,
        status: 'FAIL',
        confidence: 1.0,
        message: `${violations.length} abbreviation(s) used before definition`,
        suggestion: `Define abbreviations on first use: "Full Name (ABBR)"`,
        details: { violations }
      };
    }
    
    return {
      ruleId: 4,
      status: 'PASS',
      confidence: 1.0,
      message: `All abbreviations properly defined on first use`
    };
  }
}
```

### **Implementation Task: Build Rule Engine**
```typescript
// rules/programmatic-rules.ts

export const PROGRAMMATIC_RULES: ProgrammaticRule[] = [
  // Pattern Rules (1-12)
  citationFormatRule,
  figureNumberingRule,
  tableNumberingRule,
  // ... more pattern rules
  
  // Measurement Rules (13-20)
  abstractWordCountRule,
  titleWordCountRule,
  keywordsCountRule,
  // ... more measurement rules
  
  // Presence Rules (21-32)
  titlePresentRule,
  abstractPresentRule,
  keywordsPresentRule,
  // ... more presence rules
  
  // Structure Rules (33-40)
  sectionOrderRule,
  headingHierarchyRule,
  abbreviationFirstUseRule,
  // ... more structure rules
];

export async function runProgrammaticValidation(udo: UDO): Promise<RuleResult[]> {
  const results: RuleResult[] = [];
  
  for (const rule of PROGRAMMATIC_RULES) {
    try {
      const result = rule.validate(udo);
      results.push(result);
    } catch (error) {
      results.push({
        ruleId: rule.id,
        status: 'SKIP',
        confidence: 0,
        message: `Error validating rule: ${error.message}`
      });
    }
  }
  
  return results;
}
```

---

## **🧠 PART 4: SEMANTIC VALIDATION ENGINE (15 Rules with LLM)**

### **Architecture**
```
Unified Document Object (UDO)
    ↓
Journal Config (selected by user)
    ↓
For each Semantic Rule:
    1. Extract relevant content from UDO
    2. Retrieve guideline from Journal Config
    3. Build prompt with:
       - Guideline text
       - Few-shot examples
       - Chain-of-Thought structure
       - Content to validate
    4. Call LLM (Gemini Flash)
    5. Parse JSON response
    ↓
Individual Semantic Results
    ↓
Aggregated Semantic Results
```

### **Semantic Rule Interface**
```typescript
interface SemanticRule {
  id: number                    // 1-15 (or 41-55)
  name: string                  // "Title Content"
  category: string              // Same as programmatic
  type: 'semantic'
  extractContent(udo: UDO): string  // What text to send to LLM
  buildPrompt(content: string, guideline: string, examples: Examples): string
}

interface SemanticRuleResult {
  ruleId: number
  status: 'PASS' | 'FAIL' | 'SKIP'
  confidence: number            // 0.7-1.0 (from LLM's confidence)
  message: string               // LLM's explanation
  location?: string
  suggestion?: string           // LLM's recommendation
  reasoning?: {                 // CoT breakdown
    step1?: string
    step2?: string
    step3?: string
    step4?: string
  }
}
```

### **Journal Config Structure**
```typescript
interface JournalConfig {
  id: string                    // "pediatric-radiology"
  name: string                  // "Pediatric Radiology"
  publisher: string             // "Springer Nature"
  
  // For programmatic rules (40 rules, mostly same across journals)
  programmaticConfig: {
    abstractWordLimit: { min: 150, max: 250 }
    titleWordLimit: { min: 10, max: 15 }
    keywordsLimit: { min: 3, max: 6 }
    citationFormat: 'numbered'  // or 'author-year'
    // ... more config
  }
  
  // For semantic rules (15 rules, varies by journal)
  semanticGuidelines: {
    title_content: {
      guideline: "Title must be concise (10-15 words) and informative..."
      examples: {
        good: ["Pediatric Brain MRI Findings in Acute Leukemia"]
        bad: ["A Study of Various Imaging Findings in Children"]
      }
    }
    // ... 14 more semantic rules
  }
}
```

### **Example Semantic Rules with Full Prompts**

#### **Rule 1: Title Content**
```typescript
{
  id: 1,
  name: 'Title Content',
  category: 'title',
  type: 'semantic',
  
  extractContent(udo) {
    return udo.content.title;
  },
  
  buildPrompt(content, guideline, examples) {
    return `
You are a manuscript editor for Pediatric Radiology.

GUIDELINE:
${guideline}

EXAMPLES OF GOOD TITLES:
${examples.good.map(t => `✅ "${t}"`).join('\n')}

EXAMPLES OF BAD TITLES:
${examples.bad.map(t => `❌ "${t}"`).join('\n')}

TITLE TO EVALUATE:
"${content}"

STEP-BY-STEP ANALYSIS:

Step 1: Count words in the title
- How many words? ___

Step 2: Check if title is specific/informative
- Does it describe the main finding or topic clearly?
- Or is it vague (e.g., "A study of..." or "Investigation into...")?

Step 3: Check for abbreviations
- Are there abbreviations?
- Are they widely known (e.g., MRI, CT)?

Step 4: Check format
- Is it a question? (should not be)
- Does it have unnecessary colons or punctuation?

FINAL DECISION:
Based on your analysis, is this title compliant with the guideline?

Respond ONLY with this JSON:
{
  "status": "PASS" or "FAIL",
  "word_count": <number>,
  "is_specific": true/false,
  "has_issues": ["list of issues found"],
  "explanation": "One clear sentence explaining your decision",
  "confidence": <0.7-1.0>,
  "suggestion": "How to improve (if FAIL)"
}
`;
  }
}
```

#### **Rule 6: Manuscript Structure**
```typescript
{
  id: 6,
  name: 'Manuscript Structure',
  category: 'structure',
  type: 'semantic',
  
  extractContent(udo) {
    // Extract just the heading names and order
    return udo.elements.headings
      .map((h, i) => `${i+1}. ${h.text} (Level ${h.level})`)
      .join('\n');
  },
  
  buildPrompt(content, guideline, examples) {
    return `
You are a manuscript editor validating document structure.

GUIDELINE:
${guideline}

EXPECTED STRUCTURE:
1. Title
2. Abstract
3. Keywords
4. Introduction or Background
5. Methods or Materials and Methods
6. Results
7. Discussion
8. Conclusion (or within Discussion)
9. References

ACTUAL HEADINGS FOUND:
${content}

STEP-BY-STEP ANALYSIS:

Step 1: Identify all sections present
- Which required sections are present?
- In what order?

Step 2: Check logical flow
- Is Introduction before Methods? ✓/✗
- Is Methods before Results? ✓/✗
- Is Results before Discussion? ✓/✗

Step 3: Identify missing sections
- Which required sections are missing?

Step 4: Identify unexpected sections
- Are there sections that don't fit the standard structure?

FINAL DECISION:
Is the manuscript structure correct?

Respond ONLY with this JSON:
{
  "status": "PASS" or "FAIL",
  "sections_found": ["list"],
  "sections_missing": ["list"],
  "logical_flow_correct": true/false,
  "explanation": "Clear explanation of structure",
  "confidence": <0.7-1.0>,
  "suggestion": "How to reorganize (if FAIL)"
}
`;
  }
}
```

#### **Rule 4: Double-Blind Review Setup (Anonymity)**
```typescript
{
  id: 4,
  name: 'Double-Blind Review Setup',
  category: 'anonymity',
  type: 'semantic',
  
  extractContent(udo) {
    // First 1500 chars to check for identifying info
    return udo.rawText.substring(0, 1500);
  },
  
  buildPrompt(content, guideline, examples) {
    return `
You are checking if a manuscript is properly anonymized for double-blind review.

GUIDELINE:
${guideline}

MANUSCRIPT EXCERPT (first 1500 characters):
${content}

STEP-BY-STEP ANALYSIS:

Step 1: Check for author names
- Do you see personal names like "John Smith", "Dr. Johnson"?
- List any names found: ___

Step 2: Check for institutional references
- Do you see specific universities, hospitals, or affiliations?
- List any: ___

Step 3: Check for self-references
- Do you see phrases like "our previous work", "our group"?
- Do you see "we previously showed"?

Step 4: Check for location identifiers
- Are there specific cities or countries tied to research?
- Example: "patients from [Hospital] in [City]"

Step 5: Check for unique identifiers
- Grant numbers with PI names?
- Funding sources that identify authors?

FINAL DECISION:
Is the manuscript properly anonymized?

Respond ONLY with this JSON:
{
  "status": "PASS" or "FAIL",
  "has_identifying_info": true/false,
  "identified_issues": ["list of issues"],
  "explanation": "Clear explanation",
  "confidence": <0.7-1.0>,
  "suggestion": "What to anonymize (if FAIL)"
}
`;
  }
}
```

### **Implementation Task: Semantic Validator**
```typescript
// validators/semantic-validator.ts

import { Anthropic } from '@anthropic-ai/sdk';
import { SEMANTIC_RULES } from './semantic-rules';
import { JOURNALS } from '../config/journals';

const llm = new Anthropic(); // Or OpenRouter client

export async function runSemanticValidation(
  udo: UDO,
  journalId: string
): Promise<SemanticRuleResult[]> {
  
  const journal = JOURNALS[journalId];
  const results: SemanticRuleResult[] = [];
  
  for (const rule of SEMANTIC_RULES) {
    try {
      // Extract content specific to this rule
      const content = rule.extractContent(udo);
      
      // Get guideline from journal config
      const guideline = journal.semanticGuidelines[rule.name.toLowerCase()];
      if (!guideline) {
        results.push({
          ruleId: rule.id,
          status: 'SKIP',
          confidence: 0,
          message: `No guideline found for ${rule.name}`
        });
        continue;
      }
      
      // Build prompt
      const prompt = rule.buildPrompt(content, guideline.guideline, guideline.examples);
      
      // Call LLM
      const response = await llm.messages.create({
        model: 'claude-3-5-sonnet-20241022',  // Or gemini-2.0-flash
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });
      
      // Parse response
      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(text);
      
      results.push({
        ruleId: rule.id,
        status: parsed.status,
        confidence: parsed.confidence || 0.8,
        message: parsed.explanation,
        suggestion: parsed.suggestion,
        reasoning: {
          step1: parsed.step1,
          step2: parsed.step2,
          step3: parsed.step3,
          step4: parsed.step4
        }
      });
      
    } catch (error) {
      results.push({
        ruleId: rule.id,
        status: 'SKIP',
        confidence: 0,
        message: `Error: ${error.message}`
      });
    }
  }
  
  return results;
}
```

---

## **📊 PART 5: RESULT AGGREGATION & REPORTING**

### **Combined Results**
```typescript
interface ValidationReport {
  manuscriptName: string
  journalId: string
  journalName: string
  timestamp: Date
  
  summary: {
    totalRules: 55
    passedRules: number
    failedRules: number
    skippedRules: number
    overallAccuracy: number        // % of passed / (passed + failed)
    programmaticAccuracy: number   // % for 40 rules only
    semanticAccuracy: number       // % for 15 rules only
  }
  
  results: {
    programmatic: RuleResult[]     // 40 results
    semantic: SemanticRuleResult[] // 15 results
  }
  
  resultsByCategory: Record<string, RuleResult[]>
  
  criticalErrors: RuleResult[]     // FAIL with high confidence
  warnings: RuleResult[]           // WARNING status
  
  suggestions: string[]            // Aggregated fix suggestions
}
```

### **Aggregation Logic**
```typescript
export function aggregateResults(
  programmaticResults: RuleResult[],
  semanticResults: SemanticRuleResult[],
  manuscriptName: string,
  journalId: string,
  journalName: string
): ValidationReport {
  
  const allResults = [...programmaticResults, ...semanticResults];
  
  // Count results
  const passed = allResults.filter(r => r.status === 'PASS').length;
  const failed = allResults.filter(r => r.status === 'FAIL').length;
  const skipped = allResults.filter(r => r.status === 'SKIP').length;
  
  // Calculate accuracies
  const overallAccuracy = passed / (passed + failed) * 100;
  const programmaticAccuracy = programmaticResults.filter(r => r.status === 'PASS').length / 
                                (programmaticResults.length - programmaticResults.filter(r => r.status === 'SKIP').length) * 100;
  const semanticAccuracy = semanticResults.filter(r => r.status === 'PASS').length / 
                            (semanticResults.length - semanticResults.filter(r => r.status === 'SKIP').length) * 100;
  
  // Group by category
  const byCategory: Record<string, RuleResult[]> = {};
  for (const result of allResults) {
    const category = getRuleCategory(result.ruleId);
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push(result);
  }
  
  // Extract critical errors (FAIL with confidence > 0.8)
  const criticalErrors = allResults.filter(r => r.status === 'FAIL' && r.confidence >= 0.8);
  
  // Collect suggestions
  const suggestions = allResults
    .filter(r => r.status === 'FAIL' && r.suggestion)
    .map(r => `[${r.name}] ${r.suggestion}`);
  
  return {
    manuscriptName,
    journalId,
    journalName,
    timestamp: new Date(),
    summary: {
      totalRules: 55,
      passedRules: passed,
      failedRules: failed,
      skippedRules: skipped,
      overallAccuracy,
      programmaticAccuracy,
      semanticAccuracy
    },
    results: {
      programmatic: programmaticResults,
      semantic: semanticResults
    },
    resultsByCategory: byCategory,
    criticalErrors,
    suggestions
  };
}
```

---

## **🚀 PART 6: COMPLETE VALIDATION PIPELINE**

### **Main Entry Point**
```typescript
// index.ts - THE MAIN FUNCTION

export async function validateManuscript(
  file: ArrayBuffer,
  fileName: string,
  journalId: string
): Promise<ValidationReport> {
  
  console.time('Total Validation Time');
  
  // STEP 1: Parse document
  console.time('Parsing');
  const udo = await parseDocumentToUDO(file);
  console.timeEnd('Parsing');
  
  // STEP 2: Programmatic validation (instant)
  console.time('Programmatic Validation');
  const programmaticResults = await runProgrammaticValidation(udo);
  console.timeEnd('Programmatic Validation');
  
  // STEP 3: Semantic validation (LLM calls)
  console.time('Semantic Validation');
  const semanticResults = await runSemanticValidation(udo, journalId);
  console.timeEnd('Semantic Validation');
  
  // STEP 4: Aggregate results
  const journal = JOURNALS[journalId];
  const report = aggregateResults(
    programmaticResults,
    semanticResults,
    fileName,
    journalId,
    journal.name
  );
  
  console.timeEnd('Total Validation Time');
  
  return report;
}
```

### **Expected Performance**
- Parsing: 200-300ms
- Programmatic validation: <100ms
- Semantic validation: 45-60 seconds (15 LLM calls @ 3-4 sec each)
- **Total: <90 seconds per manuscript**
- **Cost: $0.05-0.08 per manuscript (with Gemini 1.5 Flash)**
- **Accuracy: 90%+**

---

## **📋 PART 7: IMPLEMENTATION CHECKLIST**

### **Phase 1: Setup (1 day)**
- [ ] Set up project dependencies (JSZip, mammoth.js, xml2js)
- [ ] Set up LLM client (OpenRouter or direct Gemini API)
- [ ] Set up journal config structure
- [ ] Create TypeScript interfaces (UDO, Rule, Result, etc.)

### **Phase 2: Parsing (2 days)**
- [ ] Implement dual extraction (JSZip + mammoth.js)
- [ ] Build UDO structure
- [ ] Implement entity extraction functions (10+ functions)
- [ ] Test parsing on V1-V10 manuscripts

### **Phase 3: Programmatic Rules (3 days)**
- [ ] Implement all 40 programmatic rules
- [ ] Test each rule individually
- [ ] Create comprehensive test suite for programmatic rules
- [ ] Achieve 100% accuracy on programmatic rules

### **Phase 4: Semantic Rules (3 days)**
- [ ] Build 15 semantic rule prompts with CoT
- [ ] Test each prompt on sample content
- [ ] Create journal configs with guidelines + examples
- [ ] Test on V1-V10 manuscripts
- [ ] Target: 85%+ accuracy on semantic rules

### **Phase 5: Integration (2 days)**
- [ ] Integrate all layers into single pipeline
- [ ] Add result aggregation
- [ ] Create validation report generator
- [ ] Test end-to-end on V1-V10 manuscripts

### **Phase 6: Optimization (2 days)**
- [ ] Performance profiling
- [ ] Caching for repeated content
- [ ] Parallel processing where possible
- [ ] Error handling & edge cases

---

## **🎯 SUCCESS METRICS (End of Sprint 5)**

### **Accuracy Targets**
- ✅ Programmatic rules: 100% accuracy (no false positives/negatives)
- ✅ Semantic rules: 85%+ accuracy
- ✅ **Overall: 90%+ accuracy across all 55 rules**

### **Technical Targets**
- ✅ Analysis time: <2 minutes per manuscript
- ✅ Cost: <$0.10 per manuscript
- ✅ Parsing reliability: 100% (no crashes)
- ✅ LLM JSON reliability: 95%+ valid responses

### **Quality Targets**
- ✅ All 55 rules implemented and working
- ✅ Error messages clear and actionable
- ✅ Suggestions helpful for fixing issues
- ✅ No critical bugs blocking user testing

---

## **⚠️ CRITICAL NOTES**

### **DO NOT**
- ❌ Don't implement auto-fix capability yet (Phase 7)
- ❌ Don't use RAG - load rules from config files instead
- ❌ Don't convert DOCX to PDF - use direct parsing
- ❌ Don't chunk content - pass relevant sections whole
- ❌ Don't create your own LLM - use Gemini Flash or Claude

### **DO**
- ✅ Focus ONLY on accuracy (not auto-fix)
- ✅ Test extensively on V1-V10 manuscripts
- ✅ Use Chain-of-Thought for all semantic rules
- ✅ Include few-shot examples in semantic prompts
- ✅ Log all LLM responses for debugging

---

**This is your complete blueprint. Your agent has all the context needed to build the system precisely. No RAG, no auto-fix, no unnecessary complexity. Just clean, focused, accurate error detection.** 🚀

