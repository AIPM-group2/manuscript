import type { SemanticRule, Examples } from "../types/rules";
import type { UDO } from "../types/udo";

// Helper to build consistent CoT prompts
function buildBasePrompt(
    role: string,
    guideline: string,
    content: string,
    examples: Examples,
    steps: string,
    jsonStructure: string
): string {
    return `
Role: ${role}

GUIDELINE:
${guideline}

EXAMPLES OF GOOD COMPLIANCE:
${examples.good.map((e) => `✅ ${e}`).join("\n")}

EXAMPLES OF BAD COMPLIANCE:
${examples.bad.map((e) => `❌ ${e}`).join("\n")}

CONTENT TO EVALUATE:
"""
${content}
"""

STEP-BY-STEP ANALYSIS:
${steps}

FINAL DECISION:
Based on the analysis, determine if the content complies with the guideline.

JSON OUTPUT FORMAT:
You must output a SINGLE valid JSON object. Do not include markdown formatting or explanations outside the JSON.
MANDATORY: In your "explanation" and "reasoning", you MUST quote the specific text snippet that caused the violation. Provide concrete proof.
${jsonStructure}
`.trim();
}

export const SEMANTIC_RULES: SemanticRule[] = [
    // ----------------------------------------------------------------------
    // 1. Title Content
    // ----------------------------------------------------------------------
    {
        id: 1,
        name: "Title Content",
        category: "semantic",
        type: "semantic",
        description: "Check if title is concise and informative",
        autoFixable: false, // UNSAFE: Rewriting
        extractContent: (udo: UDO) => udo.content.title,
        buildPrompt: (content, guideline, examples) =>
            buildBasePrompt(
                "Manuscript Editor",
                guideline,
                content,
                examples,
                `
1. Analyze word count (target 10-15 words).
2. Evaluate specificity: Does it clearly state the subject/finding?
3. Check for vague phrases like "A study of" or "Observations on".
4. Check for abbreviations (should generally be avoided unless standard).`,
                `{
  "status": "PASS" | "FAIL",
  "confidence": number (0.0-1.0),
  "explanation": "concise explanation",
  "suggestion": "string" (optional),
  "reasoning": {
    "step1": "word count analysis",
    "step2": "specificity check",
    "step3": "vague phrase check",
    "step4": "abbreviation check"
  }
}`
            ),
    },

    // ----------------------------------------------------------------------
    // 2. Declarations (Title Page)
    // ----------------------------------------------------------------------
    {
        id: 2,
        name: "Declarations (Title Page)",
        category: "semantic",
        type: "semantic",
        description: "Check for competing interests and funding declarations",
        autoFixable: true, // SAFE: Structural addition
        extractContent: (udo: UDO) => {
            // Extract first 1-2 pages or specific sections looking for "Declaration", "Conflict", "Funding"
            const declarationKeywords = ["conflict of interest", "competing interest", "funding", "acknowledgments", "declaration"];
            // Simple heuristic: Search usually appears near end or beginning. 
            // For title page rules specifically, we should look at the beginning.
            return udo.rawText.substring(0, 3000);
        },
        buildPrompt: (content, guideline, examples) =>
            buildBasePrompt(
                "Ethics Compliance Officer",
                guideline,
                content,
                examples,
                `
1. Search for "Competing Interests" or "Conflict of Interest" statements.
2. Search for "Funding" support statements.
3. Verify if they are placed on what appears to be the title page (start of doc).
4. Determine if the statements are explicit (e.g., "No competing interests").`,
                `{
  "status": "PASS" | "FAIL", 
  "confidence": number,
  "explanation": "string",
  "reasoning": {
    "step1": "competing interests check",
    "step2": "funding check", 
    "step3": "placement check"
  }
}`
            ),
    },

    // ----------------------------------------------------------------------
    // 3. Acknowledgments Placement
    // ----------------------------------------------------------------------
    {
        id: 3,
        name: "Acknowledgments Placement",
        category: "semantic",
        type: "semantic",
        description: "Ensure acknowledgments are only on title page",
        autoFixable: true, // SAFE: Structural move
        extractContent: (udo: UDO) => {
            // We need to look at the whole text to find *where* it appears
            // But sending whole text is expensive. 
            // Strategy: Send beginning (title page) and end (discussion/back matter)
            const start = udo.rawText.substring(0, 2000);
            const end = udo.rawText.substring(udo.rawText.length - 2000);
            return `--- START OF DOCUMENT ---\n${start}\n\n--- END OF DOCUMENT ---\n${end}`;
        },
        buildPrompt: (content, guideline, examples) =>
            buildBasePrompt(
                "Format Checker",
                guideline,
                content,
                examples,
                `
1. Locate "Acknowledgments" section.
2. Determine if it is at the START (Title Page) or END (Manuscript body) or both.
3. Guideline strictly requires it ONLY on the Title Page.
4. If found at the end/body, it is a FAIL.`,
                `{
  "status": "PASS" | "FAIL",
  "confidence": number,
  "explanation": "string",
  "reasoning": { "location_found": "string" }
}`
            ),
    },

    // ----------------------------------------------------------------------
    // 4. Double-Blind Review Setup
    // ----------------------------------------------------------------------
    {
        id: 4,
        name: "Double-Blind Review Setup",
        category: "semantic",
        type: "semantic",
        description: "Check for identifying information",
        autoFixable: false, // UNSAFE: Redaction risks
        extractContent: (udo: UDO) => udo.rawText.substring(0, 5000), // Check first sizable chunk
        buildPrompt: (content, guideline, examples) =>
            buildBasePrompt(
                "Blind Review Auditor",
                guideline,
                content,
                examples,
                `
1. Scan for specific author names (e.g., "Smith et al.").
2. Scan for affiliations (Universities, Hospitals).
3. Check for self-identifying phrases like "our previous study [1]" where [1] is the author.
4. Check for grant numbers or ethical approval numbers that trace back to authors.`,
                `{
  "status": "PASS" | "FAIL",
  "confidence": number,
  "explanation": "string",
  "suggestion": "Anonymize these specific items...",
  "reasoning": {
    "step1": "names check",
    "step2": "affiliations check",
    "step3": "self-citations check"
  }
}`
            ),
    },

    // ----------------------------------------------------------------------
    // 5. Keywords Quality
    // ----------------------------------------------------------------------
    {
        id: 5,
        name: "Keywords Quality",
        category: "semantic",
        type: "semantic",
        description: "Check content of keywords",
        autoFixable: false, // UNSAFE: Content generation
        extractContent: (udo: UDO) => udo.content.keywords.join(", "),
        buildPrompt: (content, guideline, examples) =>
            buildBasePrompt(
                "Index Specialist",
                guideline,
                content,
                examples,
                `
1. Count the keywords (target 4-6).
2. Evaluate if terms are suitable MeSH (Medical Subject Headings) terms.
3. Check if they are too generic (e.g., "Disease") or too specific/non-standard.
4. Verify they represent the main topics of a likely paper.`,
                `{
  "status": "PASS" | "FAIL",
  "confidence": number,
  "explanation": "string",
  "reasoning": {
    "step1": "count check",
    "step2": "MeSH suitability check"
  }
}`
            ),
    },

    // ----------------------------------------------------------------------
    // 6. Manuscript Structure
    // ----------------------------------------------------------------------
    {
        id: 6,
        name: "Manuscript Structure",
        category: "semantic",
        type: "semantic",
        description: "Check for IMRAD structure",
        autoFixable: true, // SAFE: Structural
        extractContent: (udo: UDO) => udo.content.sections.map(s => s.heading).join("\n"),
        buildPrompt: (content, guideline, examples) =>
            buildBasePrompt(
                "Structure Validator",
                guideline,
                content,
                examples,
                `
1. Identify standard sections: Introduction, Methods, Results, Discussion.
2. Check the order of these sections.
3. Identify missing required sections.
4. Check for correct labeling (e.g. "Materials and Methods" vs just "Methods" - usually both ok, but "Technique" might not be).`,
                `{
  "status": "PASS" | "FAIL",
  "confidence": number,
  "explanation": "string",
  "reasoning": {
    "step1": "sections present",
    "step2": "order check"
  }
}`
            ),
    },

    // ----------------------------------------------------------------------
    // 7. Abbreviations Consistency
    // ----------------------------------------------------------------------
    {
        id: 7,
        name: "Abbreviations Consistency",
        category: "semantic",
        type: "semantic",
        description: "Check abbreviation definitions",
        autoFixable: true, // SAFE: Formatting/Definition
        extractContent: (udo: UDO) => {
            // Send a sample of text containing potential abbreviations
            // This is hard to extract perfectly without a full scan.
            // For prototype, we send the Abstract and first 1000 words of Intro.
            return `ABSTRACT:\n${udo.content.abstract}\n\nINTRODUCTION:\n${udo.rawText.substring(udo.content.abstract.length, udo.content.abstract.length + 2000)}`;
        },
        buildPrompt: (content, guideline, examples) =>
            buildBasePrompt(
                "Copy Editor",
                guideline,
                content,
                examples,
                `
1. Identify abbreviations used (e.g., MRI, CT, ANOVA).
2. Check if text explicitly defines them on first use like "Magnetic Resonance Imaging (MRI)".
3. Flag any abbreviations used without definition.
4. Flag inconsistent usage (defining twice, or using full term after abbreviation established).`,
                `{
  "status": "PASS" | "FAIL",
  "confidence": number,
  "explanation": "string",
  "details": { "undefined_abbreviations": [] },
  "reasoning": { "step1": "scan results" }
}`
            ),
    },

    // ----------------------------------------------------------------------
    // 8. Figure Caption Content
    // ----------------------------------------------------------------------
    {
        id: 8,
        name: "Figure Caption Content",
        category: "semantic",
        type: "semantic",
        description: "Check figure caption quality",
        autoFixable: false, // UNSAFE: Content rewriting
        extractContent: (udo: UDO) => udo.entities.figures.map(f => f.caption).join("\n"),
        buildPrompt: (content, guideline, examples) =>
            buildBasePrompt(
                "Figure Editor",
                guideline,
                content,
                examples,
                `
1. Check if captions start with "Fig." or "Figure" and number.
2. Check if captions are descriptive (explain what is shown).
3. Verify if abbreviations/symbols in the caption are likely explained (heuristic).
4. Check for bolding format requirement if specified in guideline.`,
                `{
  "status": "PASS" | "FAIL",
  "confidence": number,
  "explanation": "string",
  "reasoning": { "step1": "format check", "step2": "descriptive check" }
}`
            ),
    },

    // ----------------------------------------------------------------------
    // 9. Table Caption/Title
    // ----------------------------------------------------------------------
    {
        id: 9,
        name: "Table Caption/Title",
        category: "semantic",
        type: "semantic",
        description: "Check table caption quality",
        autoFixable: false, // UNSAFE: Content rewriting
        extractContent: (udo: UDO) => udo.entities.tables.map(t => t.caption).join("\n"),
        buildPrompt: (content, guideline, examples) =>
            buildBasePrompt(
                "Table Editor",
                guideline,
                content,
                examples,
                `
1. Check placement (Title should be above table - user cannot verify placement from text but can verify title existence/content).
2. Verify "Table X" format.
3. Check if title is brief and descriptive.`,
                `{
  "status": "PASS" | "FAIL",
  "confidence": number,
  "explanation": "string",
  "reasoning": { "step1": "format check", "step2": "quality check" }
}`
            ),
    },

    // ----------------------------------------------------------------------
    // 10. Table Prior Publication
    // ----------------------------------------------------------------------
    {
        id: 10,
        name: "Table Prior Publication",
        category: "semantic",
        type: "semantic",
        description: "Check adaptation acknowledgement",
        autoFixable: true, // SAFE: Reference addition
        extractContent: (udo: UDO) => udo.entities.tables.map(t => t.caption).join("\n"),
        buildPrompt: (content, guideline, examples) =>
            buildBasePrompt(
                "Copyright Checker",
                guideline,
                content,
                examples,
                `
1. Look for phrases like "Adapted from...", "Reprinted from...", "Data from...".
2. If these phrases exist, verify a citation follows [X].
3. (This rule assumes reuse - if no reuse, it passes, so be careful not to fail valid original tables. Fail only if it looks copied but uncited).`,
                `{
  "status": "PASS" | "FAIL",
  "confidence": number,
  "explanation": "string",
  "reasoning": { "step1": "reuse_phrase_check" }
}`
            ),
    },

    // ----------------------------------------------------------------------
    // 11. Supplementary Captions
    // ----------------------------------------------------------------------
    {
        id: 11,
        name: "Supplementary Captions",
        category: "semantic",
        type: "semantic",
        description: "Check supplementary material descriptions",
        autoFixable: false, // UNSAFE: Content drafting
        extractContent: (udo: UDO) => udo.rawText.substring(udo.rawText.length - 3000), // Check end of doc
        buildPrompt: (content, guideline, examples) =>
            buildBasePrompt(
                "Editor",
                guideline,
                content,
                examples,
                `
1. Search for "Supplementary Material", "Online Resource", "Electronic Supplementary Material".
2. If found, check if each item has a caption/description.
3. Verify specific naming format (e.g., "Online Resource 1").`,
                `{
  "status": "PASS" | "FAIL",
  "confidence": number,
  "explanation": "string",
  "reasoning": { "step1": "find_section", "step2": "check_captions" }
}`
            ),
    },

    // ----------------------------------------------------------------------
    // 12. Abstract Length and Content
    // ----------------------------------------------------------------------
    {
        id: 12,
        name: "Abstract Length and Content",
        category: "semantic",
        type: "semantic",
        description: "Analyze abstract text",
        autoFixable: false, // UNSAFE: Summarization/Rewriting
        extractContent: (udo: UDO) => udo.content.abstract,
        buildPrompt: (content, guideline, examples) =>
            buildBasePrompt(
                "Abstract Analyst",
                guideline,
                content,
                examples,
                `
1. Count words (programmatic check confirmation).
2. Check for undefined abbreviations (critical).
3. Verify it contains essential info (Background, Methods, Results, Conclusion) even if unstructured.
4. Ensure no citations (usually not allowed in abstract).`,
                `{
  "status": "PASS" | "FAIL",
  "confidence": number,
  "explanation": "string",
  "reasoning": { "step1": "abbreviation_check", "step2": "content_check" }
}`
            ),
    },

    // ----------------------------------------------------------------------
    // 13. Abstract Structure Style
    // ----------------------------------------------------------------------
    {
        id: 13,
        name: "Abstract Structure Style",
        category: "semantic",
        type: "semantic",
        description: "Check for structured headings",
        autoFixable: true, // SAFE: Insert structure/headings
        extractContent: (udo: UDO) => udo.content.abstract,
        buildPrompt: (content, guideline, examples) =>
            buildBasePrompt(
                "Style Checker",
                guideline,
                content,
                examples,
                `
1. Look for explicit internal headings: "Background:", "Methods:", "Results:", "Conclusion:".
2. If protocol requires "Structured Abstract", these must be present.
3. If protocol allows unstructured, this rule might pass with "N/A" or "Pass".
(Assume Structured required for this check unless specified).`,
                `{
  "status": "PASS" | "FAIL",
  "confidence": number,
  "explanation": "string",
  "reasoning": { "step1": "headings_check" }
}`
            ),
    },

    // ----------------------------------------------------------------------
    // 14. Clinical Trial Registration
    // ----------------------------------------------------------------------
    {
        id: 14,
        name: "Clinical Trial Registration",
        category: "semantic",
        type: "semantic",
        description: "Check for trial registration",
        autoFixable: true, // SAFE: Formatting metadata
        extractContent: (udo: UDO) => udo.content.abstract + "\n" + udo.content.title + "\n" + udo.content.sections.find(s => s.heading.includes("Methods"))?.content.substring(0, 1000),
        buildPrompt: (content, guideline, examples) =>
            buildBasePrompt(
                "Compliance Checker",
                guideline,
                content,
                examples,
                `
1. Determine if this is a clinical trial (Does it mention patients, randomization, intervention?).
2. If YES, it MUST have a registration number (NCTxxxx, EudraCT, etc.).
3. If not a trial, outcome is PASS (Not Applicable).`,
                `{
  "status": "PASS" | "FAIL",
  "confidence": number,
  "explanation": "string",
  "reasoning": { "step1": "is_clinical_trial", "step2": "has_registration" }
}`
            ),
    },

    // ----------------------------------------------------------------------
    // 15. References Journal Abbreviations
    // ----------------------------------------------------------------------
    {
        id: 15,
        name: "References Journal Abbreviations",
        category: "semantic",
        type: "semantic",
        description: "Check ISSN abbreviations",
        autoFixable: true, // SAFE: Formatting
        extractContent: (udo: UDO) => udo.entities.references.slice(0, 10).map(r => r.text).join("\n"), // Check first 10 references
        buildPrompt: (content, guideline, examples) =>
            buildBasePrompt(
                "Reference Editor",
                guideline,
                content,
                examples,
                `
1. Extract journal names from the references.
2. Check if they use standard abbreviations (e.g., "J. Biol. Chem." vs "Journal of Biological Chemistry").
3. Flag full journal titles if abbreviations are required.`,
                `{
  "status": "PASS" | "FAIL",
  "confidence": number,
  "explanation": "string",
  "reasoning": { "step1": "extract_names", "step2": "check_abbreviation" }
}`
            ),
    },
];
