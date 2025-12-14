/**
 * DOCX Smart Editor
 * 
 * XML-aware DOCX editing that reliably finds and replaces text,
 * even when split across multiple XML runs.
 * 
 * Design Principles (per rules-back-end.md):
 * - Explicit contracts for all operations
 * - Graceful degradation on failures
 * - Deterministic behavior
 * - Clear separation between parsing and modification
 */

import PizZip from 'pizzip';

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export interface TextLocation {
    /** The paragraph element containing the text */
    paragraphIndex: number;
    /** All text nodes in the paragraph with their positions */
    textNodes: TextNodeInfo[];
    /** Combined text content of the paragraph */
    combinedText: string;
    /** Start index of the match within combinedText */
    matchStart: number;
    /** End index of the match within combinedText */
    matchEnd: number;
}

export interface TextNodeInfo {
    /** Index in the paragraph's text element array */
    index: number;
    /** Start position in the combined text */
    start: number;
    /** Length of this text node's content */
    length: number;
    /** The text content */
    content: string;
}

export interface ReplacementResult {
    success: boolean;
    message: string;
    /** Original text that was searched */
    searchText: string;
    /** Replacement text (if successful) */
    replacementText?: string;
    /** Location where replacement occurred (if successful) */
    location?: { paragraph: number; startOffset: number };
}

export interface ChangeLogEntry {
    timestamp: Date;
    operation: 'replace' | 'insert' | 'delete';
    original: string;
    replacement: string;
    paragraph: number;
    success: boolean;
}

// ============================================================================
// DOCX SMART EDITOR
// ============================================================================

export class DocxSmartEditor {
    private zip: PizZip;
    private documentXmlString: string;
    private changeLog: ChangeLogEntry[] = [];
    private isModified: boolean = false;

    constructor(buffer: ArrayBuffer) {
        this.zip = new PizZip(buffer);

        const documentXml = this.zip.file('word/document.xml');
        if (!documentXml) {
            throw new Error('Invalid DOCX file: word/document.xml not found');
        }

        this.documentXmlString = documentXml.asText();
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    /**
     * Find text in the document, handling text split across XML runs.
     * Returns null if text is not found.
     */
    findText(searchText: string): TextLocation | null {
        if (!searchText || searchText.trim() === '') {
            return null;
        }

        // Extract all paragraphs with their text content
        const paragraphs = this.extractParagraphs();

        for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
            const para = paragraphs[pIndex];
            const matchIndex = para.combinedText.indexOf(searchText);

            if (matchIndex !== -1) {
                return {
                    paragraphIndex: pIndex,
                    textNodes: para.textNodes,
                    combinedText: para.combinedText,
                    matchStart: matchIndex,
                    matchEnd: matchIndex + searchText.length
                };
            }
        }

        // Not found in any paragraph - try cross-paragraph search for short strings
        if (searchText.length < 50) {
            return this.findTextAcrossParagraphs(paragraphs, searchText);
        }

        return null;
    }

    /**
     * Replace text in the document.
     * Handles text split across XML runs by reconstructing the paragraph.
     */
    replace(original: string, replacement: string): ReplacementResult {
        if (!original || original === replacement) {
            return {
                success: false,
                message: 'Invalid replacement: original is empty or same as replacement',
                searchText: original
            };
        }

        // Strategy 1: Direct string replacement (fastest, works for simple cases)
        if (this.documentXmlString.includes(this.escapeXml(original))) {
            const escapedOriginal = this.escapeXml(original);
            const escapedReplacement = this.escapeXml(replacement);

            this.documentXmlString = this.documentXmlString.replace(
                escapedOriginal,
                escapedReplacement
            );

            this.logChange('replace', original, replacement, -1, true);
            this.isModified = true;

            return {
                success: true,
                message: 'Direct replacement successful',
                searchText: original,
                replacementText: replacement
            };
        }

        // Strategy 2: Plain text exists but may be split across runs
        const location = this.findText(original);
        if (!location) {
            return {
                success: false,
                message: `Text not found in document: "${original.slice(0, 50)}..."`,
                searchText: original
            };
        }

        // Perform the smart replacement
        const result = this.performSmartReplacement(location, original, replacement);

        if (result.success) {
            this.isModified = true;
        }

        return result;
    }

    /**
     * Replace all occurrences of text in the document.
     */
    replaceAll(original: string, replacement: string): ReplacementResult[] {
        const results: ReplacementResult[] = [];
        let found = true;
        let iterations = 0;
        const MAX_ITERATIONS = 100; // Safety limit

        while (found && iterations < MAX_ITERATIONS) {
            const result = this.replace(original, replacement);
            results.push(result);
            found = result.success;
            iterations++;
        }

        return results;
    }

    /**
     * Check if the document has been modified.
     */
    hasChanges(): boolean {
        return this.isModified;
    }

    /**
     * Get the change log of all modifications.
     */
    getChangeLog(): ChangeLogEntry[] {
        return [...this.changeLog];
    }

    /**
     * Get a human-readable summary of changes.
     */
    getChangeSummary(): string[] {
        return this.changeLog
            .filter(c => c.success)
            .map(c => `• Replaced "${this.truncate(c.original, 30)}" → "${this.truncate(c.replacement, 30)}"`);
    }

    /**
     * Export the modified document as a Blob.
     */
    export(): Blob {
        // Update the document.xml in the zip
        this.zip.file('word/document.xml', this.documentXmlString);

        return this.zip.generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            compression: 'DEFLATE'
        });
    }

    // ========================================================================
    // PRIVATE HELPERS
    // ========================================================================

    private extractParagraphs(): Array<{ combinedText: string; textNodes: TextNodeInfo[] }> {
        const result: Array<{ combinedText: string; textNodes: TextNodeInfo[] }> = [];

        // Match all paragraph elements
        const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
        let pMatch;

        while ((pMatch = paragraphRegex.exec(this.documentXmlString)) !== null) {
            const paragraphContent = pMatch[1];
            const textNodes: TextNodeInfo[] = [];
            let combinedText = '';

            // Extract text from <w:t> elements
            const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
            let tMatch;
            let index = 0;

            while ((tMatch = textRegex.exec(paragraphContent)) !== null) {
                const text = this.unescapeXml(tMatch[1]);
                textNodes.push({
                    index,
                    start: combinedText.length,
                    length: text.length,
                    content: text
                });
                combinedText += text;
                index++;
            }

            if (combinedText.length > 0) {
                result.push({ combinedText, textNodes });
            }
        }

        return result;
    }

    private findTextAcrossParagraphs(
        paragraphs: Array<{ combinedText: string; textNodes: TextNodeInfo[] }>,
        searchText: string
    ): TextLocation | null {
        // Combine consecutive paragraphs to find text that spans multiple
        for (let i = 0; i < paragraphs.length - 1; i++) {
            const combined = paragraphs[i].combinedText + ' ' + paragraphs[i + 1].combinedText;
            if (combined.includes(searchText)) {
                // Found across paragraphs - return first paragraph as approximate location
                return {
                    paragraphIndex: i,
                    textNodes: paragraphs[i].textNodes,
                    combinedText: paragraphs[i].combinedText,
                    matchStart: 0,
                    matchEnd: paragraphs[i].combinedText.length
                };
            }
        }
        return null;
    }

    private performSmartReplacement(
        location: TextLocation,
        original: string,
        replacement: string
    ): ReplacementResult {
        try {
            // Build the new combined text
            const newCombinedText =
                location.combinedText.slice(0, location.matchStart) +
                replacement +
                location.combinedText.slice(location.matchEnd);

            // Find the paragraph in the XML and replace its text content
            const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
            let pMatch;
            let paragraphIndex = 0;

            while ((pMatch = paragraphRegex.exec(this.documentXmlString)) !== null) {
                if (paragraphIndex === location.paragraphIndex) {
                    const oldParagraph = pMatch[0];
                    const newParagraph = this.rebuildParagraphWithNewText(
                        oldParagraph,
                        newCombinedText
                    );

                    this.documentXmlString = this.documentXmlString.replace(
                        oldParagraph,
                        newParagraph
                    );

                    this.logChange('replace', original, replacement, paragraphIndex, true);

                    return {
                        success: true,
                        message: 'Smart replacement successful',
                        searchText: original,
                        replacementText: replacement,
                        location: { paragraph: paragraphIndex, startOffset: location.matchStart }
                    };
                }
                paragraphIndex++;
            }

            return {
                success: false,
                message: 'Could not locate paragraph for replacement',
                searchText: original
            };
        } catch (error: any) {
            this.logChange('replace', original, replacement, location.paragraphIndex, false);
            return {
                success: false,
                message: `Replacement failed: ${error.message}`,
                searchText: original
            };
        }
    }

    private rebuildParagraphWithNewText(paragraphXml: string, newText: string): string {
        // Find the first <w:t> element and replace all text content with new text
        // This is a simplified approach that works for most cases

        // Strategy: Find the first run with text, put all text there, empty the rest
        const firstTextMatch = paragraphXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/);

        if (!firstTextMatch) {
            // No text elements - can't replace
            return paragraphXml;
        }

        // Replace first <w:t> content with full new text
        let result = paragraphXml.replace(
            firstTextMatch[0],
            `<w:t xml:space="preserve">${this.escapeXml(newText)}</w:t>`
        );

        // Empty all subsequent <w:t> elements in this paragraph
        const subsequentRegex = /<w:t[^>]*>[^<]*<\/w:t>/g;
        let isFirst = true;
        result = result.replace(subsequentRegex, (match) => {
            if (isFirst) {
                isFirst = false;
                return match; // Keep the first one (already replaced)
            }
            return '<w:t></w:t>'; // Empty the rest
        });

        return result;
    }

    private escapeXml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    private unescapeXml(text: string): string {
        return text
            .replace(/&apos;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&amp;/g, '&');
    }

    private logChange(
        operation: ChangeLogEntry['operation'],
        original: string,
        replacement: string,
        paragraph: number,
        success: boolean
    ): void {
        this.changeLog.push({
            timestamp: new Date(),
            operation,
            original,
            replacement,
            paragraph,
            success
        });
    }

    private truncate(str: string, maxLen: number): string {
        if (str.length <= maxLen) return str;
        return str.slice(0, maxLen - 3) + '...';
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new DocxSmartEditor instance for the given document buffer.
 * This is the recommended entry point.
 */
export function createDocxEditor(buffer: ArrayBuffer): DocxSmartEditor {
    return new DocxSmartEditor(buffer);
}
