import type { UDO } from "./udo";

export type RuleCategory =
    | 'formatting'
    | 'structure'
    | 'citations'
    | 'references'
    | 'figures'
    | 'tables'
    | 'abstract'
    | 'metadata'
    | 'semantic';

export type RuleType = 'programmatic' | 'semantic';

// Basic rule definition
export interface BaseRule {
    id: number;
    name: string;
    category: RuleCategory;
    type: RuleType;
    description: string;
    autoFixable?: boolean; // Defaults to false if undefined
}

// ----------------------------------------------------------------------
// Result Types
// ----------------------------------------------------------------------

export interface RuleResult {
    ruleId: number;
    name: string; // Added for UI convenience
    category: string; // Added for filtering
    status: 'PASS' | 'FAIL' | 'SKIP' | 'WARNING';
    confidence: number; // 0.0 to 1.0 (programmatic usually 1.0)
    message: string; // User-facing explanation
    suggestion?: string; // How to fix it
    snippet?: string; // The text that caused the issue
    autoFixable?: boolean; // Whether this rule can be safely autofixed without AI rewriting content

    // Enhanced location info for document viewer
    location?: {
        section: string;      // "title", "abstract", "keywords", "references", etc.
        sectionId?: string;   // CSS ID for scrolling: "section-title", "section-abstract"
        lineNumber?: number;  // Approximate line in document
        text?: string;        // The problematic text snippet to highlight
        severity?: 'critical' | 'warning' | 'info';  // For color coding
    };

    // Detailed metadata about the result
    details?: Record<string, any>;

    // Chain of Thought reasoning (for semantic rules)
    reasoning?: {
        step1?: string;
        step2?: string;
        step3?: string;
        step4?: string;
    };
}

export type SemanticRuleResult = RuleResult;

export interface ValidationReport {
    manuscriptName: string;
    journalId: string;
    timestamp: Date;
    summary: {
        totalRules: number;
        passedRules: number;
        failedRules: number;
        skippedRules: number;
        overallAccuracy: number;
    };
    results: RuleResult[];
}

// ----------------------------------------------------------------------
// Semantic Rule (Phase 1)
// ----------------------------------------------------------------------

export interface Examples {
    good: string[];
    bad: string[];
}

export interface SemanticRule extends BaseRule {
    type: 'semantic';
    extractContent: (udo: UDO) => string;
    buildPrompt: (content: string, guideline: string, examples: Examples) => string;
}

// ----------------------------------------------------------------------
// Programmatic Rule (Phase 2 - Placeholder for now)
// ----------------------------------------------------------------------

export interface ProgrammaticRule extends BaseRule {
    type: 'programmatic';
    validate: (udo: UDO) => RuleResult;
}
