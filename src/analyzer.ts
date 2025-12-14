import { DocxParser } from "./docx-parser";
import { SemanticValidator } from "./validators/semantic";
import { ProgrammaticValidator } from "./validators/programmatic";
import { registerJournal } from "./config/journals";
import { PEDIATRIC_RADIOLOGY_CONFIG } from "./config/journals/pediatric-radiology";
import type { ValidationReport, RuleResult } from "./types/rules";
import type { UDO } from "./types/udo";

// Register journals on module load (or we could do this in a Setup method)
registerJournal(PEDIATRIC_RADIOLOGY_CONFIG);

export class Analyzer {
    private semanticValidator: SemanticValidator;
    private programmaticValidator: ProgrammaticValidator;

    constructor(apiKey: string) {
        this.semanticValidator = new SemanticValidator(apiKey);
        this.programmaticValidator = new ProgrammaticValidator();
    }

    /**
     * Main entry point to analyze a manuscript
     */
    async analyzeManuscript(
        fileBuffer: ArrayBuffer,
        fileName: string,
        journalId: string = "pediatric-radiology"
    ): Promise<ValidationReport> {
        const timestamp = new Date();

        // 1. Parse Document (Layer 1 & 2)
        console.log("[Analyzer] Parsing document...");
        const udo: UDO = await DocxParser.parse(fileBuffer, fileName);

        // 2. Programmatic Validation (Layer 3) - Instant, no API calls
        console.log("[Analyzer] Running programmatic validation...");
        const programmaticResults = this.programmaticValidator.validate(udo, journalId);

        // 3. Semantic Validation (Layer 4) - AI-based, ~75 seconds
        console.log("[Analyzer] Running semantic validation...");
        const semanticResults = await this.semanticValidator.validate(udo, journalId);

        // 4. Aggregation (Layer 5)
        console.log("[Analyzer] Generating report...");
        return this.generateReport(fileName, journalId, udo, programmaticResults, semanticResults);
    }

    private generateReport(
        fileName: string,
        journalId: string,
        udo: UDO,
        programmatic: RuleResult[],
        semantic: RuleResult[]
    ): ValidationReport & { rawHtml: string } {
        const allResults = [...programmatic, ...semantic];
        const passed = allResults.filter(r => r.status === "PASS").length;
        const failed = allResults.filter(r => r.status === "FAIL").length;
        const skipped = allResults.filter(r => r.status === "SKIP").length;

        // Avoid division by zero
        const totalRated = passed + failed;
        const accuracy = totalRated > 0 ? (passed / totalRated) * 100 : 0;

        return {
            manuscriptName: fileName,
            journalId,
            timestamp: new Date(),
            summary: {
                totalRules: allResults.length,
                passedRules: passed,
                failedRules: failed,
                skippedRules: skipped,
                overallAccuracy: accuracy
            },
            results: allResults,
            rawHtml: udo.rawHTML || ""
        };
    }
}
