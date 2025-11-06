import { FormattingRule } from "./smarts.js";

export const rules = [
  new FormattingRule(
    "Abstract Length and Content",
    "Verify that the abstract is between 150 and 250 words. It must not contain undefined abbreviations or unspecified references. Detect section heading 'Abstract' and count word length while checking for abbreviations that are not defined elsewhere in the document.",
  ),

  new FormattingRule(
    "Reference Citation Style",
    "Ensure that all in-text citations use numbers enclosed in square brackets (e.g., [1], [2-4]) and that the reference list is numbered consecutively. Cross-check that every cited number appears in the reference list and that DOIs, when available, are provided as full links.",
  ),

  new FormattingRule(
    "Some Bold Text Required", 
    "Make sure that at least some text in the document is bold."
  ),

  new FormattingRule(
    "Keywords Check",
    "Verify that 4 to 6 keywords, suitable for indexing, are included and placed immediately after the abstract."
  ), // Guideline 20

  new FormattingRule(
      "Headings Levels Check",
      "Ensure the manuscript uses a maximum of three levels of headings to organize the structure."
  ), // Guideline 21

  new FormattingRule(
      "Manuscript Structure Check",
      "Confirm the manuscript structure adheres to the required logical organization: Introduction, Methods, Results, Discussion, and Conclusion sections."
  ), // Guideline 22

  new FormattingRule(
      "Abbreviations Consistency Check",
      "Examine if all abbreviations are defined at their first occurrence and if their usage is consistently maintained thereafter."
  ), // Guideline 23

  // unapplicable since only access to the .docx file
  // new FormattingRule(
  //     "Figure File Submission Check",
  //     "Verify that figures are submitted as separate files and named sequentially using the specified format (e.g., “Fig1.eps,” “Fig2.tif”)."
  // ), // Guideline 24

  // might not be verifiable 
  new FormattingRule(
      "Figure Format & Resolution Check (Vector/Halftone)",
      "Confirm that vector graphics use the EPS format (with embedded fonts) and halftone images use the TIFF format (minimum resolution of 300 dpi)."
  ), // Guideline 25

  new FormattingRule(
      "Figure Resolution Check (Line/Combination)",
      "Ensure the minimum resolution is 1200 dpi for line drawings and 600 dpi for combination artwork."
  ), // Guideline 26

  new FormattingRule(
      "Figure Numbering and Citation Check",
      "Verify that figures are numbered consecutively with Arabic numerals and are cited in the text in correct numerical order."
  ), // Guideline 27

  new FormattingRule(
      "Figure Content Exclusion Check",
      "Confirm that no titles or captions are included inside the figure image files themselves."
  ), // Guideline 28

  new FormattingRule(
      "Figure Lettering Check",
      "Control that figure lettering uses Helvetica or Arial (sans-serif) in an 8–12 pt size, and that this style is consistent across all figures."
  ), // Guideline 29

  new FormattingRule(
      "Figure Line Width Check",
      "Ensure that the width of all lines in figures is at least 0.1 mm (0.3 pt) and remains readable at the final print size."
  ), // Guideline 30

  new FormattingRule(
      "Color Figure Readability Check",
      "If color figures are used, ensure they remain clearly readable and interpretable when converted to grayscale (black and white print)."
  ), // Guideline 31

  new FormattingRule(
      "Figure Caption Start Format Check",
      "Verify that each caption starts with 'Fig.' in bold, followed immediately by the figure number (also bold), with no punctuation after the number."
  ), // Guideline 32

  new FormattingRule(
      "Figure Caption Content Check",
      "Confirm that the figure caption includes explanations for all abbreviations and symbols used within the figure image."
  ), // Guideline 33

  new FormattingRule(
      "Figure Caption Placement Check",
      "Ensure that figure captions are placed within the main manuscript text file and not stored within the figure image files."
  ), // Guideline 34

  new FormattingRule(
      "Table Numbering and Citation Check",
      "Verify that all tables are numbered consecutively using Arabic numerals and are cited in the text in their correct numerical order."
  ), // Guideline 35

  new FormattingRule(
      "Table Creation Method Check",
      "Confirm that tables were created using the word processor’s table function (e.g., Microsoft Word) rather than being inserted as spreadsheet objects."
  ), // Guideline 36

  new FormattingRule(
      "Table Caption/Title Check",
      "Ensure that a short, descriptive caption or title is provided and placed immediately above each table."
  ), // Guideline 37

  new FormattingRule(
      "Table Footnotes/Significance Check",
      "Verify the correct use of superscript lowercase letters for table footnotes and/or asterisks for indicating significance values."
  ), // Guideline 38
];
