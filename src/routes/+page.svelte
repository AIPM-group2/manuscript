<script lang="ts">
    import type { RuleAnalysisResult } from "../smarts.js";
    import { generalRules } from "../general_rules.js";
    import "../styles/page.css";

    let analysisResult = "";
    let rulesAnalysisResults: Record<string, RuleAnalysisResult> = {};
    let isAnalyzing = false;
    let analysisProgress = "";
    let error = "";
    let showDetailedResults = false;
    let expandedSections = {
        passed: false,
        warnings: false,
        errors: false,
    };
    let expandedRules = new Set();

    async function analyzeDocument(file: File) {
        isAnalyzing = true;
        error = "";
        analysisResult = "";
        rulesAnalysisResults = {};
        analysisProgress = "Uploading document...";

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/analyze-file", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || "Analysis request failed");
            }

            analysisProgress = "Processing analysis…";
            const data = await response.json();

            analysisResult = data.summary || "Document analyzed successfully!";
            rulesAnalysisResults = data.ruleResults || {};
            analysisProgress = "";
        } catch (err) {
            analysisProgress = "";
            error = err instanceof Error ? err.message : "An error occurred during analysis";
        } finally {
            isAnalyzing = false;
        }
    }
</script>

<div class="app">
    <h2>Upload a manuscript for review</h2>
    <p>DOCX files only. Analysis runs in the cloud and returns per-rule results.</p>

    <div class="upload-section">
        <h3>Upload a DOCX file for analysis</h3>
        <input
            type="file"
            accept=".docx"
            disabled={isAnalyzing}
            on:change={async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    await analyzeDocument(file);
                }
            }}
        />

        {#if isAnalyzing}
            <div class="progress">
                <div class="progress-spinner"></div>
                <p class="status">{analysisProgress || "Analyzing file..."}</p>
            </div>
        {/if}

        {#if error}
            <div class="error">
                <strong>Error:</strong>
                {error}
            </div>
        {/if}

        {#if analysisResult}
            <div class="result">
                <h4>Analysis Complete!</h4>
                <p>{analysisResult}</p>

                {#if Object.keys(rulesAnalysisResults).length > 0}
                    {@const passedRules = Object.entries(rulesAnalysisResults).filter(
                        ([_, result]) => result.decision,
                    )}
                    {@const failedRules = Object.entries(rulesAnalysisResults).filter(
                        ([_, result]) => !result.decision,
                    )}
                    {@const warningRules = []}
                    <!-- Placeholder for future warning rules -->

                    <div class="rules-results">
                        <div class="results-header">
                            <h4>Rule Analysis Results:</h4>
                            <button
                                class="export-btn"
                                on:click={() => {
                                    const exportData = {
                                        timestamp: new Date().toISOString(),
                                        results: rulesAnalysisResults,
                                        summary: {
                                            passed: passedRules.length,
                                            warnings: warningRules.length,
                                            errors: failedRules.length,
                                            total: Object.keys(rulesAnalysisResults).length,
                                        },
                                    };
                                    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                                        type: "application/json",
                                    });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `analysis-results-${new Date().toISOString().split("T")[0]}.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                            >
                                Export Results
                            </button>
                        </div>

                        <div class="summary">
                            <strong>
                                Summary: {passedRules.length} passed, {warningRules.length} warnings, {failedRules.length}
                                errors out of {Object.keys(rulesAnalysisResults).length} total rules
                            </strong>
                        </div>

                        <div class="categorized-results">
                            <!-- Passed Rules Section -->
                            {#if passedRules.length > 0}
                                <div class="result-section passed">
                                    <button
                                        class="section-header"
                                        on:click={() => (expandedSections.passed = !expandedSections.passed)}
                                    >
                                        <span class="section-icon">{expandedSections.passed ? "▼" : "▶"}</span>
                                        <span class="section-title">✅ Passed ({passedRules.length})</span>
                                    </button>
                                    {#if expandedSections.passed}
                                        <div class="section-content">
                                            {#each passedRules as [ruleName, result]}
                                                {@const ruleFromList = generalRules.find((r) => r.name === ruleName)}
                                                <div class="rule-item">
                                                    <button
                                                        class="rule-header"
                                                        on:click={() => {
                                                            if (expandedRules.has(ruleName)) {
                                                                expandedRules.delete(ruleName);
                                                            } else {
                                                                expandedRules.add(ruleName);
                                                            }
                                                            expandedRules = new Set(expandedRules);
                                                        }}
                                                    >
                                                        <span class="expand-icon"
                                                            >{expandedRules.has(ruleName) ? "▼" : "▶"}</span
                                                        >
                                                        <span class="rule-name">{ruleName}</span>
                                                        <span class="status-badge pass">✅ PASS</span>
                                                    </button>
                                                    {#if expandedRules.has(ruleName)}
                                                        <div class="rule-details">
                                                            <div class="rule-instruction">
                                                                <strong>Rule:</strong>
                                                                {ruleFromList?.instruction || "No instruction available"}
                                                            </div>
                                                            <div class="rule-justification">
                                                                <strong>Justification:</strong>
                                                                {result.justification}
                                                            </div>
                                                        </div>
                                                    {/if}
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            {/if}

                            <!-- Warning Rules Section (placeholder for future) -->
                            {#if warningRules.length > 0}
                                <div class="result-section warnings">
                                    <button
                                        class="section-header"
                                        on:click={() => (expandedSections.warnings = !expandedSections.warnings)}
                                    >
                                        <span class="section-icon">{expandedSections.warnings ? "▼" : "▶"}</span>
                                        <span class="section-title">⚠️ Warnings ({warningRules.length})</span>
                                    </button>
                                    {#if expandedSections.warnings}
                                        <div class="section-content">
                                            <!-- Warning rules will be displayed here when implemented -->
                                        </div>
                                    {/if}
                                </div>
                            {/if}

                            <!-- Failed Rules Section -->
                            {#if failedRules.length > 0}
                                <div class="result-section errors">
                                    <button
                                        class="section-header"
                                        on:click={() => (expandedSections.errors = !expandedSections.errors)}
                                    >
                                        <span class="section-icon">{expandedSections.errors ? "▼" : "▶"}</span>
                                        <span class="section-title">❌ Errors ({failedRules.length})</span>
                                    </button>
                                    {#if expandedSections.errors}
                                        <div class="section-content">
                                            {#each failedRules as [ruleName, result]}
                                                {@const ruleFromList = generalRules.find((r) => r.name === ruleName)}
                                                <div class="rule-item">
                                                    <button
                                                        class="rule-header"
                                                        on:click={() => {
                                                            if (expandedRules.has(ruleName)) {
                                                                expandedRules.delete(ruleName);
                                                            } else {
                                                                expandedRules.add(ruleName);
                                                            }
                                                            expandedRules = new Set(expandedRules);
                                                        }}
                                                    >
                                                        <span class="expand-icon"
                                                            >{expandedRules.has(ruleName) ? "▼" : "▶"}</span
                                                        >
                                                        <span class="rule-name">{ruleName}</span>
                                                        <span class="status-badge fail">❌ FAIL</span>
                                                    </button>
                                                    {#if expandedRules.has(ruleName)}
                                                        <div class="rule-details">
                                                            <div class="rule-instruction">
                                                                <strong>Rule:</strong>
                                                                {ruleFromList?.instruction || "No instruction available"}
                                                            </div>
                                                            <div class="rule-justification">
                                                                <strong>Justification:</strong>
                                                                {result.justification}
                                                            </div>
                                                        </div>
                                                    {/if}
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
