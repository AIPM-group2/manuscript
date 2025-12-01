import { DOMParser } from "@xmldom/xmldom";
import * as xpath from "xpath";



export type DeterministicCheckResult = {
  rule: string;
  decision: boolean;
  justification: string;
};

/**
 * Check Guideline 2 — Font Style and Size
 * Only checks BODY TEXT (Normal paragraphs), not headings, titles, footnotes, etc.
 *
 * @param {string} documentXmlString
 * @param {string} stylesXmlString
 * @returns {{ isRespected: boolean, details: string }}
 */
export function checkFontStyleAndSize(documentXmlString: string, stylesXmlString: string): DeterministicCheckResult {
    const TARGET_FONT = "Times New Roman";
    const TARGET_SIZE_HALF_POINTS = "20"; // 10 pt * 2
    const NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

    const parser = new DOMParser();
    const doc = parser.parseFromString(documentXmlString, "application/xml");
    const styles = parser.parseFromString(stylesXmlString, "application/xml");

    // Styles that should be ignored for this rule
    const IGNORED_STYLES = new Set([
        "Title",
        "Subtitle",
        "Heading1", "Heading2", "Heading3", "Heading4", "Heading5", "Heading6", "Heading7", "Heading8", "Heading9",
        "Caption", "FigureCaption", "TableCaption",
        "FootnoteText", "EndnoteText",
        "Quote", "BlockQuote",
        "Bibliography",
        "TOCHeading", "TOC1", "TOC2"
    ]);

    // Get all paragraphs
    const paragraphs = Array.from(doc.getElementsByTagNameNS(NS_W, "p"));


    let violations = [];

    for (let p of paragraphs) {
        // 1. Get paragraph style (if any)
        const pPrList = Array.from(p.getElementsByTagNameNS(NS_W, "pPr"));
        const pPr = pPrList[0];
        let styleId = null;

        if (pPr) {
            const pStyleList = Array.from(pPr.getElementsByTagNameNS(NS_W, "pStyle"));
            const pStyle = pStyleList[0];
            styleId = pStyle?.getAttributeNS(NS_W, "val") || null;
        }

        // 2. Skip ignored styles (titles, headings, footnotes...)
        if (styleId && IGNORED_STYLES.has(styleId)) {
            continue;
        }

        // 3. For each run (<w:r>), check font + size overrides
        const runs = Array.from(p.getElementsByTagNameNS(NS_W, "r"));

        for (let r of runs) {
            const rPrList = Array.from(r.getElementsByTagNameNS(NS_W, "rPr"));
            const rPr = rPrList[0];
            if (!rPr) continue;

            const rFonts = Array.from(rPr.getElementsByTagNameNS(NS_W, "rFonts"))[0];
            const rSize = Array.from(rPr.getElementsByTagNameNS(NS_W, "sz"))[0];

            // Extract inline font override
            const inlineFont = rFonts?.getAttribute("ascii") || null;
            const inlineSize = rSize?.getAttribute("val") || null;

            if ((inlineFont && inlineFont !== TARGET_FONT) ||
                (inlineSize && inlineSize !== TARGET_SIZE_HALF_POINTS)) {
                violations.push({
                    paragraphStyle: styleId || "Normal",
                    inlineFont,
                    inlineSize
                });
            }
        }
    }

    // Check default Normal style in styles.xml
    const select = xpath.useNamespaces({ w: NS_W });
    const normalStyleNode = select("//w:style[@w:styleId='Normal']/w:rPr", styles)[0] as Element | undefined;
    
    if (normalStyleNode) {
        const normalStyleElement = normalStyleNode as Element;
        const fontNode = normalStyleElement.getElementsByTagNameNS(NS_W, "rFonts")[0];
        const sizeNode = normalStyleElement.getElementsByTagNameNS(NS_W, "sz")[0];

        const normalFont = fontNode?.getAttributeNS(NS_W, "ascii") || null;
        const normalSize = sizeNode?.getAttribute("val") || null;

        if (normalFont !== TARGET_FONT || normalSize !== TARGET_SIZE_HALF_POINTS) {
            return {
                rule: "Font Style and Size (body text)",
                decision: false,
                justification: `Normal style incorrect → font: ${normalFont}, size: ${normalSize} (expected ${TARGET_FONT}, 10pt)`
            };
        }
    }

    if (violations.length > 0) {
        return {
            rule: "Font Style and Size (body text)",
            decision: false,
            justification: `Found ${violations.length} body-text violations (wrong font or size).\n` +
                violations.slice(0, 5).map(v =>
                    `• Style: ${v.paragraphStyle}, font override: ${v.inlineFont}, size override: ${v.inlineSize}`
                ).join("\n") +
                (violations.length > 5 ? `\n…${violations.length - 5} more` : "")
        };
    }

    return {
        rule: "Font Style and Size (body text)",
        decision: true,
        justification: "All body text (Normal paragraphs) uses Times New Roman 10pt with no overrides."
    };
}



  /**
   * This function checks for Guideline 4
   * 
 * @param {string[]} headerFooterXmlStrings - Array of XML content from word/header*.xml and word/footer*.xml
 * @returns {object} - { isRespected: boolean, details: string }
 */
export function checkPageNumbering(headerFooterXmlStrings: string[]): DeterministicCheckResult {
    const NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const parser = new DOMParser();
  
    for (const xmlString of headerFooterXmlStrings) {
      if (!xmlString) continue;
  
      const doc = parser.parseFromString(xmlString, "application/xml");
  
      // XPath: Search for the field instruction text that contains "PAGE" (the automatic page number field).
      const select = xpath.useNamespaces({ w: NS_W });
      const pageField = select(`//w:instrText[contains(., 'PAGE')]`, doc)[0] as Element | undefined;

  
      if (pageField) {
        // Automatic page numbering field found in this header/footer.
        return {
          rule: "Page Numbering",
          decision: true,
          justification: "Automatic page numbering field (PAGE) was detected in a header or footer.",
        };
      }
    }
  
    // If the loop finishes without finding the field
    return {
      rule: "Page Numbering",
      decision: false,
      justification: "The automatic page numbering field (PAGE) was not found in any header or footer XML. Page numbers are likely missing or manually added.",
    };
  }


  /**
   * This function checks for Guideline 26
   * 
   * @param documentXmlString 
   * @returns {{ isRespected: boolean, details: string }}
   */
  export function checkFigureContentExclusion(documentXmlString: string): DeterministicCheckResult {
    const NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const parser = new DOMParser();
    const doc = parser.parseFromString(documentXmlString, "application/xml");

    // Get all drawing elements in the document
    const drawings = Array.from(doc.getElementsByTagNameNS(NS_W, "drawing"));

    let violations = 0;

    for (const drawing of drawings) {
        // Check if there is any text element inside the drawing
        const texts = Array.from(drawing.getElementsByTagNameNS(NS_W, "t"));
        if (texts.length > 0) {
            violations++;
        }
    }

    if (violations > 0) {
        return {
            rule: "Figure Content Exclusion Check",
            decision: false,
            justification: `Found ${violations} figure(s) containing text inside <w:drawing> elements. Captions should be separate paragraphs.`
        };
    }

    return {
        rule: "Figure Content Exclusion Check",
        decision: true,
        justification: "All figures are free of embedded captions; text is in separate paragraphs as expected."
    };
}

  /**
   * This function checks for Guideline 27
   */
  export function checkFigureLettering(documentXmlString: string) {
    const NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const parser = new DOMParser();
    const doc = parser.parseFromString(documentXmlString, "application/xml");

    // Get all drawings (figures)
    const drawings = Array.from(doc.getElementsByTagNameNS(NS_W, "drawing"));
    const picts = Array.from(doc.getElementsByTagNameNS(NS_W, "pict"));

    let issues = 0;

    // Check for text inside drawings or picts
    for (const elem of [...drawings, ...picts]) {
        const texts = Array.from(elem.getElementsByTagNameNS(NS_W, "t"));
        if (texts.length > 0) {
            issues++;
        }
    }

    if (issues === 0) {
        return {
            rule: "Figure Lettering Check",
            decision: true,
            justification: "No figure text found in XML; font compliance cannot be determined deterministically."
        };
    } else {
        return {
            rule: "Figure Lettering Check",
            decision: false,
            justification: `Detected ${issues} figure(s) with embedded text. Font type and size cannot be verified deterministically. Manual check required.`
        };
    }
}
 
export function runDeterministicChecks(xmlFiles: Record<string, string>): DeterministicCheckResult[] {
  const results: DeterministicCheckResult[] = [];

  const documentXml = xmlFiles["word/document.xml"];
  const stylesXml = xmlFiles["word/styles.xml"];
  if (documentXml && stylesXml) {
    results.push(checkFontStyleAndSize(documentXml, stylesXml));
    results.push(checkFigureContentExclusion(documentXml))
    results.push(checkFigureLettering(documentXml));
  }

  const headerFooterXmlStrings = Object.entries(xmlFiles)
    .filter(([name]) => name.startsWith("word/header") || name.startsWith("word/footer"))
    .map(([, content]) => content);
  if (headerFooterXmlStrings.length > 0) {
    results.push(checkPageNumbering(headerFooterXmlStrings));
  }

  return results;
}