// import OpenAI from "openai";
import mammoth from "mammoth";
import { GoogleGenAI } from "@google/genai";

const MODEL_CHATGPT_4O_MINI = "gpt-4o-mini";
const MODEL_GEMINI_2_5_FLASH = "google/gemini-2.5-flash-lite";
const MODEL_GEMINI_2_0_FLASH = "gemini-2.0-flash"; 
const MODEL_META_LLAMA_4_SCOUT = "meta-llama/llama-4-scout";

export type RuleAnalysisResult = {
  rule: string;
  decision: boolean;
  justification: string;
};

export class AIAnalyser {
  private client: any;
  private parallelThreads: number;

  constructor(
    private apiKey: string,
    parallelThreads: number = 8,
  ) {
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
    this.parallelThreads = Math.max(1, parallelThreads);
  }

  async analyze(prompt: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: MODEL_GEMINI_2_0_FLASH,
      contents: prompt,
    });
    return response.text;    
}


  async analyzeFile(file: File): Promise<string> {
    if (!file.name.endsWith(".docx")) {
      throw new Error("Only DOCX files are supported");
    }

    try {
      // Convert file to ArrayBuffer (works in both browser and Node)
      const arrayBuffer = await file.arrayBuffer();
  
      // Detect if running in Node.js (Buffer exists) or browser
      const isNode = typeof Buffer !== "undefined" && typeof window === "undefined";
  
      let result;
  
      if (isNode) {
        // Node.js: use Buffer
        const buffer = Buffer.from(arrayBuffer);
        result = await mammoth.convertToHtml({ buffer });
      } else {
        // Browser: use arrayBuffer directly
        result = await mammoth.convertToHtml({ arrayBuffer });
      }
  
      return result.value;
    } catch (error: any) {
      throw new Error(`Failed to process DOCX file: ${error.message}`);
    }
  }

  async analyzeRules(originalFileName: string, originalExtension: string, documentContent: string, rules: FormattingRule[]): Promise<Record<string, RuleAnalysisResult>> {
    // Build a list of rule instructions
    const ruleList = rules.map(rule => ({
      name: rule.name,
      instruction: rule.instruction
    }));
  
    const prompt = `
  You are a manuscript formatting checker.
  Original file: ${originalFileName} (extension: ${originalExtension})
  Note: Content below is HTML extracted from the DOCX for analysis.
  
  Document Content:
  ${documentContent}
  
  Here is the list of formatting rules you must evaluate.
  You MUST output strictly valid JSON. 
  Do NOT output explanations, markdown, code fences, comments, backticks or text outside the JSON.
  Do NOT add any commas or brackets inside the explanation.
  Your entire output must be a single JSON object (not an array), where each key is the rule name and the value is an object:

  
  {
    "<rule name>": {
      "decision": true/false,
      "justification": "explanation"
    }
  }
  
  Rules:
  ${JSON.stringify(ruleList, null, 2)}
  
  If unsure, still output a best-effort decision.
  `.trim();
  
    const response = await this.analyze(prompt);
    const firstBrace = response.indexOf("{");
    const lastBrace = response.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON object found in AI response");
    }
    const jsonString = response.slice(firstBrace, lastBrace + 1);

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error(`Failed to parse JSON from AI response: ${jsonString}`);
    }
  
    const results: Record<string, RuleAnalysisResult> = {};
  
    rules.forEach(rule => {
      const entry = parsed[rule.name];
      if (!entry) {
        results[rule.name] = {
          rule: rule.name,
          decision: false,
          justification: "AI did not return a result for this rule"
        };
        return;
      }
      results[rule.name] = {
        rule: rule.name,
        decision: Boolean(entry.decision),
        justification: String(entry.justification ?? "No justification provided")
      };
    });
  
    return results;
  }  
}

export class FormattingRule {
  name: string;
  instruction: string;
  requiresAI: boolean;

  constructor(name: string, instruction: string, requiresAI: boolean = true) {
    this.name = name;
    this.instruction = instruction;
    this.requiresAI = requiresAI;
  }
}

