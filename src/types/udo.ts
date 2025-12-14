export interface UDO {
    // Metadata
    metadata: {
        fileName: string;
        createdDate?: Date;
        modifiedDate?: Date;
        author?: string;
        pageCount?: number;
        wordCount?: number;
        characterCount?: number;
        articleType?: string; // ORIGINAL ARTICLE, PICTORIAL ESSAY, REVIEW, CASE REPORT, etc.
    };

    // Structured Content
    content: {
        title: string;
        abstract: string;
        keywords: string[];
        sections: Section[];
    };

    // Extracted Entities
    entities: {
        citations: Citation[];
        figures: Figure[];
        tables: Table[];
        references: Reference[];
        abbreviations: Abbreviation[];
    };

    // Document Elements (for granular analysis)
    elements: {
        paragraphs: Paragraph[];
        headings: Heading[];
    };

    // Raw Access
    rawText: string;
    rawHTML: string; // from mammoth
}

export interface Section {
    heading: string;
    level: number;
    content: string;
    startParagraphIndex: number;
    endParagraphIndex: number;
}

export interface Paragraph {
    text: string;
    style?: string; // e.g., "Heading 1", "Normal"
    listType?: string; // e.g., "bullet", "ordered"
    isBold?: boolean;
    isItalic?: boolean;
}

export interface Heading {
    text: string;
    level: number;
    paragraphIndex: number;
}

export interface Citation {
    text: string;
    pattern: string; // e.g., "[1]", "(Smith 2023)"
    index: number; // position in rawText
    context: string; // surrounding text
}

export interface Figure {
    number: string; // "1", "2"
    caption: string; // "Fig. 1: Analysis results..."
    resolution?: number; // DPI
}

export interface Table {
    number: string;
    caption: string;
    rowCount: number;
    colCount: number;
}

export interface Reference {
    number: string;
    text: string; // Full reference text
    parsed?: {
        authors: string[];
        year?: string;
        title?: string;
        journal?: string;
        volume?: string;
        doi?: string;
    };
}

export interface Abbreviation {
    shortForm: string; // "MRI"
    longForm: string; // "Magnetic Resonance Imaging"
    firstUseIndex: number; // position in rawText
    firstDefinedOnUse: boolean; // Was it defined when first used?
}
