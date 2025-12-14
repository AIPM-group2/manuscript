import JSZip from "jszip";
import mammoth from "mammoth";
import type { UDO, Section, Paragraph, Heading, Citation, Figure, Table, Reference, Abbreviation } from "./types/udo";

export class DocxParser {
    /**
     * Main entry point: Parses a DOCX file buffer into a Unified Document Object (UDO)
     */
    static async parse(fileBuffer: ArrayBuffer, fileName: string): Promise<UDO> {
        // 1. Load ZIP
        const zip = await JSZip.loadAsync(fileBuffer);

        // 2. Extract key XML files
        const documentXml = await zip.file("word/document.xml")?.async("string") || "";
        // const stylesXml = await zip.file("word/styles.xml")?.async("string") || "";
        const corePropsXml = await zip.file("docProps/core.xml")?.async("string") || "";

        // 3. Extract content via Mammoth (for clean text/HTML)
        const mammothResult = await mammoth.convertToHtml({ arrayBuffer: fileBuffer });
        const rawHTML = mammothResult.value;
        const rawText = await mammoth.extractRawText({ arrayBuffer: fileBuffer }).then(r => r.value);

        // 4. Build Metadata
        const metadata = this.extractMetadata(corePropsXml, rawText, fileName);

        // 5. Extract Entities (Basic Regex extraction for Phase 1)
        const citations = this.extractCitations(rawText);
        const references = this.extractReferences(rawText);
        const figures = this.extractFigures(rawText);
        const tables = this.extractTables(rawText, rawHTML);
        const abbreviations = this.extractAbbreviations(rawText);

        // 6. Extract Structure (Sections, Headings)
        // For Phase 1, we use a simplified structure parsing based on text patterns
        // In Phase 2, we can enhance this with direct XML parsing
        const { sections, headings, title, abstract, keywords, articleType } = this.extractStructure(rawText);

        // 7. Construct and return UDO
        return {
            metadata: {
                ...metadata,
                articleType
            },
            content: {
                title,
                abstract,
                keywords,
                sections
            },
            entities: {
                citations,
                figures,
                tables,
                references,
                abbreviations
            },
            elements: {
                paragraphs: [], // Populated if we do full XML parsing later
                headings
            },
            rawText,
            rawHTML
        };
    }

    // --------------------------------------------------------------------------
    // Extraction Helpers
    // --------------------------------------------------------------------------

    private static extractMetadata(coreXml: string, text: string, fileName: string) {
        // Simple word count estimate
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

        // XML parsing would go here for author/dates from core.xml
        // For now returning basic info
        return {
            fileName,
            wordCount,
            characterCount: text.length,
            createdDate: new Date(), // Placeholder
            modifiedDate: new Date() // Placeholder
        };
    }

    private static extractStructure(text: string) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // Patterns to skip when finding title (journal headers, DOIs, etc.)
        const skipPatterns = [
            /^doi:/i,
            /^https?:\/\//i,
            /^\d{4}.*\d+[–-]\d+/,  // Journal citation like "2024 54:922–935"
            /^pediatric radiology/i,
            /^\[\d+\]/,            // Reference numbers
            /^ISSN/i,
            /^©/,                  // Copyright
            /^springer/i,
            /^received:/i,
            /^accepted:/i,
            /^published/i,
        ];

        // Article type detection
        const articleTypePatterns = [
            { type: 'PICTORIAL ESSAY', pattern: /pictorial\s*essay/i },
            { type: 'REVIEW', pattern: /\breview\b/i },
            { type: 'CASE REPORT', pattern: /case\s*report/i },
            { type: 'ORIGINAL ARTICLE', pattern: /original\s*(article|research)/i },
            { type: 'LETTER', pattern: /letter\s*to\s*the\s*editor/i },
        ];

        let articleType = 'ORIGINAL ARTICLE'; // Default
        let title = "Untitled";

        // Find article type and title
        for (let i = 0; i < Math.min(lines.length, 20); i++) {
            const line = lines[i];

            // Check for article type
            for (const { type, pattern } of articleTypePatterns) {
                if (pattern.test(line)) {
                    articleType = type;
                }
            }

            // Skip lines that look like metadata
            const shouldSkip = skipPatterns.some(p => p.test(line));
            if (shouldSkip) continue;

            // Skip very short lines (likely labels) or article type labels
            if (line.length < 10) continue;
            if (articleTypePatterns.some(({ pattern }) => pattern.test(line))) continue;

            // This is likely the title (first substantial non-metadata line)
            if (line.length >= 10 && line.length <= 200) {
                title = line;
                break;
            }
        }

        // Heuristic: Find Abstract
        const abstractStart = lines.findIndex(l => /^abstract/i.test(l));
        let abstract = "";
        let keywords: string[] = [];

        // Heuristic: Find Keywords (often after abstract)
        const keywordsLineIndex = lines.findIndex(l => /^keywords/i.test(l));
        if (keywordsLineIndex !== -1) {
            const kLine = lines[keywordsLineIndex].replace(/^keywords[:\s]*/i, "");
            // Handle multiple separator types: comma, semicolon, middot (·), bullet (•)
            keywords = kLine.split(/[,;·•\u00B7\u2022]/).map(k => k.trim()).filter(k => k.length > 0);
        }

        if (abstractStart !== -1) {
            // Grab text between Abstract and Keywords (or next section)
            const end = keywordsLineIndex !== -1 ? keywordsLineIndex : abstractStart + 5; // Fallback
            abstract = lines.slice(abstractStart + 1, end).join(" ");
        }

        // Heuristic: Find Sections (Introduction, Methods, Results, Discussion)
        const sections: Section[] = [];
        const headings: Heading[] = [];

        const standardSections = ["Introduction", "Methods", "Material", "Results", "Discussion", "Conclusion", "References"];

        lines.forEach((line, index) => {
            // Check if line matches a standard section header
            if (standardSections.some(s => new RegExp(`^${s}`, 'i').test(line)) && line.length < 50) {
                headings.push({ text: line, level: 1, paragraphIndex: index });
                sections.push({
                    heading: line,
                    level: 1,
                    content: "", // Content filled by aggregating paragraphs between headings
                    startParagraphIndex: index,
                    endParagraphIndex: -1
                });
            }
        });

        return { title, abstract, keywords, sections, headings, articleType };
    }

    private static extractCitations(text: string): Citation[] {
        // Pattern: [1], [1-3], [1, 3]
        const regex = /\[\d+(?:[-,]\s*\d+)*\]/g;
        const matches = [...text.matchAll(regex)];
        return matches.map(m => ({
            text: m[0],
            pattern: "numbered",
            index: m.index || 0,
            context: text.substring(Math.max(0, (m.index || 0) - 20), (m.index || 0) + 20)
        }));
    }

    private static extractReferences(text: string): Reference[] {
        // Locate References section - try multiple patterns
        const refPatterns = [
            /References\s*\n([\s\S]*?)(?=\n\n[A-Z][a-z]+\s*\n|$)/i,  // Until next section
            /References\s*\n([\s\S]*)/i  // Fallback - take everything after References
        ];

        let refBlock = '';
        for (const pattern of refPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                refBlock = match[1];
                break;
            }
        }

        if (!refBlock) return [];

        // Try multiple reference patterns
        const references: Reference[] = [];

        // Pattern 1: Numbered references like "1. Author..." or "[1] Author..."
        const numberedPattern = /^\s*\[?(\d+)\]?\.?\s+(.+?)(?=\n\s*\[?\d+\]?\.?\s+|$)/gms;
        let match;
        while ((match = numberedPattern.exec(refBlock)) !== null) {
            references.push({ number: match[1], text: match[2].trim() });
        }

        // If no numbered refs found, try counting by line breaks with author-year pattern
        if (references.length === 0) {
            const lines = refBlock.split(/\n/).filter(l => l.trim().length > 20);
            // Look for lines that look like references (author, year, journal)
            lines.forEach((line, idx) => {
                if (/\(\d{4}\)|\d{4};|\d{4}\./.test(line)) {
                    references.push({ number: String(idx + 1), text: line.trim() });
                }
            });
        }

        return references;
    }

    private static extractFigures(text: string): Figure[] {
        // Pattern: Fig. 1 OR Figure 1
        const regex = /(?:Fig\.?|Figure)\s*(\d+).*?[:.]\s*(.*)/gi;
        const figures: Figure[] = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            figures.push({
                number: match[1],
                caption: match[0].trim()
            });
        }
        return figures;
    }

    private static extractTables(text: string, html: string): Table[] {
        // Pattern: Table 1 matches
        const regex = /Table\s+(\d+).*?[:.]\s*(.*)/gi;
        const tables: Table[] = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            tables.push({
                number: match[1].trim(),
                caption: match[0].trim(),
                rowCount: 0, // Need HTML parsing for this
                colCount: 0
            });
        }
        return tables;
    }

    private static extractAbbreviations(text: string): Abbreviation[] {
        // Pattern: "Full Name (ABBR)"
        const regex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+\(([A-Z]{2,})\)/g;
        const abbreviations: Abbreviation[] = [];
        let match;

        while ((match = regex.exec(text)) !== null) {
            abbreviations.push({
                longForm: match[1],
                shortForm: match[2],
                firstUseIndex: match.index,
                firstDefinedOnUse: true
            });
        }
        return abbreviations;
    }
}
