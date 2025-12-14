/**
 * AutoFix Service — Enhanced
 * 
 * Generates AI-powered fix suggestions with:
 * - Rule-specific prompt strategies
 * - Rich diff computation
 * - Fix verification
 * - Batch processing with progress streaming
 * 
 * Design Principles (per rules-back-end.md):
 * - Explicit domain modeling
 * - AI failures degrade gracefully
 * - Contracts over assumptions
 * - Simplicity first, extensibility second
 */

import { OpenRouter } from "@openrouter/sdk";
import { diff_match_patch, Diff } from 'diff-match-patch';

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENROUTER_MODEL = "x-ai/grok-4.1-fast";

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export type FixStatus =
    | 'pending'
    | 'generating'
    | 'generated'
    | 'verified'
    | 'accepted'
    | 'rejected'
    | 'applied'
    | 'error';

export type FixCategory =
    | 'formatting'
    | 'structural'
    | 'content'
    | 'citation'
    | 'declaration'
    | 'unknown';

export interface DiffOperation {
    /** Type of diff operation */
    op: 'equal' | 'insert' | 'delete';
    /** The text content */
    text: string;
}

export interface AutoFixResult {
    /** Unique ID for this fix */
    id: string;
    /** Rule identifier */
    ruleId: number;
    /** Human-readable rule name */
    ruleName: string;
    /** Category of fix */
    category: FixCategory;
    /** Current status */
    status: FixStatus;
    /** Original problematic content */
    original: string;
    /** AI-suggested fix */
    suggested: string;
    /** Human-readable explanation of changes */
    explanation: string;
    /** AI confidence score 0-1 */
    confidence: number;
    /** Rich diff operations for visualization */
    diff: DiffOperation[];
    /** Whether the fix has been verified to resolve the issue */
    verified: boolean;
    /** Verification result message */
    verificationMessage?: string;
    /** Alternative suggestions if available */
    alternatives?: string[];
    /** Timestamp when fix was generated */
    generatedAt: Date;
    /** Error message if status is 'error' */
    errorMessage?: string;
}

export interface FixGenerationRequest {
    ruleId: number;
    ruleName: string;
    ruleDescription: string;
    originalContent: string;
    validationMessage: string;
    category?: FixCategory;
}

export interface BatchProgressEvent {
    type: 'started' | 'progress' | 'completed' | 'error' | 'allComplete';
    ruleName?: string;
    result?: AutoFixResult;
    progress?: number;
    total?: number;
    results?: AutoFixResult[];
    error?: string;
}

// ============================================================================
// RULE CATEGORY MAPPING
// ============================================================================

const RULE_CATEGORIES: Record<string, FixCategory> = {
    // Formatting rules
    'Citation Format': 'citation',
    'Figure Numbering': 'formatting',
    'Table Numbering': 'formatting',
    'Reference Numbering': 'formatting',
    'ORCID Format': 'formatting',
    'DOI Format': 'formatting',
    'Email Format': 'formatting',
    'URL Format': 'formatting',
    'References Journal Abbreviations': 'citation',

    // Structural rules
    'Abstract Word Count': 'structural',
    'Title Word Count': 'structural',
    'Keywords Count': 'structural',
    'Section Order': 'structural',
    'Heading Hierarchy': 'structural',
    'Manuscript Structure': 'structural',
    'Abstract Structure Style': 'structural',

    // Declaration rules
    'Competing Interests Declaration': 'declaration',
    'Funding Declaration': 'declaration',
    'Ethics Approval Statement': 'declaration',
    'Data Availability Statement': 'declaration',
    'Declarations (Title Page)': 'declaration',

    // Content rules
    'Title Content': 'content',
    'Keywords Quality': 'content',
    'Abstract Length and Content': 'content',
    'Abbreviations Consistency': 'content',
    'Figure Caption Content': 'content',
    'Table Caption/Title': 'content',
};

// ============================================================================
// AUTOFIX SERVICE
// ============================================================================

export class AutoFixService {
    private openrouter: OpenRouter;
    private dmp: diff_match_patch;

    constructor(apiKey: string) {
        this.openrouter = new OpenRouter({ apiKey });
        this.dmp = new diff_match_patch();
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    /**
     * Generate a fix suggestion for a failed rule.
     * Returns a complete AutoFixResult with diff and verification.
     */
    async generateFix(request: FixGenerationRequest): Promise<AutoFixResult> {
        const id = this.generateId();
        const category = request.category || RULE_CATEGORIES[request.ruleName] || 'unknown';

        const baseResult: AutoFixResult = {
            id,
            ruleId: request.ruleId,
            ruleName: request.ruleName,
            category,
            status: 'generating',
            original: request.originalContent,
            suggested: '',
            explanation: '',
            confidence: 0,
            diff: [],
            verified: false,
            generatedAt: new Date()
        };

        try {
            // Generate the fix using AI
            const prompt = this.buildPrompt(request, category);
            const response = await this.callAI(prompt);
            const parsed = this.parseResponse(response);

            if (!parsed.suggested_text) {
                throw new Error('AI response did not contain suggested_text');
            }

            // Compute rich diff
            const diff = this.computeDiff(request.originalContent, parsed.suggested_text);

            // Verify the fix if possible
            const verification = this.verifyFix(
                request.ruleName,
                request.originalContent,
                parsed.suggested_text
            );

            return {
                ...baseResult,
                status: verification.verified ? 'verified' : 'generated',
                suggested: parsed.suggested_text,
                explanation: parsed.explanation || 'Fix generated successfully',
                confidence: parsed.confidence || 0.7,
                diff,
                verified: verification.verified,
                verificationMessage: verification.message,
                alternatives: parsed.alternatives
            };

        } catch (error: any) {
            console.error(`AutoFix error for ${request.ruleName}:`, error);
            return {
                ...baseResult,
                status: 'error',
                errorMessage: error.message || 'Failed to generate fix',
                confidence: 0
            };
        }
    }

    /**
     * Generate fixes for multiple rules with progress streaming.
     * Uses a generator pattern for real-time progress updates.
     */
    async *generateBatchFixes(
        requests: FixGenerationRequest[]
    ): AsyncGenerator<BatchProgressEvent> {
        const total = requests.length;
        const results: AutoFixResult[] = [];
        const DELAY_MS = 800; // Rate limiting delay

        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];

            yield {
                type: 'started',
                ruleName: request.ruleName,
                progress: i / total,
                total
            };

            try {
                const result = await this.generateFix(request);
                results.push(result);

                yield {
                    type: 'completed',
                    ruleName: request.ruleName,
                    result,
                    progress: (i + 1) / total,
                    total
                };

            } catch (error: any) {
                yield {
                    type: 'error',
                    ruleName: request.ruleName,
                    error: error.message,
                    progress: (i + 1) / total,
                    total
                };
            }

            // Rate limit delay (skip after last)
            if (i < requests.length - 1) {
                await this.sleep(DELAY_MS);
            }
        }

        yield {
            type: 'allComplete',
            results,
            progress: 1,
            total
        };
    }

    /**
     * Compute a rich diff between original and suggested text.
     */
    computeDiff(original: string, suggested: string): DiffOperation[] {
        const diffs = this.dmp.diff_main(original, suggested);
        this.dmp.diff_cleanupSemantic(diffs);

        return diffs.map(([op, text]: Diff) => ({
            op: op === 0 ? 'equal' : op === 1 ? 'insert' : 'delete',
            text
        }));
    }

    // ========================================================================
    // PROMPT BUILDING
    // ========================================================================

    private buildPrompt(request: FixGenerationRequest, category: FixCategory): string {
        const basePrompt = this.getBasePrompt();
        const categoryGuidance = this.getCategoryGuidance(category);

        return `${basePrompt}

## RULE: ${request.ruleName}
${request.ruleDescription}

## CATEGORY: ${category.toUpperCase()}
${categoryGuidance}

## CURRENT CONTENT (problematic):
"""
${request.originalContent}
"""

## VALIDATION MESSAGE:
${request.validationMessage}

## YOUR TASK:
Generate a corrected version that complies with the rule.

Respond ONLY with valid JSON (no markdown):
{
    "suggested_text": "The corrected content here...",
    "explanation": "Brief explanation of what was changed and why",
    "confidence": 0.9
}

CRITICAL RULES:
- Keep the same overall meaning and structure
- Only change what's necessary to comply with the rule
- For formatting rules, preserve all content but fix format
- For structural rules, add/reorganize as needed
- For declarations, use standard academic language
- confidence should be 0.0-1.0`;
    }

    private getBasePrompt(): string {
        return `You are an expert academic manuscript editor specializing in medical/scientific journals. Your task is to fix manuscript issues while preserving the author's voice and intent.

You follow Springer's Pediatric Radiology journal guidelines precisely.`;
    }

    private getCategoryGuidance(category: FixCategory): string {
        switch (category) {
            case 'formatting':
                return `This is a FORMATTING issue. Focus on:
- Correcting format without changing content
- Using exact patterns required (e.g., [1], Fig. 1, Table 1)
- Preserving all information while fixing presentation`;

            case 'citation':
                return `This is a CITATION issue. Focus on:
- Numbered format [1], [2-4], [1,3,5]
- Proper journal abbreviations per ISSN LTWA
- Consistent citation style throughout`;

            case 'structural':
                return `This is a STRUCTURAL issue. Focus on:
- Word count requirements (add or condense as needed)
- Section organization (IMRAD structure)
- Required headings and their order`;

            case 'declaration':
                return `This is a DECLARATION issue. Focus on:
- Using standard academic declaration language
- Include all required elements
- Examples: "The authors declare no competing interests."
- Example: "This study was approved by [IRB name], approval number [X]."`;

            case 'content':
                return `This is a CONTENT issue. Focus on:
- Improving clarity and specificity
- Adding missing required information
- Using appropriate medical/scientific terminology`;

            default:
                return `Fix the issue while preserving the author's intent.`;
        }
    }

    // ========================================================================
    // AI INTERACTION
    // ========================================================================

    private async callAI(prompt: string): Promise<string> {
        const response = await this.openrouter.chat.send({
            model: OPENROUTER_MODEL,
            messages: [{ role: "user", content: prompt }],
            stream: false
        });

        // Extract response text
        if (!Array.isArray(response) && 'choices' in response) {
            return (response as any).choices[0]?.message?.content || "";
        }

        // Handle streaming response (shouldn't happen with stream: false)
        let text = "";
        for await (const chunk of response as any) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) text += delta;
        }
        return text;
    }

    private parseResponse(text: string): {
        suggested_text?: string;
        explanation?: string;
        confidence?: number;
        alternatives?: string[];
    } {
        try {
            return JSON.parse(text);
        } catch {
            // Try extracting JSON from markdown
            const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (match) {
                try {
                    return JSON.parse(match[1]);
                } catch { /* continue */ }
            }

            // Try finding raw JSON object
            const start = text.indexOf("{");
            const end = text.lastIndexOf("}");
            if (start !== -1 && end !== -1) {
                try {
                    return JSON.parse(text.substring(start, end + 1));
                } catch { /* continue */ }
            }

            console.error("Failed to parse AI response:", text.slice(0, 200));
            return {};
        }
    }

    // ========================================================================
    // FIX VERIFICATION
    // ========================================================================

    private verifyFix(
        ruleName: string,
        original: string,
        suggested: string
    ): { verified: boolean; message: string } {
        // Quick verification for verifiable rules
        switch (ruleName) {
            case 'Abstract Word Count':
                return this.verifyWordCount(suggested, 150, 250);

            case 'Title Word Count':
                return this.verifyWordCount(suggested, 10, 15, true);

            case 'Keywords Count':
                return this.verifyKeywordCount(suggested, 4, 6);

            case 'Citation Format':
                return this.verifyCitationFormat(suggested);

            case 'Competing Interests Declaration':
            case 'Funding Declaration':
            case 'Ethics Approval Statement':
            case 'Data Availability Statement':
                return this.verifyDeclarationPresent(suggested);

            default:
                // Can't verify automatically
                return {
                    verified: false,
                    message: 'Manual review recommended'
                };
        }
    }

    private verifyWordCount(
        text: string,
        min: number,
        max: number,
        isWarning: boolean = false
    ): { verified: boolean; message: string } {
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        const count = words.length;

        if (count >= min && count <= max) {
            return {
                verified: true,
                message: `✓ Word count is ${count} (within ${min}-${max} range)`
            };
        }

        return {
            verified: false,
            message: `Word count is ${count} (${isWarning ? 'should be' : 'must be'} ${min}-${max})`
        };
    }

    private verifyKeywordCount(
        text: string,
        min: number,
        max: number
    ): { verified: boolean; message: string } {
        // Split on common delimiters
        const keywords = text.split(/[·,;]/).map(k => k.trim()).filter(k => k.length > 0);
        const count = keywords.length;

        if (count >= min && count <= max) {
            return {
                verified: true,
                message: `✓ Keyword count is ${count} (within ${min}-${max} range)`
            };
        }

        return {
            verified: false,
            message: `Keyword count is ${count} (should be ${min}-${max})`
        };
    }

    private verifyCitationFormat(text: string): { verified: boolean; message: string } {
        const citationPattern = /\[\d+(?:[-–,]\d+)*\]/g;
        const matches = text.match(citationPattern);

        if (matches && matches.length > 0) {
            return {
                verified: true,
                message: `✓ Found ${matches.length} properly formatted citation(s)`
            };
        }

        return {
            verified: false,
            message: 'No properly formatted citations [1] found'
        };
    }

    private verifyDeclarationPresent(text: string): { verified: boolean; message: string } {
        const hasContent = text.trim().length > 20;
        const looksLikeDeclaration = /declare|approved|funding|supported|ethics|IRB|available/i.test(text);

        if (hasContent && looksLikeDeclaration) {
            return {
                verified: true,
                message: '✓ Declaration appears complete'
            };
        }

        return {
            verified: false,
            message: 'Declaration may be incomplete'
        };
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private generateId(): string {
        return `fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy interface for backward compatibility with existing code.
 * Maps old method signature to new request-based API.
 */
export class AutoFixServiceCompat extends AutoFixService {
    async generateFixLegacy(
        ruleId: number,
        ruleName: string,
        ruleDescription: string,
        originalContent: string,
        validationMessage: string
    ): Promise<AutoFixResult> {
        return this.generateFix({
            ruleId,
            ruleName,
            ruleDescription,
            originalContent,
            validationMessage
        });
    }
}
