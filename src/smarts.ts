import OpenAI from "openai";
import mammoth from "mammoth";
import { DocxConverter, type DocxDocument } from "./docx-converter";

export type RuleAnalysisResult = {
  rule: string;
  decision: boolean;
  justification: string;
  // Raw unparsed model response (for debugging / traceability)
  rawResponse?: string;
  // Prompt that was sent to the model (can be large; include only when debug enabled)
  prompt?: string;
  // Whether JSON parsing succeeded
  parsedSuccessfully?: boolean;
};

export class AIAnalyser {
  private client: OpenAI;
  private parallelThreads: number;
  private docxConverter: DocxConverter;

  constructor(
    private apiKey: string,
    parallelThreads: number = 8,
  ) {
    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        "HTTP-Referer": "https://github.com/AIPM-group2/manuscript",
        "X-Title": "ManuScript Formatter"
      }
    });
    this.parallelThreads = Math.max(1, parallelThreads);
    this.docxConverter = new DocxConverter();
  }

  async analyze(data: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "openrouter/sherlock-think-alpha",
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

      // Extract text from DOCX using mammoth
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const extractedText = result.value;

      // Return the extracted text content for further analysis
      return extractedText;
    } catch (error) {
      throw new Error(`Failed to process DOCX file: ${error.message}`);
    }
  }

  async analyzeArrayBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      // Extract text from DOCX using mammoth
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const extractedText = result.value;

      // Return the extracted text content for further analysis
      return extractedText;
    } catch (error) {
      throw new Error(`Failed to process DOCX file: ${error.message}`);
    }
  }

  async analyzeFilePath(filePath: string): Promise<string> {
    try {
      // Extract text from DOCX using mammoth with path (Node.js only)
      const result = await mammoth.convertToHtml({ path: filePath });
      const extractedText = result.value;

      // Return the extracted text content for further analysis
      return extractedText;
    } catch (error) {
      throw new Error(`Failed to process DOCX file: ${error.message}`);
    }
  }

  /**
   * Analyze a DOCX file with rich metadata extraction (ContextGem-style)
   * This preserves formatting details like styles, spacing, fonts, etc.
   */
  async analyzeFilePathStructured(filePath: string): Promise<DocxDocument> {
    try {
      const doc = await this.docxConverter.convert(filePath);
      return doc;
    } catch (error) {
      throw new Error(`Failed to process DOCX with structured converter: ${error.message}`);
    }
  }

  /**
   * Analyze a DOCX file from ArrayBuffer with rich metadata extraction
   */
  async analyzeArrayBufferStructured(arrayBuffer: ArrayBuffer): Promise<DocxDocument> {
    try {
      const doc = await this.docxConverter.convert(arrayBuffer);
      return doc;
    } catch (error) {
      throw new Error(`Failed to process DOCX with structured converter: ${error.message}`);
    }
  }

  /**
   * Analyze rules using structured DOCX content instead of simple HTML
   * @param documentSource - File path or ArrayBuffer
   * @param rules - Formatting rules to check
   * @param options - { debug?: boolean, useStructured?: boolean }
   */
  async analyzeRulesFromDocx(
    documentSource: string | ArrayBuffer,
    rules: FormattingRule[],
    options: { debug?: boolean; useStructured?: boolean } = {},
  ): Promise<Record<string, RuleAnalysisResult>> {
    const useStructured = options.useStructured ?? false;
    let documentContent: string;

    if (useStructured) {
      // Use the new structured converter
      const doc = typeof documentSource === 'string'
        ? await this.analyzeFilePathStructured(documentSource)
        : await this.analyzeArrayBufferStructured(documentSource);

      // Use structured text format that includes metadata annotations
      documentContent = doc.toStructuredText();
    } else {
      // Use the legacy Mammoth HTML converter
      documentContent = typeof documentSource === 'string'
        ? await this.analyzeFilePath(documentSource)
        : await this.analyzeArrayBuffer(documentSource);
    }

    return this.analyzeRules(documentContent, rules, options);
  }

  async analyzeRules(
    documentContent: string,
    rules: FormattingRule[],
    options: { debug?: boolean } = {},
  ): Promise<Record<string, RuleAnalysisResult>> {
    const results: Record<string, RuleAnalysisResult> = {};
    const debug = options.debug || process.env.DEBUG_RULES === "1" || false;

    // Process rules in batches with parallel execution
    for (let i = 0; i < rules.length; i += this.parallelThreads) {
      const batch = rules.slice(i, i + this.parallelThreads);

      const batchPromises = batch.map(async (rule) => {
        try {
          const analysisPrompt = `
Document Content:
${documentContent}

Rule to Analyze: ${rule.name}
Rule Instruction: ${rule.instruction}

Please analyze whether the document follows this rule. Respond with a JSON object containing:
- "decision": true if the rule is followed, false if not
- "justification": a clear explanation of why you made this decision

Format your response as valid JSON only.
          `.trim();

          const response = await this.analyze(analysisPrompt);

          try {
            // Extract JSON from markdown code blocks if present
            let jsonString = response.trim();
            const jsonMatch = jsonString.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (jsonMatch) {
              jsonString = jsonMatch[1];
            }

            const parsed = JSON.parse(jsonString);
            const resultObj: RuleAnalysisResult = {
              rule: rule.name,
              decision: Boolean(parsed.decision),
              justification: String(parsed.justification || "No justification provided"),
              rawResponse: debug ? response : undefined,
              prompt: debug ? analysisPrompt : undefined,
              parsedSuccessfully: true,
            };
            if (debug) {
              // Provide a concise console trace for each rule
              // Truncate long responses for readability
              const truncatedRaw = response.length > 500 ? response.slice(0, 500) + "…[truncated]" : response;
              // eslint-disable-next-line no-console
              console.log(`DEBUG[RULE]: ${rule.name} -> decision=${resultObj.decision} parsed OK\nRAW: ${truncatedRaw}`);
            }
            return { ruleName: rule.name, result: resultObj };
          } catch (parseError) {
            // Fallback if JSON parsing fails
            const resultObj: RuleAnalysisResult = {
              rule: rule.name,
              decision: false,
              justification: `Failed to parse AI response (treated as FAIL). Parse error: ${(parseError as Error).message}`,
              rawResponse: debug ? response : undefined,
              prompt: debug ? analysisPrompt : undefined,
              parsedSuccessfully: false,
            };
            if (debug) {
              const truncatedRaw = response.length > 500 ? response.slice(0, 500) + "…[truncated]" : response;
              // eslint-disable-next-line no-console
              console.warn(`DEBUG[RULE]: ${rule.name} -> PARSE ERROR. Marked FAIL.\nRAW: ${truncatedRaw}`);
            }
            return { ruleName: rule.name, result: resultObj };
          }
        } catch (error) {
          return {
            ruleName: rule.name,
            result: {
              rule: rule.name,
              decision: false,
              justification: `Runtime error analyzing rule: ${(error as Error).message}`,
              rawResponse: undefined,
              prompt: debug ? `FAILED BEFORE COMPLETION. Prompt would have been built for rule ${rule.name}` : undefined,
              parsedSuccessfully: false,
            },
          };
        }
      });

      // Wait for all promises in this batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Add results to the main results object
      batchResults.forEach(({ ruleName, result }) => {
        results[ruleName] = result;
      });
    }

    if (debug) {
      // eslint-disable-next-line no-console
      console.log(`DEBUG: Completed analysis of ${Object.keys(results).length} rules.`);
    }
    return results;
  }
}

export class FormattingRule {
  name: string;
  instruction: string;

  constructor(name: string, instruction: string) {
    this.name = name;
    this.instruction = instruction;
  }
}
