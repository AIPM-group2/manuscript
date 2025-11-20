/**
 * Maps guideline numbers (from DATA.md) to rule names (from general_rules.ts)
 * This allows test cases to reference guidelines by number and find the corresponding rule
 */
export const guidelineToRuleMap: Record<number, string> = {
  1: "File Format",
  2: "Font Style and Size",
  3: "Emphasis Style",
  4: "Page Numbering",
  5: "Field Functions",
  6: "Indentation Method",
  7: "Mathematical Expressions",
  8: "Allowed File Extensions",
  9: "Unit System",
  10: "Line Spacing and Word Count Approximation",
  11: "Title Content",
  12: "Author and Affiliation Details",
  13: "ORCID Identifier",
  14: "Clinical Trial Registration",
  15: "Declarations (Title Page)",
  16: "Acknowledgments Placement",
  17: "Double-Blind Review Setup",
  18: "Keywords Check",
  19: "Headings Levels Check",
  20: "Manuscript Structure Check",
  21: "Abbreviations Consistency Check",
  22: "Figure File Submission Check",
  23: "Figure Format & Resolution Check (Vector/Halftone)",
  24: "Figure Resolution Check (Line/Combination)",
  25: "Figure Numbering and Citation Check",
  26: "Figure Content Exclusion Check",
  27: "Figure Lettering Check",
  28: "Figure Line Width Check",
  29: "Color Figure Readability Check",
  30: "Figure Caption Start Format Check",
  31: "Figure Caption Content Check",
  32: "Figure Caption Placement Check",
  33: "Table Numbering and Citation Check",
  34: "Table Creation Method Check",
  35: "Table Caption/Title Check",
  36: "Table Footnotes/Significance Check",
  37: "Table Prior Publication Acknowledgment",
  38: "References Numeric Style In-Text",
  39: "References Ordered Numerically",
  40: "References Include DOI Links",
  41: "References Journal Title Abbreviations",
  42: "References Specific Formats",
  43: "LaTeX Bibliography Style (If Applicable)",
  44: "Graphical Abstract Submission",
  45: "Graphical Abstract Template Compliance",
  46: "Graphical Abstract Color Accessibility",
  47: "Supplementary Formats Accepted",
  48: "Supplementary Size and Aspect Ratio",
  49: "Supplementary Naming and Citation",
  50: "Supplementary Captions Provided",
  51: "Accessibility Contrast Ratio",
  52: "Accessibility Non-Color Cues",
  53: "Figure Layout Column Width Compliance",
};

/**
 * Reverse mapping: rule name to guideline number
 */
export const ruleToGuidelineMap: Record<string, number> = Object.entries(
  guidelineToRuleMap
).reduce((acc, [guideline, ruleName]) => {
  acc[ruleName] = parseInt(guideline);
  return acc;
}, {} as Record<string, number>);
