import { FormattingRule } from "./smarts.js";

// Pediatric Journal Formatting Rules
export const generalRules = [

  // --- General Manuscript Formatting Rules ---
  new FormattingRule(
    "File Format",
    "Manuscripts must be submitted in Microsoft Word (.docx) format.",
    false
  ), // Guideline 1

  new FormattingRule(
    "Font Style and Size",
    "Use a normal, plain font such as 10-point Times New Roman for all text.",
    false
  ), // Guideline 2

  new FormattingRule(
    "Emphasis Style",
    "Use italics for emphasis; do not use bold or underlining for emphasis. Check for misuse of bold/underline for emphasis in the main text.",
  ), // Guideline 3

  new FormattingRule(
    "Page Numbering",
    "Use the automatic page numbering function rather than adding numbers manually. Verify that page numbers are generated automatically.",
    false
  ), // Guideline 4

  // TODO check existence and relevance of this rule
  new FormattingRule(
    "Field Functions",
    "Do not use field functions in the document (e.g., linked fields, auto-text fields).",
  ), // Guideline 5

  new FormattingRule(
    "Indentation Method",
    "Use tab stops or paragraph commands for indents, never the space bar. Check for multiple consecutive spaces at the beginning of paragraphs.",
  ), // Guideline 6

  new FormattingRule(
    "Mathematical Expressions",
    "Use the built-in equation editor or MathType for mathematical expressions. Check for improperly formatted or image-based equations.",
  ), // Guideline 7

  new FormattingRule(
    "Allowed File Extensions",
    "Save the manuscript as a **.docx (Word 2007+) or .doc (older Word)** file. Verify the submitted file matches one of these extensions.",
  ), // Guideline 8

  new FormattingRule(
    "Unit System",
    "Use only SI (Système International) units for all measurements and symbols. Flag non-SI units (e.g., Fahrenheit, pounds).",
  ), // Guideline 9

  new FormattingRule(
    "Line Spacing and Word Count Approximation",
    "Type text double-spaced. This is a visual check; approximately 250 words per double-spaced page can be used as a rough length estimate.",
  ), // Guideline 10

  // --- Title Page Formatting Rules ---
  new FormattingRule(
    "Title Content",
    "Include a concise and informative title on the title page.",
  ), // Guideline 11

  new FormattingRule(
    "Author and Affiliation Details",
    "Provide full author names, institutional affiliations (department, city, country), and the corresponding author’s email address.",
  ), // Guideline 12

  new FormattingRule(
    "ORCID Identifier",
    "Include each author’s ORCID identifier if available. Check for the presence of a properly formatted ORCID for each author.",
  ), // Guideline 13

  new FormattingRule(
    "Clinical Trial Registration",
    "Add any clinical trial registration number and date of registration when applicable.",
  ), // Guideline 14

  new FormattingRule(
    "Declarations (Title Page)",
    "Declare competing interests and funding sources on the title page.",
  ), // Guideline 15

  new FormattingRule(
    "Acknowledgments Placement",
    "Place acknowledgments and funding information only on the title page, not in the manuscript body. Check the manuscript body for misplaced acknowledgments.",
  ), // Guideline 16

  new FormattingRule(
    "Double-Blind Review Setup",
    "For double-blind review, submit a separate title page and remove all identifying information from the manuscript text and figures. (This is usually a manual check/user instruction).",
  ), // Guideline 17

  // --- Keywords Formatting Rules ---
  new FormattingRule(
    "Keywords Check",
    "Verify that 4 to 6 keywords, suitable for indexing, are included and placed immediately after the abstract."
  ), // Guideline 18

  // --- Headings Formatting Rules ---
  new FormattingRule(
      "Headings Levels Check",
      "Ensure the manuscript uses a maximum of three levels of headings to organize the structure."
  ), // Guideline 19

  // --- Headings and Structure Rules ---
  new FormattingRule(
      "Manuscript Structure Check",
      "Confirm the manuscript structure adheres to the required logical organization: Introduction, Methods, Results, Discussion, and Conclusion sections."
  ), // Guideline 20

  new FormattingRule(
      "Abbreviations Consistency Check",
      "Examine if all abbreviations are defined at their first occurrence and if their usage is consistently maintained thereafter."
  ), // Guideline 21

  // --- Figure Formatting Rules --- 
  // probably unapplicable since only access to the .docx file
  new FormattingRule(
      "Figure File Submission Check",
      "Verify that figures are submitted as separate files and named sequentially using the specified format (e.g., “Fig1.eps,” “Fig2.tif”)."
  ), // Guideline 22

  // might not be verifiable 
  new FormattingRule(
      "Figure Format & Resolution Check (Vector/Halftone)",
      "Confirm that vector graphics use the EPS format (with embedded fonts) and halftone images use the TIFF format (minimum resolution of 300 dpi)."
  ), // Guideline 23

  new FormattingRule(
      "Figure Resolution Check (Line/Combination)",
      "Ensure the minimum resolution is 1200 dpi for line drawings and 600 dpi for combination artwork."
  ), // Guideline 24

  new FormattingRule(
      "Figure Numbering and Citation Check",
      "Verify that figures are numbered consecutively with Arabic numerals and are cited in the text in correct numerical order."
  ), // Guideline 25

  new FormattingRule(
      "Figure Content Exclusion Check",
      "Confirm that no titles or captions are included inside the figure image files themselves.",
      false
  ), // Guideline 26

  new FormattingRule(
      "Figure Lettering Check",
      "Control that figure lettering uses Helvetica or Arial (sans-serif) in an 8–12 pt size, and that this style is consistent across all figures.",
      false
  ), // Guideline 27

  new FormattingRule(
      "Figure Line Width Check",
      "Ensure that the width of all lines in figures is at least 0.1 mm (0.3 pt) and remains readable at the final print size."
  ), // Guideline 28

  new FormattingRule(
      "Color Figure Readability Check",
      "If color figures are used, ensure they remain clearly readable and interpretable when converted to grayscale (black and white print)."
  ), // Guideline 29

  // --- Figure Captions Formatting Rules ---
  new FormattingRule(
      "Figure Caption Start Format Check",
      "Verify that each caption starts with 'Fig.' in bold, followed immediately by the figure number (also bold), with no punctuation after the number."
  ), // Guideline 30

  new FormattingRule(
      "Figure Caption Content Check",
      "Confirm that the figure caption includes explanations for all abbreviations and symbols used within the figure image."
  ), // Guideline 31

  new FormattingRule(
      "Figure Caption Placement Check",
      "Ensure that figure captions are placed within the main manuscript text file and not stored within the figure image files."
  ), // Guideline 32

  // --- Table Formatting Rules ---
  new FormattingRule(
      "Table Numbering and Citation Check",
      "Verify that all tables are numbered consecutively using Arabic numerals and are cited in the text in their correct numerical order."
  ), // Guideline 33

  new FormattingRule(
      "Table Creation Method Check",
      "Confirm that tables were created using the word processor’s table function (e.g., Microsoft Word) rather than being inserted as spreadsheet objects."
  ), // Guideline 34

  new FormattingRule(
      "Table Caption/Title Check",
      "Ensure that a short, descriptive caption or title is provided and placed immediately above each table."
  ), // Guideline 35

  new FormattingRule(
      "Table Footnotes/Significance Check",
      "Verify the correct use of superscript lowercase letters for table footnotes and/or asterisks for indicating significance values."
  ), // Guideline 36

  // ==============================
  new FormattingRule(
      "Table Prior Publication Acknowledgment",
      "If any table includes previously published data or adapted content, verify that the table caption acknowledges the original source using an appropriate reference citation (e.g., 'Adapted from [X]'). If such reuse is present without citation, mark as non-compliant.",
  ), // Guideline 37

  
  // References
  new FormattingRule(
      "References Numeric Style In-Text",
      "Check that in-text citations use numeric style with numbers in square brackets (e.g., [1], [2–4]) and no author–date patterns. Identify all bracketed citation patterns and flag deviations.",
  ), // Guideline 38

  new FormattingRule(
      "References Ordered Numerically",
      "Ensure the reference list is ordered numerically according to first appearance in the text. Cross-check that numbering matches citation order and that numbering is consecutive.",
  ), // Guideline 39

  new FormattingRule(
      "References Include DOI Links",
      "Verify that references include full DOI hyperlinks when available (https://doi.org/...). If a DOI is mentioned without a link, flag it; if no DOI appears to exist for a reference, explain that it may be acceptable.",
  ), // Guideline 40

  new FormattingRule(
      "References Journal Title Abbreviations",
      "Check that journal titles use standard abbreviations per ISSN LTWA. If uncertain, accept full journal titles but flag obviously non-standard abbreviations.",
  ), // Guideline 41

  new FormattingRule(
      "References Specific Formats",
      "Assess whether common reference types follow expected formats (journal article, book, book chapter, online document, dissertation). Tolerate minor punctuation variance but flag missing essential fields (authors, title, venue, year; publisher for books; editors for chapters; URL/DOI for online).",
  ), // Guideline 42

  new FormattingRule(
      "LaTeX Bibliography Style (If Applicable)",
      "If the manuscript is prepared in LaTeX (detected via TeX artifacts or mentions), ensure use of Springer 'sn-basic.bst' for the bibliography. If the manuscript is a Word/DOCX document, mark as not applicable and explain.",
  ), // Guideline 43

  
  // Graphical Abstract
  new FormattingRule(
      "Graphical Abstract Submission",
      "Verify that a graphical abstract is submitted as a single PowerPoint slide following the official Springer template. From manuscript text, look for mentions of 'Graphical abstract' and template compliance; if unverifiable from the DOCX, mark as requiring manual verification and explain.",
  ), // Guideline 44

  new FormattingRule(
      "Graphical Abstract Template Compliance",
      "Confirm that the graphical abstract follows the template's background, font, and layout instructions exactly. If the manuscript text includes a checklist or statement of compliance, accept; otherwise note that this typically requires manual inspection of the PPT file.",
  ), // Guideline 45

  new FormattingRule(
      "Graphical Abstract Color Accessibility",
      "Advise against color combinations problematic for color blindness (e.g., red/green, blue/black). If color usage is described, check for accessible palettes; otherwise note that verification may require visual inspection.",
  ), // Guideline 46

  
  // Supplementary Material
  new FormattingRule(
      "Supplementary Formats Accepted",
      "Confirm that listed supplementary materials are in accepted formats (.avi, .mp4, .mov, .wmv, .m4v, .pdf, .xlsx, .csv). If only referenced in text, verify stated extensions; if files are not available via DOCX, note that this requires manual file review.",
  ), // Guideline 47

  new FormattingRule(
      "Supplementary Size and Aspect Ratio",
      "Where file properties are stated, check that supplementary files do not exceed 2 GB and that videos target 16:9 or 4:3 aspect ratios. If properties are not stated and files are not attached, note that this is a manual verification item.",
  ), // Guideline 48

  new FormattingRule(
      "Supplementary Naming and Citation",
      "Ensure supplementary files are named consecutively and cited in text as 'Online Resource 1', 'Online Resource 2', etc., with consistent numbering and references in the manuscript.",
  ), // Guideline 49

  new FormattingRule(
      "Supplementary Captions Provided",
      "Verify that each supplementary item has a concise caption or legend describing content and purpose, either within a dedicated section or near the first in-text mention.",
  ), // Guideline 50

  
  // Accessibility & Layout
  new FormattingRule(
      "Accessibility Contrast Ratio",
      "Ensure that figure and text color combinations meet a contrast ratio of at least 4.5:1. If only document text is available, flag as requiring manual visual check and suggest using accessible palettes.",
  ), // Guideline 51

  new FormattingRule(
      "Accessibility Non-Color Cues",
      "Check that figures rely on patterns/textures or labels in addition to color to differentiate elements (e.g., line styles, hatch patterns). If not determinable from text alone, note manual verification is required.",
  ), // Guideline 52

  new FormattingRule(
      "Figure Layout Column Width Compliance",
      "For layouts targeting Springer formats, verify that figures are sized to fit standard column widths (approx. 84 mm for double-column or 174 mm for single-column). From DOCX text, look for explicit sizing notes; otherwise flag as a layout check for production stage.",
  ), // Guideline 53  
];
