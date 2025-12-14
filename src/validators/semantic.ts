// =============================================================================
// GEMINI IMPLEMENTATION (COMMENTED OUT)
// Uncomment this block and comment the OpenRouter block to use Gemini
// =============================================================================
// import { GoogleGenerativeAI } from "@google/generative-ai";
// const MODEL_NAME = "gemini-2.5-flash";

// =============================================================================
// OPENROUTER IMPLEMENTATION (ACTIVE)
// Using @openrouter/sdk with Grok model
// =============================================================================
import { OpenRouter } from "@openrouter/sdk";
import type { UDO } from "../types/udo";
import type { RuleResult } from "../types/rules";
import { SEMANTIC_RULES } from "./semantic-rules";
import { JOURNALS } from "../config/journals";

// OpenRouter Configuration - Using Grok 4.1 Fast
const OPENROUTER_MODEL = "x-ai/grok-4.1-fast";

export class SemanticValidator {
    private openrouter: OpenRouter;

    constructor(apiKey: string) {
        this.openrouter = new OpenRouter({ apiKey });
        // =============================================================================
        // GEMINI CONSTRUCTOR (COMMENTED OUT)
        // =============================================================================
        // const genAI = new GoogleGenerativeAI(apiKey);
        // this.model = genAI.getGenerativeModel({ model: MODEL_NAME });
    }

    /**
     * Run all semantic validation rules for a specific journal
     * Processes rules sequentially with delays to avoid rate limiting
     */
    async validate(udo: UDO, journalId: string): Promise<RuleResult[]> {
        const journal = JOURNALS[journalId];
        if (!journal) {
            throw new Error(`Journal not found: ${journalId}`);
        }

        const results: RuleResult[] = [];
        const DELAY_MS = 1000; // 1 second between API calls (Grok doesn't have strict free tier limits)

        // Article-type exemptions per Springer guidelines
        // PICTORIAL ESSAY and REVIEW articles don't require IMRAD structure
        const articleType = udo.metadata.articleType || 'ORIGINAL ARTICLE';
        const exemptTypes = ['PICTORIAL ESSAY', 'REVIEW', 'CASE REPORT', 'LETTER'];
        const isExemptArticleType = exemptTypes.some(t => articleType.toUpperCase().includes(t));

        // Rules that are exempt for non-IMRAD article types
        const structureExemptRules = ['Manuscript Structure', 'Abstract Structure Style', 'Abstract Length and Content'];

        for (let i = 0; i < SEMANTIC_RULES.length; i++) {
            const rule = SEMANTIC_RULES[i];
            console.log(`[${i + 1}/${SEMANTIC_RULES.length}] Checking: ${rule.name}...`);

            try {
                // Check for article-type exemptions
                if (isExemptArticleType && structureExemptRules.includes(rule.name)) {
                    console.log(`  → Exempt for ${articleType}`);
                    results.push({
                        ruleId: rule.id,
                        name: rule.name,
                        category: rule.category,
                        status: "PASS",
                        confidence: 0.95,
                        message: `${rule.name} requirements differ for ${articleType}. Standard IMRAD structure not required.`,
                        details: { articleType, reason: "Article-type exemption" }
                    } as RuleResult);
                    continue;
                }

                // 1. Get Journal Guideline
                const guideline = journal.semantic[rule.name];
                if (!guideline) {
                    console.warn(`No guideline found for rule ${rule.name} in journal ${journalId}`);
                    results.push({
                        ruleId: rule.id,
                        name: rule.name,
                        category: rule.category,
                        status: "SKIP",
                        confidence: 0,
                        message: `Guideline not configured for this journal.`,
                        details: { reason: "Missing config" }
                    } as RuleResult);
                    continue;
                }

                // 2. Extract Content
                const content = rule.extractContent(udo);
                if (!content || content.trim().length === 0) {
                    results.push({
                        ruleId: rule.id,
                        name: rule.name,
                        category: rule.category,
                        status: "SKIP",
                        confidence: 0,
                        message: `Content for this rule could not be extracted (e.g. missing section).`,
                        details: { reason: "Content missing" }
                    } as RuleResult);
                    continue;
                }

                // 3. Build Prompt
                const prompt = rule.buildPrompt(content, guideline.description, guideline.examples);

                // 4. Call LLM via OpenRouter SDK
                const responseText = await this.callOpenRouter(prompt);

                // 5. Parse JSON
                const parsed = this.parseResponse(responseText);

                results.push({
                    ruleId: rule.id,
                    name: rule.name,
                    category: rule.category,
                    status: parsed.status || "FAIL",
                    confidence: parsed.confidence || 0.5,
                    message: parsed.explanation || "No explanation provided.",
                    suggestion: parsed.suggestion,
                    snippet: parsed.snippet || undefined,
                    reasoning: parsed.reasoning,
                    location: {
                        section: this.getSectionFromRuleName(rule.name),
                        text: parsed.snippet || undefined, // For exact text highlighting
                        severity: parsed.status === "FAIL" ? "critical" : parsed.status === "WARNING" ? "warning" : "info"
                    },
                    details: {
                        raw_response: responseText.substring(0, 500),
                        instruction: guideline.description
                    },
                    autoFixable: rule.autoFixable
                } as RuleResult);

            } catch (error: any) {
                console.error(`Error validating rule ${rule.name}:`, error);
                results.push({
                    ruleId: rule.id,
                    name: rule.name,
                    category: rule.category,
                    status: "SKIP",
                    confidence: 0,
                    message: `AI Validation failed: ${error.message}`,
                    details: { error: error.toString() }
                } as RuleResult);
            }

            // Wait between calls to avoid rate limiting (skip delay after last rule)
            if (i < SEMANTIC_RULES.length - 1) {
                console.log(`⏳ Waiting ${DELAY_MS / 1000}s before next rule...`);
                await this.sleep(DELAY_MS);
            }
        }

        return results;
    }

    /**
     * Call OpenRouter API using the SDK (non-streaming for simplicity)
     * Note: The SDK returns a stream by default, we collect all chunks
     */
    private async callOpenRouter(prompt: string): Promise<string> {
        const stream = await this.openrouter.chat.send({
            model: OPENROUTER_MODEL,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            stream: false  // Non-streaming for simpler handling
        });

        // For non-streaming response
        if (!Array.isArray(stream) && 'choices' in stream) {
            return (stream as any).choices[0]?.message?.content || "";
        }

        // Fallback: if it's still a stream, collect all chunks
        let content = "";
        for await (const chunk of stream as any) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
                content += delta;
            }
        }
        return content;
    }

    // =============================================================================
    // GEMINI API CALL (COMMENTED OUT)
    // =============================================================================
    // private async callGemini(prompt: string): Promise<string> {
    //     const result = await this.model.generateContent([{ text: prompt }]);
    //     return result.response.text();
    // }

    /**
     * Helper to sleep for a given duration
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Helper to map rule names to document sections for highlighting
     */
    private getSectionFromRuleName(ruleName: string): string {
        const sectionMap: Record<string, string> = {
            "Title Content": "title",
            "Declarations (Title Page)": "general",
            "Acknowledgments Placement": "general",
            "Double-Blind Review Setup": "general",
            "Keywords Quality": "keywords",
            "Manuscript Structure": "structure",
            "Abbreviations Consistency": "general",
            "Figure Caption Content": "figures",
            "Table Caption/Title": "tables",
            "Reference Quality": "references",
            "Abstract Content": "abstract",
            "LLM Disclosure": "methods"
        };
        return sectionMap[ruleName] || "general";
    }

    /**
     * Helper to parse JSON from Markdown code blocks or raw strings
     */
    private parseResponse(text: string): any {
        try {
            // 1. Try direct parse
            return JSON.parse(text);
        } catch {
            // 2. Try extracting from markdown ```json block
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            if (match) {
                try {
                    return JSON.parse(match[1]);
                } catch (e) {
                    // Ignore nested error
                }
            }

            // 3. Try finding first { and last }
            const start = text.indexOf("{");
            const end = text.lastIndexOf("}");
            if (start !== -1 && end !== -1) {
                try {
                    return JSON.parse(text.substring(start, end + 1));
                } catch (e) { /* ignore */ }
            }

            // Fallback
            console.error("Failed to parse JSON response:", text);
            return {
                status: "FAIL",
                confidence: 0,
                explanation: "Could not parse AI response. Check logs.",
                details: { raw: text }
            };
        }
    }
}

