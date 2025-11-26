<script lang="ts">
    import { onMount } from "svelte";
    import { writable } from "svelte/store";
    import * as smarts from "../smarts.js";
    import { generalRules } from "../general_rules.js";
    import "../styles/page.css";

    const apiKey = writable("");
    let analyser: smarts.AIAnalyser | null = null;
    let inputKey = "";
    let analysisResult = "";
    let rulesAnalysisResults: Record<string, smarts.RuleAnalysisResult> = {};
    let isAnalyzing = false;
    let analysisProgress = "";
    let error = "";
    let showDetailedResults = false;
    let uploadedFilePath = ""; // This will store the path of the uploaded file on the server
    let expandedSections = {
        passed: false,
        warnings: false,
        errors: false,
    };
    let expandedRules = new Set();

    onMount(() => {
        const savedKey = localStorage.getItem("apiKey");
        if (savedKey) {
            apiKey.set(savedKey);
        }
    });

    // Whenever apiKey changes, reinitialize the analyser
    $: if ($apiKey) {
        analyser = new smarts.AIAnalyser($apiKey);
        analyser.analyze("Some input data").then((result) => {
            console.log("Analysis result:", result);
        });
    }

    function saveKey() {
        if (!inputKey.trim()) return;
        localStorage.setItem("apiKey", inputKey.trim());
        apiKey.set(inputKey.trim());
    }

    function resetKey() {
        localStorage.removeItem("apiKey");
        apiKey.set("");
        analyser = null;
    }

    async function fixRule(rule: string, justification: string) {
        console.log('Attempting to fix rule:', rule);
        console.log('Using file path:', uploadedFilePath);

        if (!uploadedFilePath) {
            alert('Error: No file path is available. Please upload the document again.');
            console.error('fixRule called without a valid uploadedFilePath.');
            return;
        }
        
        try {
            const response = await fetch('/api/fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rule, justification, documentPath: uploadedFilePath, apiKey: $apiKey }),
            });

            const result = await response.json();
            console.log('Fix API response:', result);

            if (response.ok) {
                alert(`Fix script executed: ${result.message}\nOutput: ${result.output}\n\nThe fixed file is available in the data/autofix/ directory.`);
                console.log("Generated Python code:", result.pythonCode);
            } else {
                alert(`Error: ${result.error}`);
                console.error('Fix API error:', result.error);
            }
        } catch (err) {
            console.error('Failed to call fix API:', err);
            alert(`A network error occurred while trying to fix the rule: ${err.message}`);
        }
    }
</script>

{#if $apiKey}
    <!-- ✅ API key already set -->
    <div class="app">
        <h2>Welcome back!</h2>
        <p>Your API key is saved.</p>

        <div class="upload-section">
            <h3>Upload a DOCX file for analysis</h3>
            <input
                type="file"
                accept=".docx"
                disabled={isAnalyzing}
                on:change={async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file && analyser) {
                        isAnalyzing = true;
                        error = "";
                        analysisResult = "";
                        rulesAnalysisResults = {};
                        analysisProgress = "Uploading file to server...";
                        uploadedFilePath = ""; // Reset path

                        try {
                            // Step 1: Upload the file to the server
                            const formData = new FormData();
                            formData.append('file', file);
                            const uploadResponse = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData,
                            });

                            const uploadResult = await uploadResponse.json();
                            if (!uploadResponse.ok) {
                                throw new Error(uploadResult.error || 'File upload failed');
                            }
                            uploadedFilePath = uploadResult.filePath;
                            console.log('File uploaded to server at:', uploadedFilePath);

                            // Step 2: Extract content from DOCX file
                            analysisProgress = "Extracting content from DOCX file...";
                            const extractedContent = await analyser.analyzeFile(file);

                            // Step 3: Analyze against all pediatric journal rules
                            analysisProgress = `Analyzing document against ${generalRules.length} formatting rules...`;
                            rulesAnalysisResults = await analyser.analyzeRules(file.name, file.type, extractedContent, generalRules);

                            analysisProgress = "";
                            analysisResult = "Document analyzed successfully!";
                        } catch (err) {
                            analysisProgress = "";
                            error = err.message || "An error occurred during analysis";
                        } finally {
                            isAnalyzing = false;
                        }
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
                                                                    {ruleFromList?.instruction ||
                                                                        "No instruction available"}
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
                                                                    {ruleFromList?.instruction ||
                                                                        "No instruction available"}
                                                                </div>
                                                                <div class="rule-justification">
                                                                    <strong>Justification:</strong>
                                                                    {result.justification}
                                                                </div>
                                                                <button
                                                                    class="fix-btn"
                                                                    on:click={async () => await fixRule(ruleName, result.justification)}
                                                                >
                                                                    Fix this issue
                                                                </button>
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

        <button on:click={resetKey}>Log out / Reset key</button>
    </div>
{:else}
    <!-- 🔑 Ask for API key -->
    <div class="setup">
        <h2>Enter your API key</h2>
        <input type="text" bind:value={inputKey} placeholder="Paste your API key" />
        <button on:click={saveKey}>Save</button>
    </div>
{/if}
