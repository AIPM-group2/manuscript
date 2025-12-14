/**
 * Deterministic Validators - XML-based checks (no AI required)
 * These checks parse DOCX XML directly for higher accuracy and lower cost
 */

import type { RuleResult } from "../types/rules";

// Type for deterministic check results
export interface DeterministicResult {
    rule: string;
    decision: boolean;
    justification: string;
    confidence: number;
}

/**
 * Check Font Style and Size (Guideline 2)
 * Only checks BODY TEXT (Normal paragraphs), not headings, titles, footnotes
 */
export function checkFontStyleAndSize(
    documentXml: string,
    stylesXml: string
): DeterministicResult {
    const READABLE_FONTS = ["Times New Roman", "Arial", "Helvetica", "Calibri", "Verdana"];
    const MIN_SIZE_HALF_POINTS = 20; // 10pt * 2

    // Match font specifications in XML
    const fontMatches = documentXml.match(/<w:rFonts[^>]*w:ascii="([^"]+)"/g) || [];
    const sizeMatches = documentXml.match(/<w:sz\s+w:val="(\d+)"/g) || [];

    const violations: string[] = [];

    // Check fonts
    fontMatches.forEach(match => {
        const fontName = match.match(/w:ascii="([^"]+)"/)?.[1];
        if (fontName && !READABLE_FONTS.some(f => fontName.toLowerCase().includes(f.toLowerCase()))) {
            violations.push(`Non-standard font: ${fontName}`);
        }
    });

    // Check sizes
    sizeMatches.forEach(match => {
        const sizeVal = parseInt(match.match(/w:val="(\d+)"/)?.[1] || "0");
        if (sizeVal > 0 && sizeVal < MIN_SIZE_HALF_POINTS) {
            violations.push(`Font size ${sizeVal / 2}pt < 10pt minimum`);
        }
    });

    const uniqueViolations = [...new Set(violations)].slice(0, 5);

    if (uniqueViolations.length > 0) {
        return {
            rule: "Font Style and Size",
            decision: false,
            justification: `Body text violations: ${uniqueViolations.join("; ")}`,
            confidence: 0.95
        };
    }

    return {
        rule: "Font Style and Size",
        decision: true,
        justification: "All body text uses readable fonts (Times New Roman, Arial, etc.) at ≥10pt.",
        confidence: 0.95
    };
}

/**
 * Check Page Numbering (Guideline 4)
 * Detects automatic PAGE field in headers/footers
 */
export function checkPageNumbering(headerFooterXmls: string[]): DeterministicResult {
    for (const xml of headerFooterXmls) {
        if (!xml) continue;

        // Look for PAGE field instruction
        if (xml.includes("PAGE") && (xml.includes("<w:instrText") || xml.includes("<w:fldSimple"))) {
            return {
                rule: "Page Numbering",
                decision: true,
                justification: "Automatic page numbering (PAGE field) detected in header/footer.",
                confidence: 1.0
            };
        }
    }

    return {
        rule: "Page Numbering",
        decision: false,
        justification: "Automatic page numbering not found. Page numbers may be missing or manually added.",
        confidence: 0.9
    };
}

/**
 * Check Field Functions (Guideline 5)
 * Flags the presence of field functions (linked fields, auto-text)
 */
export function checkFieldFunctions(documentXml: string): DeterministicResult {
    // Count field elements
    const fldSimpleCount = (documentXml.match(/<w:fldSimple/g) || []).length;
    const instrTextCount = (documentXml.match(/<w:instrText/g) || []).length;

    // PAGE fields are acceptable (for page numbering)
    const pageFieldCount = (documentXml.match(/PAGE/gi) || []).length;
    const nonPageFields = fldSimpleCount + instrTextCount - pageFieldCount;

    if (nonPageFields > 0) {
        return {
            rule: "Field Functions",
            decision: false,
            justification: `Document contains ${nonPageFields} field function(s) other than page numbering. These should be removed.`,
            confidence: 1.0
        };
    }

    return {
        rule: "Field Functions",
        decision: true,
        justification: "No problematic field functions detected.",
        confidence: 1.0
    };
}

/**
 * Check Line Spacing (Guideline 10)
 * Verifies double-spacing in body text
 */
export function checkLineSpacing(documentXml: string): DeterministicResult {
    // Look for spacing elements
    const spacingMatches = documentXml.match(/<w:spacing[^>]*w:line="(\d+)"/g) || [];

    let nonDoubleSpacedCount = 0;
    const DOUBLE_SPACING_MIN = 400; // Approximately 480 is double, allow some tolerance

    spacingMatches.forEach(match => {
        const lineVal = parseInt(match.match(/w:line="(\d+)"/)?.[1] || "0");
        if (lineVal > 0 && lineVal < DOUBLE_SPACING_MIN) {
            nonDoubleSpacedCount++;
        }
    });

    if (nonDoubleSpacedCount > 3) { // Allow some tolerance for headings, etc.
        return {
            rule: "Line Spacing",
            decision: false,
            justification: `Found ${nonDoubleSpacedCount} paragraphs with single or 1.5 line spacing. Document should be double-spaced.`,
            confidence: 0.85
        };
    }

    return {
        rule: "Line Spacing",
        decision: true,
        justification: "Document appears to use double-spacing for body text.",
        confidence: 0.85
    };
}

/**
 * Check Indentation Method (Guideline 6)
 * Flags paragraphs using spaces instead of tabs/indentation
 */
export function checkIndentationMethod(documentXml: string): DeterministicResult {
    // Look for text nodes starting with multiple spaces
    const textMatches = documentXml.match(/<w:t[^>]*>(\s{3,})/g) || [];

    if (textMatches.length > 2) {
        return {
            rule: "Indentation Method",
            decision: false,
            justification: `Found ${textMatches.length} instances of space-based indentation. Use paragraph indentation or tab stops instead.`,
            confidence: 0.8
        };
    }

    return {
        rule: "Indentation Method",
        decision: true,
        justification: "No obvious space-based indentation detected.",
        confidence: 0.8
    };
}

/**
 * Run all deterministic checks on DOCX XML
 * @returns Array of DeterministicResults
 */
export async function runDeterministicChecks(
    xmlFiles: Record<string, string>
): Promise<DeterministicResult[]> {
    const results: DeterministicResult[] = [];

    const documentXml = xmlFiles["word/document.xml"] || "";
    const stylesXml = xmlFiles["word/styles.xml"] || "";

    // Collect header/footer XMLs
    const headerFooterXmls = Object.entries(xmlFiles)
        .filter(([name]) => name.startsWith("word/header") || name.startsWith("word/footer"))
        .map(([, content]) => content);

    if (documentXml) {
        results.push(checkFontStyleAndSize(documentXml, stylesXml));
        results.push(checkFieldFunctions(documentXml));
        results.push(checkLineSpacing(documentXml));
        results.push(checkIndentationMethod(documentXml));
    }

    if (headerFooterXmls.length > 0) {
        results.push(checkPageNumbering(headerFooterXmls));
    }

    return results;
}

/**
 * Convert DeterministicResult to RuleResult format
 */
export function toRuleResult(deterministicResult: DeterministicResult, ruleId: number): RuleResult {
    return {
        ruleId,
        name: deterministicResult.rule,
        category: "formatting",
        status: deterministicResult.decision ? "PASS" : "FAIL",
        confidence: deterministicResult.confidence,
        message: deterministicResult.justification,
        autoFixable: false, // Deterministic issues usually require manual fix
        location: {
            section: "document",
            severity: deterministicResult.decision ? "info" : "warning"
        }
    };
}
