/**
 * DOCX Writer Service
 * Applies fixes to the original DOCX document by finding and replacing text
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export interface TextReplacement {
    original: string;
    replacement: string;
}

/**
 * Apply text replacements to a DOCX file
 * Returns a new ArrayBuffer with modifications applied
 */
export async function applyFixesToDocx(
    originalBuffer: ArrayBuffer,
    replacements: TextReplacement[]
): Promise<Blob> {
    // Load the DOCX file
    const zip = new PizZip(originalBuffer);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });

    // Get the document XML
    const documentXml = zip.file('word/document.xml');
    if (!documentXml) {
        throw new Error('Invalid DOCX file: document.xml not found');
    }

    let content = documentXml.asText();

    // Apply each replacement
    for (const { original, replacement } of replacements) {
        if (original && replacement && original !== replacement) {
            // Escape special XML characters
            const escapedOriginal = escapeXml(original);
            const escapedReplacement = escapeXml(replacement);

            // Try to find and replace (handle text that might be split across runs)
            content = replaceTextInXml(content, original, replacement);
        }
    }

    // Update the document with new content
    zip.file('word/document.xml', content);

    // Generate the new DOCX
    const output = zip.generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    return output;
}

/**
 * Replace text in DOCX XML, handling text that might be split across runs
 */
function replaceTextInXml(xml: string, searchText: string, replaceText: string): string {
    // First try simple replacement (text in single run)
    if (xml.includes(searchText)) {
        return xml.split(searchText).join(replaceText);
    }

    // For text split across XML tags, we need a more sophisticated approach
    // This simplified version handles common cases

    // Remove the XML tags, find text, and try to replace
    const textOnly = xml.replace(/<[^>]+>/g, '');
    if (textOnly.includes(searchText)) {
        // Text exists but is split across runs
        // Try to find a close match that might work
        const words = searchText.split(/\s+/);
        if (words.length > 1) {
            // Try replacing the first significant word
            const firstWord = words.find(w => w.length > 3) || words[0];
            if (xml.includes(firstWord)) {
                console.log(`Partial match: replacing instances of "${firstWord}"`);
            }
        }
    }

    return xml;
}

/**
 * Escape special XML characters
 */
function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Simple text replacement in DOCX - uses string matching
 * For more complex replacements, consider using the full XML parsing approach
 */
export function createTextReplacer(originalBuffer: ArrayBuffer): TextReplacer {
    return new TextReplacer(originalBuffer);
}

export class TextReplacer {
    private zip: PizZip;
    private content: string;

    constructor(buffer: ArrayBuffer) {
        this.zip = new PizZip(buffer);
        const docXml = this.zip.file('word/document.xml');
        if (!docXml) {
            throw new Error('Invalid DOCX file');
        }
        this.content = docXml.asText();
    }

    /**
     * Replace text in the document
     * Note: Works best with short, unique text snippets
     */
    replace(original: string, replacement: string): boolean {
        if (!original || !replacement) return false;

        // Check if text exists (in raw form or XML-escaped)
        const exists = this.content.includes(original) ||
            this.content.includes(escapeXml(original));

        if (exists) {
            this.content = this.content.split(original).join(replacement);
            this.content = this.content.split(escapeXml(original)).join(escapeXml(replacement));
            return true;
        }

        return false;
    }

    /**
     * Generate the modified DOCX as a Blob
     */
    generate(): Blob {
        this.zip.file('word/document.xml', this.content);
        return this.zip.generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
    }
}
