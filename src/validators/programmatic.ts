/**
 * Programmatic Validator - 40 rules that don't require AI
 * All validation is done via regex, counting, and structure analysis
 */

import type { UDO } from "../types/udo";
import type { RuleResult } from "../types/rules";
import { JOURNALS } from "../config/journals";

// =============================================================================
// RULE DEFINITIONS
// =============================================================================

interface ProgrammaticRule {
    id: number;
    name: string;
    category: "pattern" | "measurement" | "presence" | "structure";
    description: string;
    autoFixable?: boolean; // Defaults to false
    validate: (udo: UDO, config: any) => RuleResult;
}

// =============================================================================
// PATTERN MATCHING RULES (12 rules)
// =============================================================================

const patternRules: ProgrammaticRule[] = [
    {
        id: 101,
        name: "Citation Format",
        category: "pattern",
        description: "Citations must use numbered format [1], [2-4], [1,3,5]",
        autoFixable: true, // SAFE: Formatting
        validate: (udo, config) => {
            const text = udo.rawText;
            // Find all citation patterns
            const numberedCitations = text.match(/\[\d+(?:[-,]\s*\d+)*\]/g) || [];
            const authorYearCitations = text.match(/\([A-Z][a-z]+(?:\set\sal\.?)?\s*\d{4}\)/g) || [];

            const isNumbered = config.structure?.citationFormat === "numbered";

            if (isNumbered && authorYearCitations.length > 0) {
                return {
                    ruleId: 101, name: "Citation Format", category: "pattern",
                    status: "FAIL", confidence: 1.0,
                    message: `Found ${authorYearCitations.length} author-year citations. Journal requires numbered format [1].`,
                    suggestion: "Convert all author-year citations to numbered format.",
                    snippet: authorYearCitations[0], // First problematic citation
                    location: {
                        section: "references",
                        text: authorYearCitations[0],
                        severity: "critical"
                    },
                    details: { instruction: "Citations must use numbered format [1], [2-4], [1,3,5]" },
                    autoFixable: true
                };
            }

            if (numberedCitations.length === 0 && text.length > 1000) {
                return {
                    ruleId: 101, name: "Citation Format", category: "pattern",
                    status: "WARNING", confidence: 0.8,
                    message: "No numbered citations found in document.",
                    location: {
                        section: "references",
                        severity: "warning"
                    },
                    details: { instruction: "Citations must use numbered format [1], [2-4], [1,3,5]" },
                    autoFixable: true
                };
            }

            return {
                ruleId: 101, name: "Citation Format", category: "pattern",
                status: "PASS", confidence: 1.0,
                message: `Found ${numberedCitations.length} properly formatted numbered citations.`,
                details: { instruction: "Citations must use numbered format [1], [2-4], [1,3,5]" }
            };
        }
    },
    {
        id: 102,
        name: "Figure Numbering",
        category: "pattern",
        description: "Figures must be numbered sequentially: Fig. 1, Fig. 2, Fig. 3",
        autoFixable: true, // SAFE: Renumbering
        validate: (udo, config) => {
            const figureNums = udo.entities.figures.map(f => parseInt(f.number)).filter(n => !isNaN(n));
            if (figureNums.length === 0) {
                return {
                    ruleId: 102, name: "Figure Numbering", category: "pattern",
                    status: "SKIP", confidence: 1.0,
                    message: "No figures found in document.",
                    details: { instruction: "Figures must be numbered sequentially: Fig. 1, Fig. 2, Fig. 3" }
                };
            }

            const sorted = [...figureNums].sort((a, b) => a - b);
            const expected = sorted.map((_, i) => i + 1);
            const isSequential = sorted.every((n, i) => n === expected[i]);

            // Find first problematic figure for highlighting
            const firstFigure = udo.entities.figures[0];
            const snippetText = firstFigure?.caption?.substring(0, 60) || `Fig. ${sorted[0]}`;

            return {
                ruleId: 102, name: "Figure Numbering", category: "pattern",
                status: isSequential ? "PASS" : "FAIL",
                confidence: 1.0,
                message: isSequential ? `${figureNums.length} figures numbered correctly.` : `Figures not numbered sequentially. Found: ${sorted.join(", ")}`,
                details: { instruction: "Figures must be numbered sequentially: Fig. 1, Fig. 2, Fig. 3" },
                autoFixable: true,
                snippet: isSequential ? undefined : snippetText,
                location: isSequential ? undefined : {
                    section: "figures",
                    text: `Fig. ${sorted[0]}`,
                    severity: "critical" as const
                }
            };
        }
    },
    {
        id: 103,
        name: "Table Numbering",
        category: "pattern",
        description: "Tables must be numbered sequentially: Table 1, Table 2, Table 3",
        validate: (udo, config) => {
            const tableNums = udo.entities.tables.map(t => parseInt(t.number)).filter(n => !isNaN(n));
            if (tableNums.length === 0) {
                return {
                    ruleId: 103, name: "Table Numbering", category: "pattern",
                    status: "SKIP", confidence: 1.0,
                    message: "No tables found in document.",
                    details: { instruction: "Tables must be numbered sequentially: Table 1, Table 2, Table 3" }
                };
            }

            const sorted = [...tableNums].sort((a, b) => a - b);
            const expected = sorted.map((_, i) => i + 1);
            const isSequential = sorted.every((n, i) => n === expected[i]);

            // Find first table for highlighting
            const firstTable = udo.entities.tables[0];
            const snippetText = firstTable?.caption?.substring(0, 60) || `Table ${sorted[0]}`;

            return {
                ruleId: 103, name: "Table Numbering", category: "pattern",
                status: isSequential ? "PASS" : "FAIL",
                confidence: 1.0,
                message: isSequential ? `${tableNums.length} tables numbered correctly.` : `Tables not numbered sequentially. Found: ${sorted.join(", ")}`,
                suggestion: !isSequential ? `Renumber tables sequentially: Table 1, Table 2, Table 3, etc. Current numbering: ${sorted.join(", ")}` : undefined,
                autoFixable: !isSequential,
                details: { instruction: "Tables must be numbered sequentially: Table 1, Table 2, Table 3" },
                snippet: isSequential ? undefined : snippetText,
                location: isSequential ? undefined : {
                    section: "tables",
                    text: `Table ${sorted[0]}`,
                    severity: "critical" as const
                }
            };
        }
    },
    {
        id: 104,
        name: "Reference Numbering",
        category: "pattern",
        description: "References must be numbered sequentially: 1, 2, 3...",
        validate: (udo, config) => {
            // Filter out page numbers (typically > 100) to avoid false positives
            const refNums = udo.entities.references
                .map(r => parseInt(r.number))
                .filter(n => !isNaN(n) && n > 0 && n <= 100);  // Reasonable reference count limit

            if (refNums.length === 0) {
                // Fallback: count citations in text as proxy for reference count
                const citationCount = udo.entities.citations.length;
                return {
                    ruleId: 104, name: "Reference Numbering", category: "pattern",
                    status: citationCount > 0 ? "PASS" : "WARNING",
                    confidence: 0.7,
                    message: citationCount > 0
                        ? `Found ${citationCount} citations in text (reference list parsing limited).`
                        : "No numbered references found in the reference list.",
                    suggestion: citationCount === 0
                        ? "Add a numbered reference list (1. Author, Title..., 2. Author, Title..., etc.)"
                        : "Ensure references are numbered sequentially in the reference list.",
                    details: { instruction: "References must be numbered sequentially: 1, 2, 3..." }
                };
            }

            const sorted = [...new Set(refNums)].sort((a, b) => a - b);  // Remove duplicates
            const expected = sorted.map((_, i) => i + 1);
            const isSequential = sorted.every((n, i) => n === expected[i]);

            return {
                ruleId: 104, name: "Reference Numbering", category: "pattern",
                status: isSequential ? "PASS" : "WARNING",  // Downgrade to WARNING as parsing can be imperfect
                confidence: 0.85,
                message: isSequential ? `${sorted.length} references numbered correctly.` : `References may not be sequential. Found: ${sorted.join(", ")}`,
                suggestion: !isSequential ? `Renumber references sequentially starting from 1. Expected: 1, 2, 3... up to ${sorted.length}` : undefined,
                details: { instruction: "References must be numbered sequentially: 1, 2, 3..." }
            };
        }
    },
    {
        id: 105,
        name: "ORCID Format",
        category: "pattern",
        description: "ORCID must be in format XXXX-XXXX-XXXX-XXXX",
        validate: (udo, config) => {
            const orcidPattern = /\d{4}-\d{4}-\d{4}-\d{3}[\dX]/g;
            const orcids = udo.rawText.match(orcidPattern) || [];

            if (orcids.length === 0) {
                return {
                    ruleId: 105, name: "ORCID Format", category: "pattern",
                    status: "SKIP", confidence: 1.0,
                    message: "No ORCID identifiers found.",
                    details: { instruction: "ORCID must be in format XXXX-XXXX-XXXX-XXXX" }
                };
            }

            // All ORCIDs would pass if they match the regex
            return {
                ruleId: 105, name: "ORCID Format", category: "pattern",
                status: "PASS", confidence: 1.0,
                message: `Found ${orcids.length} valid ORCID identifier(s).`,
                details: { instruction: "ORCID must be in format XXXX-XXXX-XXXX-XXXX" }
            };
        }
    },
    {
        id: 106,
        name: "DOI Format",
        category: "pattern",
        description: "DOI must be in format https://doi.org/10.xxxx/xxxxx",
        validate: (udo, config) => {
            const doiPattern = /https?:\/\/doi\.org\/10\.\d{4,}\/[^\s]+/gi;
            const invalidDoiPattern = /https?:\/\/doi\.org\/(?!10\.\d)/gi;

            const validDois = udo.rawText.match(doiPattern) || [];
            const invalidDois = udo.rawText.match(invalidDoiPattern) || [];

            if (invalidDois.length > 0) {
                return {
                    ruleId: 106, name: "DOI Format", category: "pattern",
                    status: "FAIL", confidence: 1.0,
                    message: `Found ${invalidDois.length} invalid DOI format(s).`,
                    suggestion: "Ensure all DOIs follow the format https://doi.org/10.xxxx/xxxxx",
                    details: { instruction: "DOI must be in format https://doi.org/10.xxxx/xxxxx" }
                };
            }

            return {
                ruleId: 106, name: "DOI Format", category: "pattern",
                status: "PASS", confidence: 1.0,
                message: validDois.length > 0 ? `Found ${validDois.length} valid DOI(s).` : "No DOIs found (may be acceptable).",
                details: { instruction: "DOI must be in format https://doi.org/10.xxxx/xxxxx" }
            };
        }
    },
    {
        id: 107,
        name: "Email Format",
        category: "pattern",
        description: "Email addresses must be valid format",
        validate: (udo, config) => {
            const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const emails = udo.rawText.match(emailPattern) || [];

            // Check for obvious truncations
            const truncatedEmails = emails.filter(e => e.split("@")[1].split(".").some(p => p.length < 2));

            if (truncatedEmails.length > 0) {
                return {
                    ruleId: 107, name: "Email Format", category: "pattern",
                    status: "FAIL", confidence: 0.9,
                    message: `Found ${truncatedEmails.length} potentially invalid email(s).`,
                    details: { instruction: "Email addresses must be valid format" }
                };
            }

            return {
                ruleId: 107, name: "Email Format", category: "pattern",
                status: "PASS", confidence: 1.0,
                message: emails.length > 0 ? `Found ${emails.length} valid email address(es).` : "No email addresses found.",
                details: { instruction: "Email addresses must be valid format" }
            };
        }
    },
    {
        id: 108,
        name: "URL Format",
        category: "pattern",
        description: "URLs must use valid HTTP/HTTPS protocols",
        validate: (udo, config) => {
            const urlPattern = /https?:\/\/[^\s<>\"]+/gi;
            const urls = udo.rawText.match(urlPattern) || [];

            // Check for broken URLs (just protocol + nothing)
            const brokenUrls = urls.filter(u => u.length < 12 || u.endsWith("/") && u.split("/").length <= 3);

            if (brokenUrls.length > 0) {
                return {
                    ruleId: 108, name: "URL Format", category: "pattern",
                    status: "WARNING", confidence: 0.7,
                    message: `Found ${brokenUrls.length} potentially incomplete URL(s).`,
                    details: { instruction: "URLs must use valid HTTP/HTTPS protocols" }
                };
            }

            return {
                ruleId: 108, name: "URL Format", category: "pattern",
                status: "PASS", confidence: 1.0,
                message: urls.length > 0 ? `Found ${urls.length} valid URL(s).` : "No URLs found.",
                details: { instruction: "URLs must use valid HTTP/HTTPS protocols" }
            };
        }
    }
];

// =============================================================================
// MEASUREMENT RULES (8 rules)
// =============================================================================

const measurementRules: ProgrammaticRule[] = [
    {
        id: 201,
        name: "Abstract Word Count",
        category: "measurement",
        description: "Abstract must be 150-250 words",
        validate: (udo, config) => {
            const abstract = udo.content.abstract;
            if (!abstract || abstract.trim().length === 0) {
                return {
                    ruleId: 201, name: "Abstract Word Count", category: "measurement",
                    status: "FAIL", confidence: 1.0,
                    message: "No abstract found in document.",
                    location: {
                        section: "abstract",
                        severity: "critical"
                    },
                    details: { instruction: "Abstract must be 150-250 words" }
                };
            }

            const wordCount = abstract.split(/\s+/).filter(w => w.length > 0).length;
            const min = config.wordCounts?.abstract?.min || 150;
            const max = config.wordCounts?.abstract?.max || 250;

            const isValid = wordCount >= min && wordCount <= max;

            return {
                ruleId: 201, name: "Abstract Word Count", category: "measurement",
                status: isValid ? "PASS" : "FAIL",
                confidence: 1.0,
                message: isValid
                    ? `Abstract is ${wordCount} words (within ${min}-${max} range).`
                    : `Abstract is ${wordCount} words (should be ${min}-${max}).`,
                snippet: abstract.substring(0, 100) + (abstract.length > 100 ? '...' : ''),
                location: {
                    section: "abstract",
                    text: abstract.substring(0, 80), // First 80 chars for highlighting
                    severity: isValid ? "info" : "critical"
                },
                suggestion: !isValid ? `Adjust abstract to be between ${min} and ${max} words.` : undefined,
                details: { instruction: `Abstract must be ${min}-${max} words`, wordCount }
            };
        }
    },
    {
        id: 202,
        name: "Title Word Count",
        category: "measurement",
        description: "Title should be 10-15 words",
        validate: (udo, config) => {
            const title = udo.content.title;
            if (!title || title.trim().length === 0) {
                return {
                    ruleId: 202, name: "Title Word Count", category: "measurement",
                    status: "FAIL", confidence: 1.0,
                    message: "No title found in document.",
                    details: { instruction: "Title should be 10-15 words" }
                };
            }

            const wordCount = title.split(/\s+/).filter(w => w.length > 0).length;
            const min = config.wordCounts?.title?.min || 10;
            const max = config.wordCounts?.title?.max || 15;

            const isValid = wordCount >= min && wordCount <= max;

            return {
                ruleId: 202, name: "Title Word Count", category: "measurement",
                status: isValid ? "PASS" : "WARNING",
                confidence: 0.9,
                message: isValid
                    ? `Title is ${wordCount} words (within ${min}-${max} range).`
                    : `Title is ${wordCount} words (recommended: ${min}-${max}).`,
                details: { instruction: `Title should be ${min}-${max} words`, wordCount }
            };
        }
    },
    {
        id: 203,
        name: "Keywords Count",
        category: "measurement",
        description: "Document should have 4-6 keywords",
        validate: (udo, config) => {
            const keywords = udo.content.keywords;
            const count = keywords.length;
            const min = config.wordCounts?.keywords?.min || 4;
            const max = config.wordCounts?.keywords?.max || 6;

            if (count === 0) {
                return {
                    ruleId: 203, name: "Keywords Count", category: "measurement",
                    status: "FAIL", confidence: 1.0,
                    message: "No keywords found in document.",
                    location: {
                        section: "keywords",
                        severity: "critical"
                    },
                    details: { instruction: `Document should have ${min}-${max} keywords` }
                };
            }

            const isValid = count >= min && count <= max;
            const keywordText = keywords.join(', ');

            return {
                ruleId: 203, name: "Keywords Count", category: "measurement",
                status: isValid ? "PASS" : "FAIL",
                confidence: 1.0,
                message: isValid
                    ? `Found ${count} keywords (within ${min}-${max} range).`
                    : `Found ${count} keywords (should be ${min}-${max}).`,
                snippet: keywordText,
                location: {
                    section: "keywords",
                    text: keywords[0], // First keyword for highlighting
                    severity: isValid ? "info" : "warning"
                },
                details: { instruction: `Document should have ${min}-${max} keywords`, count, keywords }
            };
        }
    },
    {
        id: 204,
        name: "Document Word Count",
        category: "measurement",
        description: "Total document word count check",
        validate: (udo, config) => {
            const wordCount = udo.metadata.wordCount || 0;

            // Typical research paper: 3000-8000 words
            const isReasonable = wordCount >= 1000 && wordCount <= 15000;

            return {
                ruleId: 204, name: "Document Word Count", category: "measurement",
                status: isReasonable ? "PASS" : "WARNING",
                confidence: 0.8,
                message: `Document contains approximately ${wordCount} words.`,
                details: { instruction: "Total document word count check", wordCount }
            };
        }
    },
    {
        id: 205,
        name: "Reference Count",
        category: "measurement",
        description: "Document should have adequate references",
        validate: (udo, config) => {
            const refCount = udo.entities.references.length;

            if (refCount === 0) {
                return {
                    ruleId: 205, name: "Reference Count", category: "measurement",
                    status: "FAIL", confidence: 1.0,
                    message: "No references found in document.",
                    details: { instruction: "Document should have adequate references" }
                };
            }

            const isAdequate = refCount >= 10;

            return {
                ruleId: 205, name: "Reference Count", category: "measurement",
                status: isAdequate ? "PASS" : "WARNING",
                confidence: 0.8,
                message: `Document has ${refCount} reference(s).`,
                details: { instruction: "Document should have adequate references", refCount }
            };
        }
    },
    {
        id: 206,
        name: "Figure Count",
        category: "measurement",
        description: "Check number of figures in document",
        validate: (udo, config) => {
            const figCount = udo.entities.figures.length;

            return {
                ruleId: 206, name: "Figure Count", category: "measurement",
                status: "PASS", confidence: 1.0,
                message: `Document contains ${figCount} figure(s).`,
                details: { instruction: "Check number of figures in document", figCount }
            };
        }
    },
    {
        id: 207,
        name: "Table Count",
        category: "measurement",
        description: "Check number of tables in document",
        validate: (udo, config) => {
            const tableCount = udo.entities.tables.length;

            return {
                ruleId: 207, name: "Table Count", category: "measurement",
                status: "PASS", confidence: 1.0,
                message: `Document contains ${tableCount} table(s).`,
                details: { instruction: "Check number of tables in document", tableCount }
            };
        }
    },
    {
        id: 208,
        name: "Section Count",
        category: "measurement",
        description: "Document should have proper section count",
        validate: (udo, config) => {
            const sectionCount = udo.content.sections.length;

            return {
                ruleId: 208, name: "Section Count", category: "measurement",
                status: sectionCount >= 4 ? "PASS" : "WARNING",
                confidence: 0.8,
                message: `Document has ${sectionCount} major section(s).`,
                details: { instruction: "Document should have proper section count", sectionCount }
            };
        }
    }
];

// =============================================================================
// PRESENCE RULES (12 rules)
// =============================================================================

const presenceRules: ProgrammaticRule[] = [
    {
        id: 301,
        name: "Title Present",
        category: "presence",
        description: "Document must have a title",
        validate: (udo, config) => {
            const hasTitle = udo.content.title && udo.content.title.trim().length > 0;
            return {
                ruleId: 301, name: "Title Present", category: "presence",
                status: hasTitle ? "PASS" : "FAIL",
                confidence: 1.0,
                message: hasTitle ? "Title is present." : "No title found in document.",
                details: { instruction: "Document must have a title" }
            };
        }
    },
    {
        id: 302,
        name: "Abstract Present",
        category: "presence",
        description: "Document must have an abstract",
        validate: (udo, config) => {
            const hasAbstract = udo.content.abstract && udo.content.abstract.trim().length > 50;
            return {
                ruleId: 302, name: "Abstract Present", category: "presence",
                status: hasAbstract ? "PASS" : "FAIL",
                confidence: 1.0,
                message: hasAbstract ? "Abstract is present." : "No abstract found or abstract too short.",
                details: { instruction: "Document must have an abstract" }
            };
        }
    },
    {
        id: 303,
        name: "Keywords Present",
        category: "presence",
        description: "Document must have keywords",
        validate: (udo, config) => {
            const hasKeywords = udo.content.keywords && udo.content.keywords.length > 0;
            return {
                ruleId: 303, name: "Keywords Present", category: "presence",
                status: hasKeywords ? "PASS" : "FAIL",
                confidence: 1.0,
                message: hasKeywords ? `Keywords present (${udo.content.keywords.length}).` : "No keywords found.",
                details: { instruction: "Document must have keywords" }
            };
        }
    },
    {
        id: 304,
        name: "Introduction Present",
        category: "presence",
        description: "Document must have an Introduction section",
        validate: (udo, config) => {
            const hasIntro = udo.content.sections.some(s =>
                /^introduction|^background/i.test(s.heading)
            ) || /\bintroduction\b/i.test(udo.rawText.substring(0, 5000));

            return {
                ruleId: 304, name: "Introduction Present", category: "presence",
                status: hasIntro ? "PASS" : "FAIL",
                confidence: 0.9,
                message: hasIntro ? "Introduction section found." : "No Introduction section found.",
                details: { instruction: "Document must have an Introduction section" }
            };
        }
    },
    {
        id: 305,
        name: "Methods Present",
        category: "presence",
        description: "Document must have a Methods section",
        validate: (udo, config) => {
            const hasMethods = udo.content.sections.some(s =>
                /^method|^material/i.test(s.heading)
            ) || /\bmethods?\b|\bmaterials?\b/i.test(udo.rawText.substring(0, 10000));

            return {
                ruleId: 305, name: "Methods Present", category: "presence",
                status: hasMethods ? "PASS" : "FAIL",
                confidence: 0.9,
                message: hasMethods ? "Methods section found." : "No Methods section found.",
                details: { instruction: "Document must have a Methods section" }
            };
        }
    },
    {
        id: 306,
        name: "Results Present",
        category: "presence",
        description: "Document must have a Results section",
        validate: (udo, config) => {
            const hasResults = udo.content.sections.some(s =>
                /^results?/i.test(s.heading)
            ) || /\bresults?\b/i.test(udo.rawText);

            return {
                ruleId: 306, name: "Results Present", category: "presence",
                status: hasResults ? "PASS" : "WARNING",
                confidence: 0.8,
                message: hasResults ? "Results section found." : "No explicit Results section found.",
                details: { instruction: "Document must have a Results section" }
            };
        }
    },
    {
        id: 307,
        name: "Discussion Present",
        category: "presence",
        description: "Document must have a Discussion section (for original research)",
        validate: (udo, config) => {
            // Article types that don't require Discussion section
            const exemptTypes = ['PICTORIAL ESSAY', 'REVIEW', 'CASE REPORT', 'LETTER'];
            const articleType = udo.metadata.articleType || 'ORIGINAL ARTICLE';

            // Skip check for exempt article types
            if (exemptTypes.some(t => articleType.toUpperCase().includes(t))) {
                return {
                    ruleId: 307, name: "Discussion Present", category: "presence",
                    status: "PASS" as const,
                    confidence: 0.95,
                    message: `Discussion section not required for ${articleType}.`,
                    details: { instruction: "Document must have a Discussion section", articleType }
                };
            }

            const hasDiscussion = udo.content.sections.some(s =>
                /^discussion/i.test(s.heading)
            ) || /\bdiscussion\b/i.test(udo.rawText);

            return {
                ruleId: 307, name: "Discussion Present", category: "presence",
                status: hasDiscussion ? "PASS" : "FAIL",
                confidence: 0.9,
                message: hasDiscussion ? "Discussion section found." : "No Discussion section found.",
                details: { instruction: "Document must have a Discussion section", articleType }
            };
        }
    },
    {
        id: 308,
        name: "Conclusion Present",
        category: "presence",
        description: "Document should have a Conclusion",
        validate: (udo, config) => {
            const hasConclusion = udo.content.sections.some(s =>
                /^conclusion/i.test(s.heading)
            ) || /\bconclusion\b/i.test(udo.rawText);

            return {
                ruleId: 308, name: "Conclusion Present", category: "presence",
                status: hasConclusion ? "PASS" : "WARNING",
                confidence: 0.8,
                message: hasConclusion ? "Conclusion found." : "No explicit Conclusion section found.",
                details: { instruction: "Document should have a Conclusion" }
            };
        }
    },
    {
        id: 309,
        name: "References Present",
        category: "presence",
        description: "Document must have a References section",
        validate: (udo, config) => {
            const hasRefs = udo.entities.references.length > 0 ||
                /\breferences\b|\bbibliography\b/i.test(udo.rawText);

            return {
                ruleId: 309, name: "References Present", category: "presence",
                status: hasRefs ? "PASS" : "FAIL",
                confidence: 1.0,
                message: hasRefs ? `References section found (${udo.entities.references.length} refs).` : "No References section found.",
                details: { instruction: "Document must have a References section" }
            };
        }
    },
    {
        id: 310,
        name: "Author Information Present",
        category: "presence",
        description: "Document should include author information",
        validate: (udo, config) => {
            // Look for common author patterns
            const hasAuthor = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\s*\d{0,4}/i.test(udo.rawText.substring(0, 2000)) ||
                udo.metadata.author != null;

            return {
                ruleId: 310, name: "Author Information Present", category: "presence",
                status: hasAuthor ? "PASS" : "WARNING",
                confidence: 0.7,
                message: hasAuthor ? "Author information likely present." : "Author information may be missing.",
                details: { instruction: "Document should include author information" }
            };
        }
    },
    {
        id: 311,
        name: "Figure Captions Present",
        category: "presence",
        description: "All figures must have captions",
        validate: (udo, config) => {
            const figures = udo.entities.figures;
            if (figures.length === 0) {
                return {
                    ruleId: 311, name: "Figure Captions Present", category: "presence",
                    status: "SKIP", confidence: 1.0,
                    message: "No figures in document.",
                    details: { instruction: "All figures must have captions" }
                };
            }

            const withCaptions = figures.filter(f => f.caption && f.caption.length > 10);
            const allHaveCaptions = withCaptions.length === figures.length;

            return {
                ruleId: 311, name: "Figure Captions Present", category: "presence",
                status: allHaveCaptions ? "PASS" : "WARNING",
                confidence: 0.9,
                message: `${withCaptions.length}/${figures.length} figures have captions.`,
                details: { instruction: "All figures must have captions" }
            };
        }
    },
    {
        id: 312,
        name: "Table Captions Present",
        category: "presence",
        description: "All tables must have captions/titles",
        validate: (udo, config) => {
            const tables = udo.entities.tables;
            if (tables.length === 0) {
                return {
                    ruleId: 312, name: "Table Captions Present", category: "presence",
                    status: "SKIP", confidence: 1.0,
                    message: "No tables in document.",
                    details: { instruction: "All tables must have captions/titles" }
                };
            }

            const withCaptions = tables.filter(t => t.caption && t.caption.length > 10);
            const allHaveCaptions = withCaptions.length === tables.length;

            return {
                ruleId: 312, name: "Table Captions Present", category: "presence",
                status: allHaveCaptions ? "PASS" : "WARNING",
                confidence: 0.9,
                message: `${withCaptions.length}/${tables.length} tables have captions.`,
                details: { instruction: "All tables must have captions/titles" }
            };
        }
    },
    {
        id: 313,
        name: "Competing Interests Declaration",
        category: "presence",
        description: "Document must include a Competing Interests declaration",
        validate: (udo, config) => {
            const patterns = [
                /competing\s+interests?/i,
                /conflict\s+of\s+interest/i,
                /no\s+competing\s+interests?/i,
                /declare\s+no\s+conflicts?/i
            ];
            const found = patterns.some(p => p.test(udo.rawText));

            return {
                ruleId: 313, name: "Competing Interests Declaration", category: "presence",
                status: found ? "PASS" : "FAIL",
                confidence: 0.95,
                message: found ? "Competing interests declaration found." : "Missing competing interests declaration.",
                suggestion: !found ? "Add 'The authors declare no competing interests.'" : undefined,
                details: { instruction: "Document must include a Competing Interests declaration" },
                snippet: !found ? "Declarations" : undefined,
                location: !found ? {
                    section: "references",  // Usually at end, near references
                    text: "References",
                    severity: "critical" as const
                } : undefined
            };
        }
    },
    {
        id: 314,
        name: "Funding Declaration",
        category: "presence",
        description: "Document must include a Funding declaration",
        validate: (udo, config) => {
            const patterns = [
                /\bfunding\b/i,
                /\bgrant\b/i,
                /\bsupported\s+by\b/i,
                /financial\s+support/i,
                /no\s+funding/i
            ];
            const found = patterns.some(p => p.test(udo.rawText));

            return {
                ruleId: 314, name: "Funding Declaration", category: "presence",
                status: found ? "PASS" : "FAIL",
                confidence: 0.9,
                message: found ? "Funding declaration found." : "Missing funding declaration.",
                suggestion: !found ? "Add a 'Funding' section." : undefined,
                details: { instruction: "Document must include a Funding declaration" }
            };
        }
    },
    {
        id: 315,
        name: "Ethics Approval Statement",
        category: "presence",
        description: "Document must include ethics/IRB approval statement",
        validate: (udo, config) => {
            const patterns = [
                /ethics?\s+(?:committee|approval|board)/i,
                /\bIRB\b/,
                /institutional\s+review\s+board/i,
                /ethical\s+approval/i
            ];
            const found = patterns.some(p => p.test(udo.rawText));

            return {
                ruleId: 315, name: "Ethics Approval Statement", category: "presence",
                status: found ? "PASS" : "WARNING",
                confidence: 0.85,
                message: found ? "Ethics approval statement found." : "Ethics approval statement may be missing.",
                details: { instruction: "Document must include ethics/IRB approval statement" }
            };
        }
    },
    {
        id: 316,
        name: "Data Availability Statement",
        category: "presence",
        description: "Document must include a Data Availability Statement",
        validate: (udo, config) => {
            const patterns = [
                /data\s+availability/i,
                /data.*available\s+(?:upon|on)\s+request/i,
                /data\s+sharing/i
            ];
            const found = patterns.some(p => p.test(udo.rawText));

            return {
                ruleId: 316, name: "Data Availability Statement", category: "presence",
                status: found ? "PASS" : "WARNING",
                confidence: 0.85,
                message: found ? "Data availability statement found." : "Data availability statement may be missing.",
                details: { instruction: "Document must include a Data Availability Statement" }
            };
        }
    }
];

// =============================================================================
// STRUCTURE RULES (8 rules)
// =============================================================================

const structureRules: ProgrammaticRule[] = [
    {
        id: 401,
        name: "Section Order",
        category: "structure",
        description: "Sections must follow IMRAD order",
        validate: (udo, config) => {
            const sectionHeadings = udo.content.sections.map(s => s.heading.toLowerCase());

            const expectedOrder = ["introduction", "method", "result", "discussion"];
            const positions = expectedOrder.map(exp =>
                sectionHeadings.findIndex(h => h.includes(exp))
            ).filter(p => p >= 0);

            // Check if positions are in ascending order
            const isOrdered = positions.every((pos, i) => i === 0 || pos > positions[i - 1]);

            if (positions.length < 2) {
                return {
                    ruleId: 401, name: "Section Order", category: "structure",
                    status: "WARNING", confidence: 0.6,
                    message: "Could not verify section order (not enough sections detected).",
                    details: { instruction: "Sections must follow IMRAD order" }
                };
            }

            return {
                ruleId: 401, name: "Section Order", category: "structure",
                status: isOrdered ? "PASS" : "FAIL",
                confidence: 0.9,
                message: isOrdered ? "Sections follow correct IMRAD order." : "Sections may be out of order.",
                details: { instruction: "Sections must follow IMRAD order" }
            };
        }
    },
    {
        id: 402,
        name: "Heading Hierarchy",
        category: "structure",
        description: "Headings must follow proper hierarchy (H1 > H2 > H3)",
        validate: (udo, config) => {
            const headings = udo.elements.headings;
            if (headings.length < 2) {
                return {
                    ruleId: 402, name: "Heading Hierarchy", category: "structure",
                    status: "SKIP", confidence: 1.0,
                    message: "Not enough headings to verify hierarchy.",
                    details: { instruction: "Headings must follow proper hierarchy (H1 > H2 > H3)" }
                };
            }

            // Check for jumps (e.g., H1 to H3 without H2)
            let hasJumps = false;
            for (let i = 1; i < headings.length; i++) {
                const levelJump = headings[i].level - headings[i - 1].level;
                if (levelJump > 1) {
                    hasJumps = true;
                    break;
                }
            }

            return {
                ruleId: 402, name: "Heading Hierarchy", category: "structure",
                status: hasJumps ? "WARNING" : "PASS",
                confidence: 0.8,
                message: hasJumps ? "Heading levels may skip levels (e.g., H1 to H3)." : "Heading hierarchy is correct.",
                details: { instruction: "Headings must follow proper hierarchy (H1 > H2 > H3)" }
            };
        }
    },
    {
        id: 403,
        name: "Citation-Reference Match",
        category: "structure",
        description: "Each citation in text must have a corresponding reference",
        validate: (udo, config) => {
            const citationNums = new Set(
                udo.entities.citations
                    .map(c => c.text.match(/\d+/g) || [])
                    .flat()
                    .map(n => parseInt(n))
            );

            const refNums = new Set(
                udo.entities.references.map(r => parseInt(r.number)).filter(n => !isNaN(n))
            );

            const missingRefs = [...citationNums].filter(n => !refNums.has(n));
            const unusedRefs = [...refNums].filter(n => !citationNums.has(n));

            if (citationNums.size === 0) {
                return {
                    ruleId: 403, name: "Citation-Reference Match", category: "structure",
                    status: "SKIP", confidence: 1.0,
                    message: "No citations detected to verify.",
                    details: { instruction: "Each citation must have a corresponding reference" }
                };
            }

            const hasIssues = missingRefs.length > 0 || unusedRefs.length > 0;

            // Find first problematic citation for highlighting
            const firstMissingCitation = missingRefs.length > 0 ? `[${missingRefs[0]}]` : undefined;

            return {
                ruleId: 403, name: "Citation-Reference Match", category: "structure",
                status: hasIssues ? "WARNING" : "PASS",
                confidence: 0.8,
                message: hasIssues
                    ? `Issues: ${missingRefs.length} citations without refs, ${unusedRefs.length} unused refs.`
                    : "All citations match references.",
                details: { instruction: "Each citation must have a corresponding reference", missingRefs, unusedRefs },
                snippet: firstMissingCitation,
                location: hasIssues ? {
                    section: "references",
                    text: firstMissingCitation || "References",
                    severity: "warning" as const
                } : undefined
            };
        }
    },
    {
        id: 404,
        name: "Figure Reference in Text",
        category: "structure",
        description: "Figures should be referenced in the text",
        validate: (udo, config) => {
            const figureNums = udo.entities.figures.map(f => f.number);
            if (figureNums.length === 0) {
                return {
                    ruleId: 404, name: "Figure Reference in Text", category: "structure",
                    status: "SKIP", confidence: 1.0,
                    message: "No figures in document.",
                    details: { instruction: "Figures should be referenced in the text" }
                };
            }

            const referenced = figureNums.filter(n =>
                new RegExp(`Fig\\.?\\s*${n}|Figure\\s*${n}`, 'i').test(udo.rawText)
            );

            return {
                ruleId: 404, name: "Figure Reference in Text", category: "structure",
                status: referenced.length === figureNums.length ? "PASS" : "WARNING",
                confidence: 0.9,
                message: `${referenced.length}/${figureNums.length} figures are referenced in text.`,
                details: { instruction: "Figures should be referenced in the text" }
            };
        }
    },
    {
        id: 405,
        name: "Table Reference in Text",
        category: "structure",
        description: "Tables should be referenced in the text",
        validate: (udo, config) => {
            const tableNums = udo.entities.tables.map(t => t.number);
            if (tableNums.length === 0) {
                return {
                    ruleId: 405, name: "Table Reference in Text", category: "structure",
                    status: "SKIP", confidence: 1.0,
                    message: "No tables in document.",
                    details: { instruction: "Tables should be referenced in the text" }
                };
            }

            const referenced = tableNums.filter(n =>
                new RegExp(`Table\\s*${n}`, 'i').test(udo.rawText)
            );

            return {
                ruleId: 405, name: "Table Reference in Text", category: "structure",
                status: referenced.length === tableNums.length ? "PASS" : "WARNING",
                confidence: 0.9,
                message: `${referenced.length}/${tableNums.length} tables are referenced in text.`,
                details: { instruction: "Tables should be referenced in the text" }
            };
        }
    },
    {
        id: 406,
        name: "Abbreviation Definition Order",
        category: "structure",
        description: "Abbreviations must be defined before first use",
        validate: (udo, config) => {
            const abbrevs = udo.entities.abbreviations;
            if (abbrevs.length === 0) {
                return {
                    ruleId: 406, name: "Abbreviation Definition Order", category: "structure",
                    status: "SKIP", confidence: 1.0,
                    message: "No abbreviations detected.",
                    details: { instruction: "Abbreviations must be defined before first use" }
                };
            }

            const definedBeforeUse = abbrevs.filter(a => a.firstDefinedOnUse);

            return {
                ruleId: 406, name: "Abbreviation Definition Order", category: "structure",
                status: definedBeforeUse.length === abbrevs.length ? "PASS" : "WARNING",
                confidence: 0.8,
                message: `${definedBeforeUse.length}/${abbrevs.length} abbreviations defined at first use.`,
                details: { instruction: "Abbreviations must be defined before first use" }
            };
        }
    },
    {
        id: 407,
        name: "Duplicate Headings",
        category: "structure",
        description: "Section headings should be unique",
        validate: (udo, config) => {
            const headings = udo.elements.headings.map(h => h.text.toLowerCase().trim());
            const unique = new Set(headings);
            const hasDuplicates = unique.size < headings.length;

            return {
                ruleId: 407, name: "Duplicate Headings", category: "structure",
                status: hasDuplicates ? "WARNING" : "PASS",
                confidence: 0.9,
                message: hasDuplicates
                    ? `Found ${headings.length - unique.size} duplicate heading(s).`
                    : "All section headings are unique.",
                details: { instruction: "Section headings should be unique" }
            };
        }
    },
    {
        id: 408,
        name: "Empty Sections",
        category: "structure",
        description: "Sections should not be empty",
        validate: (udo, config) => {
            const emptySections = udo.content.sections.filter(s =>
                !s.content || s.content.trim().length < 50
            );

            // Get first empty section heading for highlighting
            const firstEmptyHeading = emptySections[0]?.heading || undefined;

            return {
                ruleId: 408, name: "Empty Sections", category: "structure",
                status: emptySections.length === 0 ? "PASS" : "WARNING",
                confidence: 0.8,
                message: emptySections.length === 0
                    ? "All sections have content."
                    : `Found ${emptySections.length} section(s) with little or no content: ${emptySections.map(s => s.heading).join(", ")}`,
                suggestion: emptySections.length > 0
                    ? `Add substantive content to the following section(s): ${emptySections.map(s => s.heading).join(", ")}`
                    : undefined,
                details: { instruction: "Sections should not be empty" },
                snippet: firstEmptyHeading,
                location: emptySections.length > 0 ? {
                    section: "general",
                    text: firstEmptyHeading || "Introduction",
                    severity: "warning" as const
                } : undefined
            };
        }
    },
    // =========================================================================
    // NEW RULES FROM SPRINGER GUIDELINES
    // =========================================================================
    {
        id: 409,
        name: "Heading Levels",
        category: "structure",
        description: "Use no more than three levels of displayed headings",
        validate: (udo, config) => {
            const headings = udo.elements.headings;
            const levels = headings.map(h => h.level);
            const maxLevel = Math.max(...levels, 0);

            // Check if any heading has level > 3
            const tooDeep = headings.filter(h => h.level > 3);

            if (headings.length === 0) {
                return {
                    ruleId: 409, name: "Heading Levels", category: "structure",
                    status: "SKIP", confidence: 1.0,
                    message: "No headings detected in document.",
                    details: { instruction: "Use no more than three levels of displayed headings" }
                };
            }

            return {
                ruleId: 409, name: "Heading Levels", category: "structure",
                status: tooDeep.length === 0 ? "PASS" : "FAIL",
                confidence: 0.9,
                message: tooDeep.length === 0
                    ? `Document uses ${maxLevel} heading level(s) (max 3 allowed).`
                    : `Found ${tooDeep.length} heading(s) exceeding 3 levels.`,
                snippet: tooDeep.length > 0 ? tooDeep[0].text : undefined,
                location: tooDeep.length > 0 ? {
                    section: "structure",
                    text: tooDeep[0].text,
                    severity: "warning"
                } : undefined,
                suggestion: tooDeep.length > 0 ? "Reduce heading depth to maximum 3 levels (e.g., 1, 1.1, 1.1.1)." : undefined,
                details: { instruction: "Use no more than three levels of displayed headings", maxLevel }
            };
        }
    },
    {
        id: 410,
        name: "Footnotes Format",
        category: "structure",
        description: "Always use footnotes instead of endnotes",
        validate: (udo, config) => {
            const text = udo.rawText.toLowerCase();

            // Check for "endnotes" section header
            const hasEndnotes = /\bendnotes?\b/i.test(text);
            // Check for endnote-style patterns like "(endnote 1)" or "[endnote]"
            const endnotePatterns = text.match(/\bendnote\s*\d+\b/gi) || [];

            if (hasEndnotes || endnotePatterns.length > 0) {
                return {
                    ruleId: 410, name: "Footnotes Format", category: "structure",
                    status: "FAIL", confidence: 0.85,
                    message: "Document appears to use endnotes. Springer requires footnotes instead.",
                    snippet: endnotePatterns[0] || "Endnotes",
                    location: {
                        section: "structure",
                        text: "endnote",
                        severity: "warning"
                    },
                    suggestion: "Convert all endnotes to footnotes.",
                    details: { instruction: "Always use footnotes instead of endnotes" }
                };
            }

            return {
                ruleId: 410, name: "Footnotes Format", category: "structure",
                status: "PASS", confidence: 0.9,
                message: "No endnotes detected (footnotes or no notes used).",
                details: { instruction: "Always use footnotes instead of endnotes" }
            };
        }
    },
    {
        id: 411,
        name: "Reference DOI Links",
        category: "structure",
        description: "References should include DOIs as full links",
        validate: (udo, config) => {
            const references = udo.entities.references;
            if (references.length === 0) {
                return {
                    ruleId: 411, name: "Reference DOI Links", category: "structure",
                    status: "SKIP", confidence: 1.0,
                    message: "No references found in document.",
                    details: { instruction: "References should include DOIs as https://doi.org/xxx links" }
                };
            }

            // Check how many references have DOI links
            const doiPattern = /https?:\/\/doi\.org\/10\.\d+/i;
            const refsWithDoi = references.filter(r => doiPattern.test(r.text));
            const refsWithoutDoi = references.filter(r => !doiPattern.test(r.text));
            const percentage = Math.round((refsWithDoi.length / references.length) * 100);

            // If less than 50% have DOIs, it's a warning
            const isGood = percentage >= 50;

            // Find first reference without DOI for highlighting
            const firstRefWithoutDoi = refsWithoutDoi[0]?.text?.substring(0, 50);

            return {
                ruleId: 411, name: "Reference DOI Links", category: "structure",
                status: isGood ? "PASS" : "WARNING",
                confidence: 0.85,
                message: `${refsWithDoi.length}/${references.length} references (${percentage}%) include DOI links.`,
                suggestion: !isGood ? "Add DOI links to references where available (format: https://doi.org/10.xxxx)." : undefined,
                details: {
                    instruction: "References should include DOIs as https://doi.org/xxx links",
                    refsWithDoi: refsWithDoi.length,
                    totalRefs: references.length,
                    percentage
                },
                snippet: !isGood ? firstRefWithoutDoi : undefined,
                location: !isGood ? {
                    section: "references",
                    text: "References",
                    severity: "warning" as const
                } : undefined
            };
        }
    }
];

// =============================================================================
// MAIN VALIDATOR CLASS
// =============================================================================

const ALL_PROGRAMMATIC_RULES: ProgrammaticRule[] = [
    ...patternRules,
    ...measurementRules,
    ...presenceRules,
    ...structureRules
];

export class ProgrammaticValidator {

    /**
     * Run all programmatic validation rules
     * These are instant (no AI calls) and 100% deterministic
     */
    validate(udo: UDO, journalId: string): RuleResult[] {
        const journal = JOURNALS[journalId];
        if (!journal) {
            console.warn(`Journal not found: ${journalId}, using defaults`);
        }

        const config = journal?.programmatic || {};
        const results: RuleResult[] = [];

        console.log(`[Programmatic] Running ${ALL_PROGRAMMATIC_RULES.length} rules...`);

        for (const rule of ALL_PROGRAMMATIC_RULES) {
            try {
                const result = rule.validate(udo, config);
                results.push(result);
            } catch (error: any) {
                console.error(`Error in rule ${rule.name}:`, error);
                results.push({
                    ruleId: rule.id,
                    name: rule.name,
                    category: rule.category,
                    status: "SKIP",
                    confidence: 0,
                    message: `Validation error: ${error.message}`,
                    details: { instruction: rule.description }
                } as RuleResult);
            }
        }

        console.log(`[Programmatic] Completed in <100ms`);
        return results;
    }
}
