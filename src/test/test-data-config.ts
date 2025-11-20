/**
 * Test data configuration
 * Defines which guidelines are broken in each article version based on data/DATA.md
 */

export interface ArticleTestCase {
  version: number;
  filename: string;
  extension: string;
  brokenGuidelines: number[];
  description: string;
}

/**
 * Test cases for each article version
 * Based on the modifications documented in data/DATA.md
 */
export const articleTestCases: ArticleTestCase[] = [
  {
    version: 1,
    filename: "article1-1.docx",
    extension: "docx",
    brokenGuidelines: [2, 3, 4, 6, 9, 11],
    description: "v1: Breaks guidelines 2 (font), 3 (bold/underline), 4 (page numbers), 6 (indentation), 9 (units), 11 (title)"
  },
  {
    version: 2,
    filename: "article1-2.docx",
    extension: "docx",
    brokenGuidelines: [2, 3, 4, 6, 9, 11, 12, 16],
    description: "v2: All v1 issues + 12 (email), 16 (acknowledgments placement)"
  },
  {
    version: 3,
    filename: "article1-3.docx",
    extension: "docx",
    brokenGuidelines: [18, 19, 20, 21],
    description: "v3: Breaks 18 (keywords), 19 (heading levels), 20 (structure), 21 (abbreviations)"
  },
  {
    version: 4,
    filename: "article1-4.docx",
    extension: "docx",
    brokenGuidelines: [24],
    description: "v4: Breaks 24 (figure resolution for combination artwork)"
  },
  {
    version: 5,
    filename: "article1-5.docx",
    extension: "docx",
    brokenGuidelines: [26, 27, 28],
    description: "v5: Breaks 26 (caption in figure), 27 (font size), 28 (line width)"
  },
  {
    version: 6,
    filename: "article1-6.docx",
    extension: "docx",
    brokenGuidelines: [29, 51],
    description: "v6: Breaks 29 (figure readability), 51 (contrast ratio)"
  },
  {
    version: 7,
    filename: "article1-7.docx",
    extension: "docx",
    brokenGuidelines: [30, 31],
    description: "v7: Breaks 30 (caption format - multiple issues), 31 (caption missing details)"
  },
  {
    version: 8,
    filename: "article1-8.docx",
    extension: "docx",
    brokenGuidelines: [30, 31, 33, 34],
    description: "v8: All v7 issues + 33 (table ordering/references), 34 (table creation method)"
  },
  {
    version: 9,
    filename: "article1-9.docx",
    extension: "docx",
    brokenGuidelines: [35, 37, 38],
    description: "v9: Breaks 35 (table caption placement/format), 37 (prior publication), 38 (reference format)"
  },
  {
    version: 10,
    filename: "article1-10.docx",
    extension: "docx",
    brokenGuidelines: [39, 40, 41, 42],
    description: "v10: Breaks 39 (references not cited), 40 (invalid DOI), 41 (abbreviations), 42 (missing year/chapter)"
  }
];

/**
 * Get all guidelines that should pass for a given article version
 * (all guidelines except the ones that are intentionally broken)
 */
export function getExpectedPassingGuidelines(version: number): number[] {
  const testCase = articleTestCases.find(tc => tc.version === version);
  if (!testCase) {
    throw new Error(`No test case found for version ${version}`);
  }

  const allGuidelines = Array.from({ length: 53 }, (_, i) => i + 1);
  return allGuidelines.filter(g => !testCase.brokenGuidelines.includes(g));
}

/**
 * Get the original (unmodified) article for baseline testing
 */
export const originalArticle = {
  filename: "article1-0.docx",
  extension: "docx",
  description: "Original unmodified article - should pass all applicable guidelines"
};
