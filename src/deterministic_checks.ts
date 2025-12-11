import { DOMParser } from "@xmldom/xmldom";
import * as xpath from "xpath";
import JSZip from "jszip";
import { AIAnalyser } from "./smarts.js";



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
export function checkFontStyleAndSize(
    documentXmlString: string,
    stylesXmlString: string
): DeterministicCheckResult {
    const READABLE_FONTS = ["Times New Roman", "Arial", "Helvetica", "Calibri", "Verdana"];
    const MIN_SIZE_HALF_POINTS = 20; // 10pt * 2
    const NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

    const parser = new DOMParser();
    const doc = parser.parseFromString(documentXmlString, "application/xml");
    const styles = parser.parseFromString(stylesXmlString, "application/xml");

    const IGNORED_STYLES = new Set([
        "Title", "Subtitle",
        "Heading1","Heading2","Heading3","Heading4","Heading5","Heading6","Heading7","Heading8","Heading9",
        "Caption","FigureCaption","TableCaption",
        "FootnoteText","EndnoteText",
        "Quote","BlockQuote",
        "Bibliography",
        "TOCHeading","TOC1","TOC2"
    ]);

    const paragraphs = Array.from(doc.getElementsByTagNameNS(NS_W, "p"));
    let violations: any[] = [];

    for (let p of paragraphs) {
        const pPr = p.getElementsByTagNameNS(NS_W, "pPr")[0];
        const styleId = pPr?.getElementsByTagNameNS(NS_W, "pStyle")[0]?.getAttributeNS(NS_W, "val") || "Normal";

        if (IGNORED_STYLES.has(styleId)) continue;

        const runs = Array.from(p.getElementsByTagNameNS(NS_W, "r"));
        for (let r of runs) {
            const rPr = r.getElementsByTagNameNS(NS_W, "rPr")[0];
            if (!rPr) continue;

            const fontNode = rPr.getElementsByTagNameNS(NS_W, "rFonts")[0];
            const szNode = rPr.getElementsByTagNameNS(NS_W, "sz")[0];
            const inlineFont = fontNode?.getAttribute("ascii") || null;
            const inlineSize = szNode ? parseInt(szNode.getAttribute("val") || "0") : null;

            if ((inlineFont && !READABLE_FONTS.includes(inlineFont)) ||
                (inlineSize && inlineSize < MIN_SIZE_HALF_POINTS)) {
                violations.push({ style: styleId, font: inlineFont, size: inlineSize });
            }
        }
    }

    if (violations.length > 0) {
        return {
            rule: "Font Style and Size (body text)",
            decision: false,
            justification: `Found ${violations.length} body-text violations (font not readable or <10pt).\n` +
                violations.slice(0, 5).map(v =>
                    `• Style: ${v.style}, font: ${v.font}, size: ${v.size}`
                ).join("\n") +
                (violations.length > 5 ? `\n…${violations.length - 5} more` : "")
        };
    }

    return {
        rule: "Font Style and Size (body text)",
        decision: true,
        justification: `All body text uses a readable font (${READABLE_FONTS.join(", ")}) and size ≥10pt.`
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
   * This function checks for Guideline 5
   * 
   * @param documentXmlString 
   * @returns 
   */
  export function checkFieldFunctions(documentXmlString: string): DeterministicCheckResult {
   // Namespaces
    const NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

    // Parse document XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(documentXmlString, "application/xml");

    // Search for <w:fldSimple> or <w:instrText> anywhere in the document
    const fldSimple = doc.getElementsByTagNameNS(NS_W, "fldSimple");
    const instrText = doc.getElementsByTagNameNS(NS_W, "instrText");

    const hasFields = fldSimple.length > 0 || instrText.length > 0;

    if (hasFields) {
        return {
            rule: "Field Functions",
            decision: false,
            justification: `Document contains field functions: <w:fldSimple> (${fldSimple.length}) or <w:instrText> (${instrText.length}).`,
        };
    } else {
        return {
            rule: "Field Functions",
            decision: true,
            justification: "No field functions detected in the document.",
        };
    }
}

/**
 * This checks for Guideline 6 — Indentation Method
 * 
 * @param xmlFiles 
 * @param aiAnalyser 
 * @returns 
 */
export async function checkIndentationMethodWithAI(
  xmlFiles: Record<string, string>,
  aiAnalyser: AIAnalyser
): Promise<DeterministicCheckResult> {
  const NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const parser = new DOMParser();
  const documentXml = xmlFiles["word/document.xml"];
  if (!documentXml) {
    return {
      rule: "Indentation Method",
      decision: false,
      justification: "Document XML not found."
    };
  }

  const doc = parser.parseFromString(documentXml, "application/xml");
  const paragraphs = Array.from(doc.getElementsByTagNameNS(NS_W, "p"));

  const violations: { paragraphIndex: number; textStart: string; hasIndent: boolean }[] = [];

  paragraphs.forEach((p, i) => {
    const pPr = p.getElementsByTagNameNS(NS_W, "pPr")[0];
    const ind = pPr?.getElementsByTagNameNS(NS_W, "ind")[0];
    const hasIndent = !!ind;

    const firstRun = p.getElementsByTagNameNS(NS_W, "r")[0];
    const textNode = firstRun?.getElementsByTagNameNS(NS_W, "t")[0];
    const textStart = textNode?.textContent?.slice(0, 10) || "";

    const leadingSpaces = textStart.match(/^ +/)?.[0]?.length || 0;

    if (!hasIndent && leadingSpaces >= 2) {
      violations.push({ paragraphIndex: i + 1, textStart, hasIndent });
    }
  });

  const summary = violations.length > 0
    ? `Detected ${violations.length} paragraphs potentially using spaces instead of indentation:\n` +
      violations.map(v => `Paragraph ${v.paragraphIndex}: starts with "${v.textStart}"`).join("\n")
    : "No obvious violations detected from XML. Paragraphs seem properly indented.";

  const prompt = `
You are a manuscript formatting AI.
The goal is to check compliance with the following rule:

"Use tab stops or paragraph commands for indents, never the space bar. Check for multiple consecutive spaces at the beginning of paragraphs."

Here is the deterministic analysis from the DOCX XML:
${summary}

Based on this information, decide:
1. Should the rule be considered respected?
2. Provide a concise justification.

Output strictly JSON.
Do NOT output explanations, markdown, code fences, comments, backticks or text outside the JSON.
{
"decision": true/false,
"justification": "explanation"
}
`.trim();

  let aiResponse: string;
  let parsed: any;

  try {
    aiResponse = await aiAnalyser.analyze(prompt);
    const cleaned = aiResponse.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    return {
      rule: "Indentation Method",
      decision: false,
      justification: "Failed to parse AI response. Raw output: " + (aiResponse ?? "")
    };
  }

  // Extra safety: ensure parsed object has the expected keys
  if (!parsed || typeof parsed.decision !== "boolean" || typeof parsed.justification !== "string") {
    return {
      rule: "Indentation Method",
      decision: false,
      justification: "AI response could not be interpreted correctly. Raw output: " + aiResponse
    };
  }

  return {
    rule: "Indentation Method",
    decision: parsed.decision,
    justification: parsed.justification
  };
}

export function checkLineSpacingAndWordCount(
  documentXmlString: string,
  htmlContent: string
): DeterministicCheckResult {
  const NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const parser = new DOMParser();
  const doc = parser.parseFromString(documentXmlString, "application/xml");

  // 1. Check paragraph spacing in XML
  const paragraphs = Array.from(doc.getElementsByTagNameNS(NS_W, "p"));
  let nonDoubleSpacedCount = 0;

  for (const p of paragraphs) {
    const pPr = p.getElementsByTagNameNS(NS_W, "pPr")[0];
    if (!pPr) continue;

    const spacingNode = pPr.getElementsByTagNameNS(NS_W, "spacing")[0];
    if (spacingNode) {
      const lineVal = parseInt(spacingNode.getAttribute("w:line") || "0");
      const lineRule = spacingNode.getAttribute("w:lineRule") || "auto";
      // Word double spacing is roughly 480 half-points with "auto"
      if (lineVal > 0 && lineVal < 480) {
        nonDoubleSpacedCount++;
      }
    }
  }

  // 2. Approximate word count per double-spaced page from HTML
  const text = htmlContent.replace(/<[^>]+>/g, " "); // strip tags
  const words = text.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  const estimatedPages = totalWords / 250; // rough 250 words per double-spaced page

  // 3. Build justification
  const justificationParts = [];
  if (nonDoubleSpacedCount > 0) {
    justificationParts.push(
      `Found ${nonDoubleSpacedCount} paragraphs with line spacing < double-spaced.`
    );
  }
  justificationParts.push(
    `Total words: ${totalWords}, estimated pages: ${estimatedPages.toFixed(1)} (~250 words/page).`
  );

  const decision = nonDoubleSpacedCount === 0;

  return {
    rule: "Line Spacing and Word Count Approximation",
    decision,
    justification: justificationParts.join(" "),
  };
}

/**
 * Check Guideline 23 — Figure Format & Resolution (Vector/Halftone)
 * Deterministic check: inspects files in /word/media/
 * TIFF: checks resolution metadata (if accessible)
 * EPS: only checks file extension; embedded fonts cannot be fully verified deterministically
 *
 * @param docxArrayBuffer ArrayBuffer of the DOCX file
 * @returns DeterministicCheckResult
 */
export async function checkFigureFormatAndResolution(docxArrayBuffer: ArrayBuffer): Promise<DeterministicCheckResult> {
    const zip = await JSZip.loadAsync(docxArrayBuffer);
    const mediaFiles = Object.keys(zip.files).filter(f => f.startsWith("word/media/"));

    if (mediaFiles.length === 0) {
        return {
            rule: "Figure Format & Resolution",
            decision: true,
            justification: "No media files found in DOCX; nothing to check."
        };
    }

    const issues: string[] = [];

    for (const filename of mediaFiles) {
        const file = zip.files[filename];
        const extension = filename.split(".").pop()?.toLowerCase();

        if (!extension) continue;

        const fileData = await file.async("nodebuffer"); // works in Node
        if (extension === "tif" || extension === "tiff") {
            // Attempt to read TIFF metadata for resolution
            try {
                const tiff = require("tiff"); // optional: tiff parsing lib
                const tiffImage = new tiff.TIFF({ buffer: fileData });
                const xRes = tiffImage.xres;
                const yRes = tiffImage.yres;

                if (xRes < 300 || yRes < 300) {
                    issues.push(`${filename} (TIFF resolution ${xRes}x${yRes} dpi < 300 dpi)`);
                }
            } catch (e) {
                issues.push(`${filename} (TIFF resolution could not be read, manual check recommended)`);
            }
        } else if (extension === "eps") {
            // EPS: only extension can be checked deterministically
            // Embedded fonts require manual verification
        } else {
            issues.push(`${filename} (unsupported file format for this guideline)`);
        }
    }

    return {
        rule: "Figure Format & Resolution",
        decision: issues.length === 0,
        justification: issues.length === 0
            ? "All figures are in EPS or TIFF format. TIFF files have sufficient resolution or could not be determined."
            : `Issues detected:\n${issues.join("\n")}`
    };
}


 
/**
 * Run deterministic checks on a DOCX
 *
 * @param xmlFiles - Map of DOCX XML files (from /word/*.xml)
 * @param docxArrayBuffer - Full ArrayBuffer of the DOCX file
 */
export async function runDeterministicChecks(
  xmlFiles: Record<string, string>,
  docxArrayBuffer: ArrayBuffer,
  aiAnalyser: AIAnalyser
): Promise<DeterministicCheckResult[]> {
  const results: DeterministicCheckResult[] = [];

  const documentXml = xmlFiles["word/document.xml"];
  const stylesXml = xmlFiles["word/styles.xml"];
  if (documentXml && stylesXml) {
    results.push(checkFontStyleAndSize(documentXml, stylesXml));
    results.push(checkFieldFunctions(documentXml));
    results.push(checkLineSpacingAndWordCount(documentXml, xmlFiles["word/document.html"] || ""));

    // Run Indentation Method check via AI
    const indentationResult = await checkIndentationMethodWithAI(xmlFiles, aiAnalyser);
    results.push(indentationResult);
  }

  const headerFooterXmlStrings = Object.entries(xmlFiles)
    .filter(([name]) => name.startsWith("word/header") || name.startsWith("word/footer"))
    .map(([, content]) => content);
  if (headerFooterXmlStrings.length > 0) {
    results.push(checkPageNumbering(headerFooterXmlStrings));
  }

  // Add the new figure format & resolution check
  if (docxArrayBuffer) {
    const figureResult = await checkFigureFormatAndResolution(docxArrayBuffer);
    results.push(figureResult);
  }

  return results;
}