import { FormattingRule } from "./smarts.js";

// Pediatric Journal Formatting Rules
export const generalRules = [

  // Initial rules of the prototype
  new FormattingRule(
    "Figure Caption Formatting",
    "Each figure caption must begin with the term 'Fig.' in bold type, followed by the figure number (also bold). There should be no punctuation after the number or at the end of the caption. Verify figure captions follow this format and correspond to figures cited in the text sequentially (e.g., Fig. 1, Fig. 2, etc.).",
  ),

  new FormattingRule(
    "Reference Citation Style",
    "Ensure that all in-text citations use numbers enclosed in square brackets (e.g., [1], [2-4]) and that the reference list is numbered consecutively. Cross-check that every cited number appears in the reference list and that DOIs, when available, are provided as full links.",
  ),

  // --- Generat Manuscript Formatting Rules ---
  new FormattingRule(
    "File Format",
    "Manuscripts must be submitted in Microsoft Word (.docx) format.",
  ),
  new FormattingRule(
    "Font Style and Size",
    "Use a normal, plain font such as 10-point Times New Roman for all text.",
  ),
  new FormattingRule(
    "Emphasis Style",
    "Use italics for emphasis; do not use bold or underlining for emphasis. Check for misuse of bold/underline for emphasis in the main text.",
  ),
  new FormattingRule(
    "Page Numbering",
    "Use the automatic page numbering function rather than adding numbers manually. Verify that page numbers are generated automatically.",
  ),
  new FormattingRule(
    "Field Functions",
    "Do not use field functions in the document (e.g., linked fields, auto-text fields).",
  ),
  new FormattingRule(
    "Indentation Method",
    "Use tab stops or paragraph commands for indents, never the space bar. Check for multiple consecutive spaces at the beginning of paragraphs.",
  ),
  new FormattingRule(
    "Mathematical Expressions",
    "Use the built-in equation editor or MathType for mathematical expressions. Check for improperly formatted or image-based equations.",
  ),
  new FormattingRule(
    "Allowed File Extensions",
    "Save the manuscript as a **.docx (Word 2007+) or .doc (older Word)** file. Verify the submitted file matches one of these extensions.",
  ),
  new FormattingRule(
    "Unit System",
    "Use only SI (Système International) units for all measurements and symbols. Flag non-SI units (e.g., Fahrenheit, pounds).",
  ),
  new FormattingRule(
    "Line Spacing and Word Count Approximation",
    "Type text double-spaced. This is a visual check; approximately 250 words per double-spaced page can be used as a rough length estimate.",
  ),

  // --- Title Page Formatting Rules ---
  new FormattingRule(
    "Title Content",
    "Include a concise and informative title on the title page.",
  ),
  new FormattingRule(
    "Author and Affiliation Details",
    "Provide full author names, institutional affiliations (department, city, country), and the corresponding author’s email address.",
  ),
  new FormattingRule(
    "ORCID Identifier",
    "Include each author’s ORCID identifier if available. Check for the presence of a properly formatted ORCID for each author.",
  ),
  new FormattingRule(
    "Clinical Trial Registration",
    "Add any clinical trial registration number and date of registration when applicable.",
  ),
  new FormattingRule(
    "Declarations (Title Page)",
    "Declare competing interests and funding sources on the title page.",
  ),
  new FormattingRule(
    "Acknowledgments Placement",
    "Place acknowledgments and funding information only on the title page, not in the manuscript body. Check the manuscript body for misplaced acknowledgments.",
  ),
  new FormattingRule(
    "Double-Blind Review Setup",
    "For double-blind review, submit a separate title page and remove all identifying information from the manuscript text and figures. (This is usually a manual check/user instruction).",
  )

  
];
