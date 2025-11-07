import { FormattingRule } from "../smarts.js";


/** List of formatting rules for research papers */
export const researchPapersRules = [
  // --- Abstract Formatting Rule ---
  new FormattingRule(
    "Abstract Length and Content",
    "Verify that the abstract is between 150 and 250 words. It must not contain undefined abbreviations or unspecified references. Detect section heading 'Abstract' and count word length while checking for abbreviations that are not defined elsewhere in the document. If the type of the paper is a methodology (A short explanation of a certain method or procedure, alteration of a method, or new equipment of interest to radiologists.) the abstract should be in paragraph form of less than 125 words.",
  ),
  new FormattingRule(
    "Abstract Structure Style",
    "Check if it uses a structured abstract in the following sections: Background, Objective, Materials and methods, Results and Conclusion."
  )

];
