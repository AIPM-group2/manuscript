<script lang="ts">
    import { onMount } from "svelte";
    import "../../styles/design-system.css";
    import { user, apiKey, logout, saveApiKey } from "$lib/stores/auth";
    import { goto } from "$app/navigation";
    import * as smarts from "../../smarts.js";
    import { Analyzer } from "../../analyzer";
    import { generalRules } from "../../general_rules.js";
    import GridBackground from "$lib/components/GridBackground.svelte";
    import AutoFixPanel from "$lib/components/AutoFixPanel.svelte";
    import FixSummaryBar from "$lib/components/FixSummaryBar.svelte";
    import DocumentViewer from "$lib/components/DocumentViewer.svelte";
    import BatchFixPanel from "$lib/components/BatchFixPanel.svelte";
    import {
        AutoFixService,
        type AutoFixResult,
        type FixGenerationRequest,
    } from "../../services/autofix";
    import { DocxSmartEditor } from "../../services/docx-smart-editor";
    import type { RuleResult } from "../../types/rules";

    // Confidence threshold: hide results below this to reduce false positives
    const CONFIDENCE_THRESHOLD = 0.5; // Only show results with >=50% confidence

    // Redirect if not logged in
    onMount(() => {
        if (!$user) {
            goto("/login");
        }
    });

    let analyser: Analyzer | null = null;
    let autoFixService: AutoFixService | null = null;
    let apiKeyInput = "";
    let showApiKeyModal = false;
    let rulesAnalysisResults: Record<string, smarts.RuleAnalysisResult> = {};
    let isAnalyzing = false;
    let analysisProgress = "";
    let error = "";
    let uploadedFileName = "";
    let selectedIssue: string | null = null;
    let activeTab: "all" | "errors" | "passed" = "all";
    let isDragging = false;

    // AutoFix state
    let fixes: AutoFixResult[] = [];
    let currentFix: AutoFixResult | null = null;
    let isGeneratingFix = false;
    let isExporting = false;
    let uploadedBuffer: ArrayBuffer | null = null;

    // Batch fix state
    let isBatchGenerating = false;
    let batchProgress = 0;
    let batchCurrentRule = "";
    let fixMode: "single" | "batch" = "batch";

    // Document Viewer state
    let documentHtml: string = "";
    let validationResults: RuleResult[] = [];
    let selectedError: RuleResult | null = null;

    $: if ($apiKey) {
        analyser = new Analyzer($apiKey);
        autoFixService = new AutoFixService($apiKey);
    }

    $: passedRules = Object.entries(rulesAnalysisResults).filter(
        ([_, result]) => result.decision,
    );
    $: failedRules = Object.entries(rulesAnalysisResults).filter(
        ([_, result]) => !result.decision,
    );
    $: filteredIssues =
        activeTab === "all"
            ? Object.entries(rulesAnalysisResults)
            : activeTab === "errors"
              ? failedRules
              : passedRules;
    $: passRate =
        Object.keys(rulesAnalysisResults).length > 0
            ? Math.round(
                  (passedRules.length /
                      Object.keys(rulesAnalysisResults).length) *
                      100,
              )
            : 0;

    function handleSaveApiKey() {
        saveApiKey(apiKeyInput);
        showApiKeyModal = false;
    }

    async function handleFileUpload(file: File) {
        if (!file || !analyser) {
            showApiKeyModal = true;
            return;
        }

        isAnalyzing = true;
        error = "";
        rulesAnalysisResults = {};
        uploadedFileName = file.name;
        documentHtml = "";
        validationResults = [];

        try {
            analysisProgress = "Reading document structure...";
            const buffer = await file.arrayBuffer();
            uploadedBuffer = buffer;

            analysisProgress =
                "Checking compliance with Pediatric Radiology guidelines...";
            const report = await analyser.analyzeManuscript(
                buffer,
                file.name,
                "pediatric-radiology",
            );

            analysisProgress = "Finalizing report...";

            // Store raw HTML for DocumentViewer
            documentHtml = (report as any).rawHtml || "";

            // Store validation results (with location info) for DocumentViewer
            validationResults = report.results.filter(
                (r) => r.status === "FAIL" || r.status === "WARNING",
            );

            // Map new architecture results to old UI format (for backward compat)
            const mappedResults: Record<string, any> = {};

            report.results.forEach((result: any) => {
                const key = result.name;
                mappedResults[key] = {
                    rule: result.name,
                    decision: result.status === "PASS",
                    justification:
                        result.message +
                        (result.suggestion
                            ? `\n\nSuggestion: ${result.suggestion}`
                            : ""),
                    instruction:
                        result.details?.instruction ||
                        result.description ||
                        "Semantic rule from journal guidelines.",
                    // Enhanced fields for detailed proof export
                    reasoning: result.reasoning,
                    status: result.status,
                    snippet: result.snippet,
                    details: result.details,
                };
            });

            rulesAnalysisResults = mappedResults as any;

            analysisProgress = "";

            // Select first error in DocumentViewer
            if (validationResults.length > 0) {
                selectedError = validationResults[0];
                selectedIssue = validationResults[0].name;
                activeTab = "errors";
            }
        } catch (err: any) {
            console.error("Analysis Error:", err);
            error = err.message || "Analysis failed";
            analysisProgress = "";
        } finally {
            isAnalyzing = false;
        }
    }

    // =========================================================================
    // AUTOFIX HANDLERS
    // =========================================================================

    async function handleGenerateFix(ruleName: string) {
        if (!autoFixService || !selectedIssue) return;

        const result = rulesAnalysisResults[ruleName];
        if (!result || result.decision) return; // Don't fix passed rules

        isGeneratingFix = true;
        currentFix = null;

        try {
            // Find the rule definition
            const rule = generalRules.find((r) => r.name === ruleName);

            // Extract content for this rule
            const originalContent =
                result.snippet || result.justification || "";

            // Use new request-based API
            const request: FixGenerationRequest = {
                ruleId: 0,
                ruleName,
                ruleDescription:
                    rule?.instruction || "Check compliance with guideline",
                originalContent,
                validationMessage: result.justification,
            };

            const fix = await autoFixService.generateFix(request);
            currentFix = fix;

            // Add to fixes array if not already present
            const existingIdx = fixes.findIndex((f) => f.ruleName === ruleName);
            if (existingIdx >= 0) {
                fixes[existingIdx] = fix;
            } else {
                fixes = [...fixes, fix];
            }
        } catch (err: any) {
            console.error("Fix generation error:", err);
            error = `Fix generation failed: ${err.message}`;
        } finally {
            isGeneratingFix = false;
        }
    }

    // Batch fix generation
    async function handleStartBatch() {
        if (!autoFixService) return;

        isBatchGenerating = true;
        batchProgress = 0;
        fixes = [];

        try {
            // Build requests for all failed rules
            const requests: FixGenerationRequest[] = failedRules.map(
                ([name, result], idx) => {
                    const rule = generalRules.find((r) => r.name === name);
                    return {
                        ruleId: idx,
                        ruleName: name,
                        ruleDescription:
                            rule?.instruction ||
                            "Check compliance with guideline",
                        originalContent:
                            result.snippet || result.justification || "",
                        validationMessage: result.justification,
                    };
                },
            );

            // Use the batch generator
            for await (const event of autoFixService.generateBatchFixes(
                requests,
            )) {
                if (event.type === "started") {
                    batchCurrentRule = event.ruleName || "";
                } else if (event.type === "completed" && event.result) {
                    batchProgress = event.progress || 0;
                    fixes = [...fixes, event.result];
                } else if (event.type === "error") {
                    console.error(
                        `Batch fix error for ${event.ruleName}:`,
                        event.error,
                    );
                } else if (event.type === "allComplete") {
                    batchProgress = 1;
                }
            }
        } catch (err: any) {
            console.error("Batch fix error:", err);
            error = `Batch fix failed: ${err.message}`;
        } finally {
            isBatchGenerating = false;
            batchCurrentRule = "";
        }
    }

    function handleCancelBatch() {
        isBatchGenerating = false;
        batchCurrentRule = "";
    }

    function handleAcceptAllVerified() {
        fixes = fixes.map((f) =>
            f.verified || f.status === "generated"
                ? { ...f, status: "accepted" as const }
                : f,
        );
        if (
            currentFix &&
            (currentFix.verified || currentFix.status === "generated")
        ) {
            currentFix = { ...currentFix, status: "accepted" };
        }
    }

    function handleReviewFix(fix: AutoFixResult) {
        currentFix = fix;
        selectedIssue = fix.ruleName;
    }

    function handleAcceptFix(fix: AutoFixResult) {
        fix.status = "accepted";
        currentFix = { ...fix };
        fixes = fixes.map((f) =>
            f.ruleName === fix.ruleName ? { ...f, status: "accepted" } : f,
        );
    }

    function handleRejectFix(fix: AutoFixResult) {
        fix.status = "rejected";
        currentFix = { ...fix };
        fixes = fixes.map((f) =>
            f.ruleName === fix.ruleName ? { ...f, status: "rejected" } : f,
        );
    }

    function handleApplyAllFixes() {
        fixes = fixes.map((f) =>
            f.status === "generated" ? { ...f, status: "accepted" } : f,
        );
        if (currentFix && currentFix.status === "generated") {
            currentFix = { ...currentFix, status: "accepted" };
        }
    }

    function handleClearFixes() {
        fixes = [];
        currentFix = null;
    }

    async function handleExportFixed() {
        if (!uploadedBuffer) {
            error = "No document uploaded";
            return;
        }

        isExporting = true;
        try {
            const acceptedFixes = fixes.filter((f) => f.status === "accepted");

            if (acceptedFixes.length === 0) {
                error = "No fixes to apply. Accept at least one fix first.";
                isExporting = false;
                return;
            }

            // Use the new DocxSmartEditor for reliable text replacement
            const editor = new DocxSmartEditor(uploadedBuffer);

            // Apply each accepted fix
            for (const fix of acceptedFixes) {
                if (
                    fix.original &&
                    fix.suggested &&
                    fix.original !== fix.suggested
                ) {
                    const result = editor.replace(fix.original, fix.suggested);
                    if (result.success) {
                        console.log(`✓ Applied fix for: ${fix.ruleName}`);
                    } else {
                        console.warn(`✗ ${fix.ruleName}: ${result.message}`);
                    }
                }
            }

            // Generate the modified DOCX
            const blob = editor.export();
            const changeLog = editor.getChangeSummary();

            // Download the modified document
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `fixed-${uploadedFileName}`;
            a.click();
            URL.revokeObjectURL(url);

            // Log changes
            if (changeLog.length > 0) {
                console.log("Changes applied:");
                changeLog.forEach((c) => console.log(c));
            }

            // Update fix statuses
            fixes = fixes.map((f) =>
                f.status === "accepted"
                    ? { ...f, status: "applied" as const }
                    : f,
            );
        } catch (err: any) {
            console.error("Export error:", err);
            error = `Export failed: ${err.message}`;
        } finally {
            isExporting = false;
        }
    }

    function exportResults() {
        // Build comprehensive validation report
        const report = {
            meta: {
                fileName: uploadedFileName,
                exportedAt: new Date().toISOString(),
                version: "1.0.0",
            },
            summary: {
                passRate: passRate,
                totalChecks:
                    Object.keys(rulesAnalysisResults).length +
                    validationResults.length,
                passed:
                    passedRules.length +
                    validationResults.filter((r) => r.status === "PASS").length,
                failed:
                    failedRules.length +
                    validationResults.filter((r) => r.status === "FAIL").length,
                warnings: validationResults.filter(
                    (r) => r.status === "WARNING",
                ).length,
            },
            semanticResults: Object.entries(rulesAnalysisResults).map(
                ([ruleName, result]) => ({
                    ruleName,
                    decision: result.decision,
                    justification: result.justification,
                    confidence: result.confidence || 0.8,
                    type: "semantic",
                }),
            ),
            programmaticResults: validationResults.map((result) => ({
                ruleId: result.ruleId,
                ruleName: result.name,
                status: result.status,
                message: result.message,
                confidence: result.confidence || 1.0,
                snippet: result.snippet || result.location?.text,
                suggestion: result.suggestion,
                autoFixable: result.autoFixable || false,
                type: "programmatic",
            })),
            issues: [
                ...failedRules.map(([name, r]) => ({
                    name,
                    type: "semantic",
                    severity: r.confidence > 0.8 ? "error" : "warning",
                    message: r.justification,
                })),
                ...validationResults
                    .filter((r) => r.status === "FAIL")
                    .map((r) => ({
                        name: r.name,
                        type: "programmatic",
                        severity: "error",
                        message: r.message,
                        snippet: r.snippet || r.location?.text,
                    })),
            ],
        };

        const jsonString = JSON.stringify(report, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        // Create download link with proper filename
        const filename = `validation-report-${uploadedFileName.replace(/\.[^/.]+$/, "") || "document"}.json`;

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        // Cleanup after a delay
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 200);

        console.log("[Export] Downloaded:", filename);
    }
</script>

<svelte:head>
    <title>Dashboard - ApexScript</title>
</svelte:head>

<div class="dashboard-layout">
    <GridBackground />

    <!-- Navigation -->
    <nav class="nav">
        <div class="container nav-content">
            <a href="/" class="brand">
                <div class="logo-icon">A</div>
                <span>ApexScript</span>
            </a>

            <div class="nav-actions">
                <div class="user-badge">
                    <span class="avatar">{$user?.name?.[0] || "U"}</span>
                    <span class="name">{$user?.name || "User"}</span>
                </div>
                {#if !$apiKey}
                    <button
                        on:click={() => (showApiKeyModal = true)}
                        class="btn btn-primary btn-sm">Set API Key</button
                    >
                {/if}
                <button on:click={logout} class="btn btn-ghost btn-sm"
                    >Logout</button
                >
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content container">
        {#if isAnalyzing}
            <!-- Loading State -->
            <div class="loading-state">
                <div class="spinner-container">
                    <div class="spinner"></div>
                    <div class="logo-icon spinner-icon">A</div>
                </div>
                <h3>{analysisProgress}</h3>
                <p>
                    Our AI is analyzing your manuscript against 50+ guidelines.
                </p>
            </div>
        {:else if Object.keys(rulesAnalysisResults).length > 0}
            <!-- Results View -->
            <div class="results-view">
                <header class="results-header">
                    <div>
                        <div class="badge-pill">Analysis Complete</div>
                        <h2>{uploadedFileName}</h2>
                    </div>
                    <div class="header-actions">
                        <button
                            on:click={exportResults}
                            class="btn btn-secondary"
                            >Export Analysis JSON</button
                        >
                        <button
                            on:click={() => (rulesAnalysisResults = {})}
                            class="btn btn-primary">New Upload</button
                        >
                    </div>
                </header>

                {#if error}
                    <div class="alert-error">
                        <strong>Error:</strong>
                        {error}
                    </div>
                {/if}

                <!-- Stats Grid -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Pass Rate</div>
                        <div
                            class="stat-value"
                            style="color: {passRate > 70
                                ? 'var(--success)'
                                : 'var(--error)'}"
                        >
                            {passRate}%
                        </div>
                        <div class="stat-bar">
                            <div
                                class="stat-fill"
                                style="width: {passRate}%; background: {passRate >
                                70
                                    ? 'var(--success)'
                                    : 'var(--error)'}"
                            ></div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Issues Found</div>
                        <div class="stat-value text-error">
                            {failedRules.length}
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Rules Passed</div>
                        <div class="stat-value text-success">
                            {passedRules.length}
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total Checks</div>
                        <div class="stat-value">
                            {Object.keys(rulesAnalysisResults).length}
                        </div>
                    </div>
                </div>

                <!-- Document Viewer with DOCX Preview -->
                <DocumentViewer
                    documentBuffer={uploadedBuffer}
                    errors={validationResults}
                    {selectedError}
                    {currentFix}
                    {isGeneratingFix}
                    on:errorSelect={(e) => {
                        selectedError = e.detail;
                        selectedIssue = e.detail.name;
                    }}
                    on:generateFix={(e) => handleGenerateFix(e.detail)}
                    on:acceptFix={(e) => handleAcceptFix(e.detail)}
                    on:rejectFix={(e) => handleRejectFix(e.detail)}
                />
            </div>
        {:else}
            <!-- Upload State -->
            <div class="upload-view">
                <div class="upload-header">
                    <h1>Validate Your Manuscript</h1>
                    <p>
                        Upload your .docx file to check compliance with 50+
                        journal guidelines.
                    </p>
                </div>

                <label
                    class="upload-zone {isDragging ? 'dragging' : ''}"
                    on:dragenter|preventDefault={() => (isDragging = true)}
                    on:dragleave|preventDefault={() => (isDragging = false)}
                    on:dragover|preventDefault
                    on:drop|preventDefault={(e) => {
                        isDragging = false;
                        const file = e.dataTransfer?.files?.[0];
                        if (file) handleFileUpload(file);
                    }}
                >
                    <div class="upload-content">
                        <div class="upload-icon-wrapper">
                            <svg
                                class="upload-icon"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.5"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                /></svg
                            >
                            <div class="upload-glow"></div>
                        </div>
                        <h3>Drop your file here</h3>
                        <p>or click to browse</p>
                        <div class="file-type-badge">.docx files only</div>
                    </div>
                    <input
                        type="file"
                        accept=".docx"
                        style="display: none;"
                        on:change={(e) => {
                            const file = (e.currentTarget as HTMLInputElement)
                                .files?.[0];
                            if (file) handleFileUpload(file);
                        }}
                    />
                </label>

                <div class="features-row">
                    <div class="feature-pill">⚡️ Instant Analysis</div>
                    <div class="feature-pill">🔒 Secure & Private</div>
                    <div class="feature-pill">📚 50+ Journals</div>
                </div>
            </div>
        {/if}
    </main>
</div>

<!-- API Key Modal -->
{#if showApiKeyModal}
    <div class="modal-backdrop" on:click={() => (showApiKeyModal = false)}>
        <div class="modal-card" on:click|stopPropagation>
            <h3>Configure API Key</h3>
            <p>
                Enter your OpenRouter API key to enable manuscript validation.
            </p>
            <input
                type="text"
                bind:value={apiKeyInput}
                placeholder="sk-or-v1-..."
                class="api-input"
            />
            <div class="modal-actions">
                <button
                    on:click={() => (showApiKeyModal = false)}
                    class="btn btn-secondary">Cancel</button
                >
                <button on:click={handleSaveApiKey} class="btn btn-primary"
                    >Save Key</button
                >
            </div>
        </div>
    </div>
{/if}

<style>
    .dashboard-layout {
        min-height: 100vh;
        position: relative;
        background: var(--bg-body);
    }

    /* Nav */
    .nav {
        position: sticky;
        top: 0;
        z-index: 50;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border-light);
    }

    .nav-content {
        height: 70px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 700;
        font-size: 1.25rem;
        color: var(--text-main);
        text-decoration: none;
    }

    .logo-icon {
        width: 32px;
        height: 32px;
        background: var(--primary);
        color: white;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
    }

    .nav-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .user-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.75rem 0.25rem 0.25rem;
        background: white;
        border: 1px solid var(--border-light);
        border-radius: 999px;
    }

    .avatar {
        width: 24px;
        height: 24px;
        background: var(--primary-light);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .name {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    /* Main Content */
    .main-content {
        position: relative;
        z-index: 10;
        padding-top: 4rem;
        padding-bottom: 4rem;
        min-height: calc(100vh - 70px);
    }

    /* Upload View */
    .upload-view {
        max-width: 800px;
        margin: 0 auto;
        text-align: center;
        animation: fadeUp 0.6s ease-out;
    }

    .upload-header h1 {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .upload-header p {
        font-size: 1.25rem;
        color: var(--text-secondary);
        margin-bottom: 3rem;
    }

    .upload-zone {
        display: block;
        background: white;
        border: 2px dashed var(--border-medium);
        border-radius: var(--radius-xl);
        padding: 5rem 2rem;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }

    .upload-zone:hover,
    .upload-zone.dragging {
        border-color: var(--primary);
        transform: translateY(-5px);
        box-shadow: var(--shadow-xl);
    }

    .upload-icon-wrapper {
        position: relative;
        width: 80px;
        height: 80px;
        margin: 0 auto 1.5rem;
    }

    .upload-icon {
        width: 100%;
        height: 100%;
        color: var(--text-muted);
        transition: color 0.3s;
    }

    .upload-zone:hover .upload-icon {
        color: var(--primary);
    }

    .upload-glow {
        position: absolute;
        inset: 0;
        background: var(--primary);
        filter: blur(40px);
        opacity: 0;
        transition: opacity 0.3s;
        z-index: -1;
    }

    .upload-zone:hover .upload-glow {
        opacity: 0.2;
    }

    .file-type-badge {
        display: inline-block;
        margin-top: 1.5rem;
        padding: 0.5rem 1rem;
        background: var(--bg-body);
        color: var(--text-secondary);
        border-radius: 999px;
        font-size: 0.875rem;
        font-weight: 600;
    }

    .features-row {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        margin-top: 3rem;
    }

    .feature-pill {
        background: white;
        padding: 0.5rem 1rem;
        border-radius: 999px;
        border: 1px solid var(--border-light);
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
        box-shadow: var(--shadow-sm);
    }

    /* Loading State */
    .loading-state {
        text-align: center;
        padding-top: 5rem;
    }

    .spinner-container {
        position: relative;
        width: 80px;
        height: 80px;
        margin: 0 auto 2rem;
    }

    .spinner {
        position: absolute;
        inset: 0;
        border: 4px solid var(--border-light);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .spinner-icon {
        position: absolute;
        inset: 10px;
        width: auto;
        height: auto;
        border-radius: 50%;
        font-size: 1.5rem;
    }

    /* Results View */
    .results-view {
        animation: fadeUp 0.5s ease-out;
    }

    .results-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 2rem;
    }

    .badge-pill {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: var(--primary-light);
        color: white;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .header-actions {
        display: flex;
        gap: 1rem;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-light);
        box-shadow: var(--shadow-sm);
    }

    .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
    }

    .stat-value {
        font-size: 2rem;
        font-weight: 800;
        color: var(--text-main);
    }

    .stat-bar {
        height: 4px;
        background: var(--bg-body);
        border-radius: 2px;
        margin-top: 0.5rem;
        overflow: hidden;
    }

    .stat-fill {
        height: 100%;
        border-radius: 2px;
    }

    .text-error {
        color: var(--error);
    }
    .text-success {
        color: var(--success);
    }

    /* Inspector */
    .inspector-grid {
        display: grid;
        grid-template-columns: 350px 1fr;
        gap: 1.5rem;
        height: 600px;
    }

    .issues-list {
        display: flex;
        flex-direction: column;
        padding: 0;
        overflow: hidden;
    }

    .tabs {
        display: flex;
        padding: 1rem;
        border-bottom: 1px solid var(--border-light);
        gap: 0.5rem;
    }

    .tab {
        flex: 1;
        padding: 0.5rem;
        background: none;
        border: none;
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
    }

    .tab.active {
        background: var(--bg-body);
        color: var(--text-main);
    }

    .count-badge {
        display: inline-block;
        padding: 0.125rem 0.375rem;
        border-radius: 999px;
        font-size: 0.75rem;
        margin-left: 0.25rem;
    }

    .count-badge.error {
        background: #fee2e2;
        color: #991b1b;
    }
    .count-badge.success {
        background: #d1fae5;
        color: #065f46;
    }

    .list-content {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem;
    }

    .issue-item {
        width: 100%;
        text-align: left;
        padding: 1rem;
        border: none;
        background: none;
        border-radius: var(--radius-md);
        display: flex;
        gap: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .issue-item:hover {
        background: var(--bg-body);
    }

    .issue-item.selected {
        background: #eff6ff;
    }

    .issue-status {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-top: 0.4rem;
        flex-shrink: 0;
    }

    .issue-status.error {
        background: var(--error);
    }
    .issue-status.success {
        background: var(--success);
    }

    .issue-info h4 {
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
    }

    .issue-info p {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin: 0;
    }

    .issue-detail {
        padding: 2rem;
        overflow-y: auto;
    }

    .detail-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-light);
    }

    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
    }

    .status-badge.success {
        background: #d1fae5;
        color: #065f46;
    }
    .status-badge.error {
        background: #fee2e2;
        color: #991b1b;
    }

    .detail-section {
        margin-bottom: 2rem;
    }

    .detail-section label {
        display: block;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: 0.75rem;
        letter-spacing: 0.05em;
    }

    .analysis-box {
        padding: 1.5rem;
        border-radius: var(--radius-lg);
        font-size: 0.9375rem;
        line-height: 1.6;
    }

    .analysis-box.error {
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fee2e2;
    }
    .analysis-box.success {
        background: #f0fdf4;
        color: #166534;
        border: 1px solid #dcfce7;
    }

    .rule-text {
        background: var(--bg-body);
        padding: 1rem;
        border-radius: var(--radius-lg);
        font-family: var(--font-mono);
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .empty-state {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    /* Modal */
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-card {
        background: white;
        padding: 2rem;
        border-radius: var(--radius-xl);
        width: 100%;
        max-width: 480px;
        box-shadow: var(--shadow-xl);
    }

    .api-input {
        margin: 1.5rem 0;
        font-family: var(--font-mono);
    }

    .modal-actions {
        display: flex;
        gap: 1rem;
    }

    .modal-actions button {
        flex: 1;
    }

    @keyframes fadeUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    /* =========================================================================
       AUTOFIX STYLES
       ========================================================================= */

    .autofix-section {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px dashed var(--border-light);
    }

    .autofix-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
    }

    .autofix-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-main);
    }

    .btn-generate-fix {
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, var(--fix-accept) 0%, #40916c 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-generate-fix:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(45, 106, 79, 0.3);
    }

    .btn-generate-fix:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .generating-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: var(--fix-bg);
        border-radius: 12px;
        gap: 0.75rem;
    }

    .generating-placeholder .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(45, 106, 79, 0.2);
        border-top-color: var(--fix-accept);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .generating-placeholder p {
        color: var(--text-muted);
        font-style: italic;
        font-size: 0.9rem;
    }

    .detail-label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
        margin-bottom: 0.5rem;
    }
</style>
