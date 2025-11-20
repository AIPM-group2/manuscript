import OpenAI from "openai";
import mammoth from "mammoth";

const MODEL_CHATGPT_4O_MINI = "gpt-4o-mini";
const MODEL_GEMINI_2_5_FLASH = "google/gemini-2.5-flash-lite";
const MODEL_META_LLAMA_4_SCOUT = "meta-llama/llama-4-scout";

export type RuleAnalysisResult = {
  rule: string;
  decision: boolean;
  justification: string;
};

export class AIAnalyser {
  private client: OpenAI;
  private parallelThreads: number;

  constructor(
    private apiKey: string,
    parallelThreads: number = 8,
  ) {
    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      //dangerouslyAllowBrowser: true,
    });
    this.parallelThreads = Math.max(1, parallelThreads);
  }

  async analyze(data: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: MODEL_GEMINI_2_5_FLASH,
      messages: [
        { role: "system", content: "You are an analytical assistant." },
        { role: "user", content: data },
      ],
    });

    return response.choices[0].message.content ?? "";
  }

  async analyzeFile(file: File): Promise<string> {
    if (!file.name.endsWith(".docx")) {
      throw new Error("Only DOCX files are supported");
    }

    try {
     // Convert File to ArrayBuffer
     const arrayBuffer = await file.arrayBuffer();

     // Convert ArrayBuffer to Node.js Buffer for mammoth
     const buffer = Buffer.from(arrayBuffer);

     // Extract text from DOCX using mammoth
     const result = await mammoth.convertToHtml({ buffer });
     const extractedText = result.value;

     // Return the extracted text content for further analysis
     return extractedText;
    } catch (error) {
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
  Your entire output must be a single JSON array:
  For EACH rule, return an object:
  
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
  
    let jsonString = response.trim();
    const cleaned = jsonString
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();

    const jsonMatch = jsonString.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }
  
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
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

