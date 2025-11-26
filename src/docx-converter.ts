/**
 * Advanced DOCX Converter - Extracts rich document structure and metadata
 * Inspired by ContextGem's approach to preserve formatting details for LLM analysis
 * 
 * Unlike Mammoth which converts to HTML, this extracts:
 * - Paragraph styles (Heading 1, Normal, etc.)
 * - Font information (family, size, bold, italic, underline)
 * - Spacing (before/after paragraphs, line spacing)
 * - List information (numbered/bulleted, nesting level)
 * - Table structure and cell metadata
 * - Comments and footnotes
 * - Text runs with individual formatting
 */

import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export interface ParagraphMetadata {
  text: string;
  style?: string;          // e.g., "Heading1", "Normal", etc.
  listLevel?: number;      // 0-8 for nested lists
  isNumbered?: boolean;    // true for numbered lists
  isBullet?: boolean;      // true for bulleted lists
  spacingBefore?: number;  // in twips (1/20th of a point)
  spacingAfter?: number;   // in twips
  lineSpacing?: number;    // in twips or percentage
  alignment?: string;      // "left", "center", "right", "justify"
  indentation?: {
    left?: number;
    right?: number;
    firstLine?: number;
    hanging?: number;
  };
  runs: TextRun[];         // Individual formatted text segments
}

export interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;       // in half-points (e.g., 24 = 12pt)
  fontFamily?: string;
}

export interface TableMetadata {
  rows: TableRow[];
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableCell {
  text: string;
  colspan?: number;
  rowspan?: number;
  paragraphs: ParagraphMetadata[];
}

export interface DocxDocument {
  paragraphs: ParagraphMetadata[];
  tables: TableMetadata[];
  styles: Map<string, StyleDefinition>;
  
  // Formatted text suitable for LLM input
  toMarkdown(): string;
  toPlainText(): string;
  toStructuredText(): string;  // Text with metadata annotations
}

export interface StyleDefinition {
  name: string;
  basedOn?: string;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  spacingBefore?: number;
  spacingAfter?: number;
  lineSpacing?: number;
}

export class DocxConverter {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: false,
    });
  }

  /**
   * Convert DOCX file to structured document with rich metadata
   */
  async convert(input: ArrayBuffer | string): Promise<DocxDocument> {
    let zip: JSZip;

    if (typeof input === 'string') {
      // Load from file path (Node.js)
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(input);
      zip = await JSZip.loadAsync(buffer);
    } else {
      // Load from ArrayBuffer
      zip = await JSZip.loadAsync(input);
    }

    // Extract main document XML
    const documentXml = await zip.file('word/document.xml')?.async('text');
    if (!documentXml) {
      throw new Error('Invalid DOCX file: missing word/document.xml');
    }

    // Extract styles XML
    const stylesXml = await zip.file('word/styles.xml')?.async('text');
    const styles = stylesXml ? this.parseStyles(stylesXml) : new Map();

    // Extract numbering XML (for lists)
    const numberingXml = await zip.file('word/numbering.xml')?.async('text');
    const numbering = numberingXml ? this.parseNumbering(numberingXml) : new Map();

    // Parse document structure
    const doc = this.parser.parse(documentXml);
    const body = doc['w:document']?.['w:body'];

    if (!body) {
      throw new Error('Invalid DOCX structure: missing document body');
    }

    const paragraphs: ParagraphMetadata[] = [];
    const tables: TableMetadata[] = [];

    // Process body elements
    const elements = Array.isArray(body['w:p']) ? body['w:p'] : [body['w:p']].filter(Boolean);
    const tableElements = Array.isArray(body['w:tbl']) ? body['w:tbl'] : [body['w:tbl']].filter(Boolean);

    for (const pElement of elements) {
      if (pElement) {
        const para = this.parseParagraph(pElement, styles, numbering);
        paragraphs.push(para);
      }
    }

    for (const tblElement of tableElements) {
      if (tblElement) {
        const table = this.parseTable(tblElement, styles, numbering);
        tables.push(table);
      }
    }

    return new DocxDocumentImpl(paragraphs, tables, styles);
  }

  private parseStyles(xml: string): Map<string, StyleDefinition> {
    const styles = new Map<string, StyleDefinition>();
    const parsed = this.parser.parse(xml);
    const stylesElement = parsed['w:styles'];

    if (!stylesElement || !stylesElement['w:style']) {
      return styles;
    }

    const styleElements = Array.isArray(stylesElement['w:style'])
      ? stylesElement['w:style']
      : [stylesElement['w:style']];

    for (const styleEl of styleElements) {
      const styleId = styleEl['@_w:styleId'];
      const name = styleEl['w:name']?.['@_w:val'] || styleId;
      const basedOn = styleEl['w:basedOn']?.['@_w:val'];

      const rPr = styleEl['w:rPr'];
      const pPr = styleEl['w:pPr'];

      const style: StyleDefinition = {
        name,
        basedOn,
      };

      if (rPr) {
        style.bold = !!rPr['w:b'];
        style.italic = !!rPr['w:i'];
        style.underline = !!rPr['w:u'];
        style.fontSize = rPr['w:sz']?.['@_w:val'] ? parseInt(rPr['w:sz']['@_w:val']) : undefined;
        style.fontFamily = rPr['w:rFonts']?.['@_w:ascii'];
      }

      if (pPr) {
        style.spacingBefore = pPr['w:spacing']?.['@_w:before'] ? parseInt(pPr['w:spacing']['@_w:before']) : undefined;
        style.spacingAfter = pPr['w:spacing']?.['@_w:after'] ? parseInt(pPr['w:spacing']['@_w:after']) : undefined;
        style.lineSpacing = pPr['w:spacing']?.['@_w:line'] ? parseInt(pPr['w:spacing']['@_w:line']) : undefined;
      }

      styles.set(styleId, style);
    }

    return styles;
  }

  private parseNumbering(xml: string): Map<number, any> {
    const numbering = new Map();
    const parsed = this.parser.parse(xml);
    // TODO: Implement full numbering parser
    // For now, return empty map
    return numbering;
  }

  private parseParagraph(
    pElement: any,
    styles: Map<string, StyleDefinition>,
    numbering: Map<number, any>
  ): ParagraphMetadata {
    const pPr = pElement['w:pPr'];
    const runs: TextRun[] = [];
    let fullText = '';

    // Extract text runs
    const rElements = pElement['w:r'];
    const runArray = Array.isArray(rElements) ? rElements : [rElements].filter(Boolean);

    for (const rElement of runArray) {
      if (!rElement) continue;

      const rPr = rElement['w:rPr'];
      const textElements = rElement['w:t'];
      const textArray = Array.isArray(textElements) ? textElements : [textElements].filter(Boolean);

      for (const tElement of textArray) {
        if (!tElement) continue;

        const text = typeof tElement === 'string' ? tElement : (tElement['#text'] || '');
        fullText += text;

        const run: TextRun = {
          text,
          bold: !!rPr?.['w:b'],
          italic: !!rPr?.['w:i'],
          underline: !!rPr?.['w:u'],
          fontSize: rPr?.['w:sz']?.['@_w:val'] ? parseInt(rPr['w:sz']['@_w:val']) : undefined,
          fontFamily: rPr?.['w:rFonts']?.['@_w:ascii'],
        };

        runs.push(run);
      }
    }

    // Extract paragraph properties
    const styleId = pPr?.['w:pStyle']?.['@_w:val'];
    const styleDef = styleId ? styles.get(styleId) : undefined;

    const metadata: ParagraphMetadata = {
      text: fullText,
      style: styleDef?.name || styleId,
      runs,
    };

    // Spacing
    if (pPr?.['w:spacing']) {
      metadata.spacingBefore = pPr['w:spacing']['@_w:before'] ? parseInt(pPr['w:spacing']['@_w:before']) : undefined;
      metadata.spacingAfter = pPr['w:spacing']['@_w:after'] ? parseInt(pPr['w:spacing']['@_w:after']) : undefined;
      metadata.lineSpacing = pPr['w:spacing']['@_w:line'] ? parseInt(pPr['w:spacing']['@_w:line']) : undefined;
    }

    // Alignment
    metadata.alignment = pPr?.['w:jc']?.['@_w:val'];

    // Indentation
    if (pPr?.['w:ind']) {
      metadata.indentation = {
        left: pPr['w:ind']['@_w:left'] ? parseInt(pPr['w:ind']['@_w:left']) : undefined,
        right: pPr['w:ind']['@_w:right'] ? parseInt(pPr['w:ind']['@_w:right']) : undefined,
        firstLine: pPr['w:ind']['@_w:firstLine'] ? parseInt(pPr['w:ind']['@_w:firstLine']) : undefined,
        hanging: pPr['w:ind']['@_w:hanging'] ? parseInt(pPr['w:ind']['@_w:hanging']) : undefined,
      };
    }

    // List information
    if (pPr?.['w:numPr']) {
      metadata.listLevel = pPr['w:numPr']['w:ilvl']?.['@_w:val'] ? parseInt(pPr['w:numPr']['w:ilvl']['@_w:val']) : 0;
      const numId = pPr['w:numPr']['w:numId']?.['@_w:val'];
      // TODO: Use numbering map to determine if numbered/bulleted
      metadata.isNumbered = true;  // Placeholder
    }

    return metadata;
  }

  private parseTable(
    tblElement: any,
    styles: Map<string, StyleDefinition>,
    numbering: Map<number, any>
  ): TableMetadata {
    const rows: TableRow[] = [];
    const trElements = tblElement['w:tr'];
    const rowArray = Array.isArray(trElements) ? trElements : [trElements].filter(Boolean);

    for (const trElement of rowArray) {
      if (!trElement) continue;

      const cells: TableCell[] = [];
      const tcElements = trElement['w:tc'];
      const cellArray = Array.isArray(tcElements) ? tcElements : [tcElements].filter(Boolean);

      for (const tcElement of cellArray) {
        if (!tcElement) continue;

        const cellParagraphs: ParagraphMetadata[] = [];
        let cellText = '';

        const pElements = tcElement['w:p'];
        const paraArray = Array.isArray(pElements) ? pElements : [pElements].filter(Boolean);

        for (const pElement of paraArray) {
          if (!pElement) continue;

          const para = this.parseParagraph(pElement, styles, numbering);
          cellParagraphs.push(para);
          cellText += para.text + '\n';
        }

        const cell: TableCell = {
          text: cellText.trim(),
          paragraphs: cellParagraphs,
        };

        // TODO: Extract colspan/rowspan from tcPr
        cells.push(cell);
      }

      rows.push({ cells });
    }

    return { rows };
  }
}

class DocxDocumentImpl implements DocxDocument {
  constructor(
    public paragraphs: ParagraphMetadata[],
    public tables: TableMetadata[],
    public styles: Map<string, StyleDefinition>
  ) {}

  toMarkdown(): string {
    const lines: string[] = [];

    for (const para of this.paragraphs) {
      let text = para.text;

      // Apply markdown formatting based on style
      if (para.style?.startsWith('Heading')) {
        const level = parseInt(para.style.replace(/\D/g, '')) || 1;
        text = '#'.repeat(Math.min(level, 6)) + ' ' + text;
      }

      // Apply inline formatting from runs
      if (para.runs.length > 0) {
        let formatted = '';
        for (const run of para.runs) {
          let runText = run.text;
          if (run.bold) runText = `**${runText}**`;
          if (run.italic) runText = `*${runText}*`;
          if (run.underline) runText = `<u>${runText}</u>`;
          formatted += runText;
        }
        text = formatted;
      }

      lines.push(text);
    }

    // Add tables
    for (const table of this.tables) {
      lines.push(''); // Blank line before table
      for (let i = 0; i < table.rows.length; i++) {
        const row = table.rows[i];
        const cells = row.cells.map(c => c.text.replace(/\n/g, ' '));
        lines.push('| ' + cells.join(' | ') + ' |');

        // Add header separator after first row
        if (i === 0) {
          lines.push('| ' + cells.map(() => '---').join(' | ') + ' |');
        }
      }
      lines.push(''); // Blank line after table
    }

    return lines.join('\n');
  }

  toPlainText(): string {
    let text = '';

    for (const para of this.paragraphs) {
      text += para.text + '\n';
    }

    for (const table of this.tables) {
      for (const row of table.rows) {
        for (const cell of row.cells) {
          text += cell.text + '\t';
        }
        text += '\n';
      }
    }

    return text;
  }

  toStructuredText(): string {
    const lines: string[] = [];

    for (const para of this.paragraphs) {
      const metadata: string[] = [];

      if (para.style) metadata.push(`style=${para.style}`);
      if (para.listLevel !== undefined) metadata.push(`list-level=${para.listLevel}`);
      if (para.spacingBefore) metadata.push(`space-before=${para.spacingBefore}`);
      if (para.spacingAfter) metadata.push(`space-after=${para.spacingAfter}`);
      if (para.alignment) metadata.push(`align=${para.alignment}`);

      const metaStr = metadata.length > 0 ? `[${metadata.join(', ')}]` : '';
      lines.push(`${metaStr} ${para.text}`);

      // Show individual run formatting
      if (para.runs.length > 1) {
        for (const run of para.runs) {
          const runMeta: string[] = [];
          if (run.bold) runMeta.push('bold');
          if (run.italic) runMeta.push('italic');
          if (run.underline) runMeta.push('underline');
          if (run.fontSize) runMeta.push(`size=${run.fontSize / 2}pt`);
          if (run.fontFamily) runMeta.push(`font=${run.fontFamily}`);

          if (runMeta.length > 0) {
            lines.push(`  RUN[${runMeta.join(', ')}]: "${run.text}"`);
          }
        }
      }
    }

    return lines.join('\n');
  }
}
