import type { JournalConfig } from "./index";

export const PEDIATRIC_RADIOLOGY_CONFIG: JournalConfig = {
    id: "pediatric-radiology",
    name: "Pediatric Radiology",
    publisher: "Springer",

    // --------------------------------------------------------------------------
    // Phase 2: Programmatic Rules Configuration
    // Based on: docs/springer_pediatric_radiology_guidelines.md
    // --------------------------------------------------------------------------
    programmatic: {
        // General formatting
        formatting: {
            fontName: ["Times New Roman", "Times Roman"],
            fontSize: 10,
            doubleSpacing: true,
            margins: 2.54, // 1 inch in cm
            maxHeadingLevels: 3,
        },

        // Article type configurations
        articleTypes: {
            "original": {
                maxWords: 4500,
                maxPages: 18,
                abstractWordCount: { min: 150, max: 250 },
                abstractStructured: true,
                abstractSections: ["Background", "Objective", "Materials and methods", "Results", "Conclusion"],
                requiredSections: ["introduction", "materials and methods", "results", "discussion", "conclusion"],
            },
            "review": {
                maxWords: 5000,
                maxPages: 20,
                abstractWordCount: { min: 100, max: 250 },
                abstractStructured: false,
            },
            "case-report": {
                maxWords: 1500, // ~6 pages
                maxPages: 6,
                maxReferences: 8,
                abstractWordCount: { min: 50, max: 125 },
                abstractStructured: false,
                requiredSections: ["introduction", "case report", "discussion"],
            },
            "technical-innovation": {
                maxWords: 1500,
                maxPages: 6,
                maxReferences: 8,
                abstractWordCount: { min: 50, max: 125 },
                abstractStructured: false,
            },
            "pictorial-essay": {
                maxWords: 2250,
                maxPages: 9,
                maxFigureParts: 30,
                abstractStructured: false,
            },
        },

        // Default limits (for Original Article)
        wordCounts: {
            abstract: { min: 150, max: 250 },
            document: { min: 1000, max: 4500 },
            keywords: { min: 4, max: 6 },
        },

        // Citation and Reference format
        citations: {
            format: "numbered", // [1], [2-4], [1,3,5]
            bracketStyle: "square",
        },

        // Figure requirements
        figures: {
            captionPrefix: "Fig.",
            captionBold: true,
            noPunctuationAfterNumber: true,
            resolutionDPI: {
                lineArt: 1200,
                halftones: 300,
                combination: 600,
            },
        },

        // Table requirements
        tables: {
            captionPrefix: "Table",
            captionAbove: true,
            arabicNumerals: true,
        },

        // Required ethical declarations
        declarations: {
            required: [
                "Competing Interests",
                "Funding",
                "Ethical Approval",
                "Informed Consent",
                "Data Availability Statement",
            ],
        },

        // ORCID format
        orcid: {
            format: /\d{4}-\d{4}-\d{4}-\d{3}[\dX]/,
            digits: 16,
        },
    },

    // --------------------------------------------------------------------------
    // Phase 1: Semantic Rules Configuration
    // --------------------------------------------------------------------------
    semantic: {
        "Title Content": {
            description: "Include a concise and informative title on the title page.",
            examples: {
                good: [
                    "Pediatric Brain MRI Findings in Acute Leukemia",
                    "Ultrasound Diagnosis of Appendicitis in Children: A Meta-Analysis"
                ],
                bad: [
                    "A Study of Various Imaging Findings in Children",
                    "Interesting Case Report"
                ]
            }
        },
        "Declarations (Title Page)": {
            description: "Declare competing interests and funding sources on the title page.",
            examples: {
                good: ["The authors declare no competing interests. This study was funded by NIH Grant #12345."],
                bad: ["No declarations provided.", "Funding info in methods section."]
            }
        },
        "Acknowledgments Placement": {
            description: "Place acknowledgments and funding information only on the title page, not in the manuscript body.",
            examples: {
                good: ["(On title page) Acknowledgments: We thank Dr. Smith for review."],
                bad: ["(In discussion) We would like to thank our funding sources."]
            }
        },
        "Double-Blind Review Setup": {
            description: "Remove all identifying information from the manuscript text and figures. Check for author names, affiliations, or self-citations like 'our previous work [Author]'.",
            examples: {
                good: ["The dataset used in this study...", "Previous studies [1] have shown..."],
                bad: ["As we showed in our previous study (Smith et al. 2020)...", "Data was collected at Boston Children's Hospital..."]
            }
        },
        "Keywords Quality": {
            description: "Verify that 4 to 6 keywords are included and are suitable for indexing (MeSH terms).",
            examples: {
                good: ["Magnetic Resonance Imaging", "Pediatrics", "Brain Neoplasms"],
                bad: ["Cool study", "New method", "Draft 1"]
            }
        },
        "Manuscript Structure": {
            description: "Confirm the manuscript follows the logical IMRAD structure: Introduction, Methods, Results, Discussion, Conclusion.",
            examples: {
                good: ["1. Introduction... 2. Methods... 3. Results..."],
                bad: ["1. Findings... 2. Thoughts... 3. Start..."]
            }
        },
        "Abbreviations Consistency": {
            description: "Abbreviations must be defined at their first occurrence and used consistently thereafter.",
            examples: {
                good: ["Magnetic Resonance Imaging (MRI) is useful. MRI scans show..."],
                bad: ["MRI is useful. Magnetic Resonance Imaging (MRI) shows...", "We performed a CT scan. The Computed Tomography results..."]
            }
        },
        "Figure Caption Content": {
            description: "Captions must start with 'Fig. X' in bold, explain all abbreviations/symbols, and be descriptive.",
            examples: {
                good: ["Fig. 1 T2-weighted MRI showing... Arrows indicate tumor margins."],
                bad: ["Fig 1. Scan.", "Figure 1: Patient 1."]
            }
        },
        "Table Caption/Title": {
            description: "Tables must have a short, descriptive caption placed immediately above the table.",
            examples: {
                good: ["Table 1: Demographics and clinical characteristics of the study population."],
                bad: ["Table 1.", "Results table."]
            }
        },
        "Table Prior Publication": {
            description: "If data is reused, acknowledge the original source in the caption (e.g., 'Adapted from [X]').",
            examples: {
                good: ["Table 1... Adapted from Smith et al. [5]."],
                bad: ["(Copied table with no citation)"]
            }
        },
        "Supplementary Captions": {
            description: "Supplementary items must have a concise caption describing content and purpose.",
            examples: {
                good: ["Online Resource 1: Video showing ultrasound technique."],
                bad: ["Video 1.", "Extra file."]
            }
        },
        "Abstract Length and Content": {
            description: "Abstract must be 150-250 words, unstructured for methodology papers (paragraph <125 words), or structured (Background, Objective, Materials/methods, Results, Conclusion) otherwise. No undefined abbreviations.",
            examples: {
                good: ["Background: ... Objective: ... (Total 200 words, no abbreviations)"],
                bad: ["This paper shows... (50 words)", "The MRI findings were... (MRI not defined)"]
            }
        },
        "Abstract Structure Style": {
            description: "Check for structure: Background, Objective, Materials and methods, Results, Conclusion.",
            examples: {
                good: ["Background: ... Objective: ..."],
                bad: ["Summary: ... Findings: ..."]
            }
        },
        "Clinical Trial Registration": {
            description: "Add registration number and date for clinical trials.",
            examples: {
                good: ["Trial Registration: ClinicalTrials.gov NCT01234567, Registered 1 Jan 2020."],
                bad: ["This is a clinical trial. (No number)"]
            }
        },
        "References Journal Abbreviations": {
            description: "Journal titles must use standard abbreviations per ISSN LTWA.",
            examples: {
                good: ["N Engl J Med", "Pediatr Radiol", "AJR Am J Roentgenol"],
                bad: ["The New England Journal of Medicine", "Pediatric Radiology Journal"]
            }
        }
    }
};
