<script lang="ts">
    /**
     * BatchFixPanel — Premium "Fix All" Experience
     *
     * Features:
     * - One-click fix generation for all failed rules
     * - Real-time progress with animated bar
     * - Live preview of generated fixes
     * - ETA calculation
     *
     * Design Principles (per rules-ui-front-end.md):
     * - System states visible: progress, current rule, ETA
     * - Information hierarchy: progress > current > completed
     * - Obvious interactions: single "Fix All" button
     */

    import { createEventDispatcher } from "svelte";
    import type {
        AutoFixResult,
        BatchProgressEvent,
    } from "../../services/autofix";

    // ========================================================================
    // PROPS
    // ========================================================================

    /** List of failed rules to fix */
    export let failedRulesCount = 0;
    /** Generated fixes so far */
    export let fixes: AutoFixResult[] = [];
    /** Is batch generation in progress */
    export let isGenerating = false;
    /** Current progress (0-1) */
    export let progress = 0;
    /** Name of the rule currently being processed */
    export let currentRule = "";
    /** Disable the panel (e.g., no failures to fix) */
    export let disabled = false;

    // ========================================================================
    // EVENTS
    // ========================================================================

    const dispatch = createEventDispatcher<{
        startBatch: void;
        cancelBatch: void;
        acceptAll: void;
        reviewFix: AutoFixResult;
        export: void;
    }>();

    // ========================================================================
    // LOCAL STATE
    // ========================================================================

    let startTime: number | null = null;
    let estimatedTimeRemaining = 0;

    // ========================================================================
    // COMPUTED
    // ========================================================================

    $: verifiedCount = fixes.filter((f) => f.verified).length;
    $: acceptedCount = fixes.filter((f) => f.status === "accepted").length;
    $: errorCount = fixes.filter((f) => f.status === "error").length;
    $: progressPercent = Math.round(progress * 100);

    // Update ETA when progress changes
    $: if (isGenerating && progress > 0 && startTime) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = progress / elapsed;
        estimatedTimeRemaining = Math.ceil((1 - progress) / rate);
    }

    // ========================================================================
    // HANDLERS
    // ========================================================================

    function handleStartBatch() {
        startTime = Date.now();
        dispatch("startBatch");
    }

    function handleCancel() {
        startTime = null;
        dispatch("cancelBatch");
    }

    function handleAcceptAll() {
        dispatch("acceptAll");
    }

    function handleReviewFix(fix: AutoFixResult) {
        dispatch("reviewFix", fix);
    }

    function handleExport() {
        dispatch("export");
    }

    function formatTime(seconds: number): string {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    }
</script>

<!-- ======================================================================== -->
<!-- TEMPLATE -->
<!-- ======================================================================== -->

<div class="batch-fix-panel" class:generating={isGenerating} class:disabled>
    <!-- HEADER -->
    <div class="panel-header">
        <div class="header-icon">🪄</div>
        <div class="header-text">
            <h3>Smart AutoFix</h3>
            <p>
                {#if disabled}
                    No issues to fix
                {:else if isGenerating}
                    Generating fixes...
                {:else if fixes.length > 0}
                    {fixes.length} fix{fixes.length !== 1 ? "es" : ""} ready
                {:else}
                    Fix all {failedRulesCount} issue{failedRulesCount !== 1
                        ? "s"
                        : ""} with AI
                {/if}
            </p>
        </div>
    </div>

    {#if isGenerating}
        <!-- GENERATING STATE -->
        <div class="generation-progress">
            <!-- Progress Bar -->
            <div class="progress-container">
                <div class="progress-bar">
                    <div
                        class="progress-fill"
                        style="width: {progressPercent}%"
                    ></div>
                    <div
                        class="progress-glow"
                        style="left: {progressPercent}%"
                    ></div>
                </div>
                <span class="progress-percent">{progressPercent}%</span>
            </div>

            <!-- Status Info -->
            <div class="status-info">
                <div class="current-rule">
                    <span class="spinner-small"></span>
                    <span>Fixing: <strong>{currentRule}</strong></span>
                </div>
                <div class="eta">
                    {#if estimatedTimeRemaining > 0}
                        ~{formatTime(estimatedTimeRemaining)} remaining
                    {:else}
                        Calculating...
                    {/if}
                </div>
            </div>

            <!-- Live Preview of Generated Fixes -->
            {#if fixes.length > 0}
                <div class="live-fixes">
                    <label>Completed ({fixes.length}/{failedRulesCount})</label>
                    <div class="fix-chips">
                        {#each fixes as fix (fix.id)}
                            <button
                                class="fix-chip"
                                class:verified={fix.verified}
                                class:error={fix.status === "error"}
                                on:click={() => handleReviewFix(fix)}
                            >
                                <span class="chip-status">
                                    {#if fix.verified}✓{:else if fix.status === "error"}⚠{:else}•{/if}
                                </span>
                                <span class="chip-name">{fix.ruleName}</span>
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- Cancel Button -->
            <button class="btn-cancel" on:click={handleCancel}> Cancel </button>
        </div>
    {:else if fixes.length > 0}
        <!-- FIXES READY STATE -->
        <div class="fixes-summary">
            <div class="summary-stats">
                <div class="stat">
                    <span class="stat-number">{fixes.length}</span>
                    <span class="stat-label">Ready</span>
                </div>
                <div class="stat verified">
                    <span class="stat-number">{verifiedCount}</span>
                    <span class="stat-label">Verified</span>
                </div>
                {#if errorCount > 0}
                    <div class="stat error">
                        <span class="stat-number">{errorCount}</span>
                        <span class="stat-label">Errors</span>
                    </div>
                {/if}
            </div>

            <div class="fix-chips scrollable">
                {#each fixes as fix (fix.id)}
                    <button
                        class="fix-chip"
                        class:verified={fix.verified}
                        class:error={fix.status === "error"}
                        class:accepted={fix.status === "accepted"}
                        on:click={() => handleReviewFix(fix)}
                    >
                        <span class="chip-status">
                            {#if fix.status === "accepted"}✓
                            {:else if fix.verified}🛡️
                            {:else if fix.status === "error"}⚠
                            {:else}•{/if}
                        </span>
                        <span class="chip-name">{fix.ruleName}</span>
                    </button>
                {/each}
            </div>

            <div class="action-buttons">
                {#if acceptedCount > 0}
                    <button class="btn-download" on:click={handleExport}>
                        ⬇️ Download Fixed DOCX ({acceptedCount})
                    </button>
                {:else if verifiedCount > 0}
                    <button class="btn-accept-all" on:click={handleAcceptAll}>
                        ✓ Accept All Verified ({verifiedCount})
                    </button>
                {/if}
                <button class="btn-regenerate" on:click={handleStartBatch}>
                    ↻ Regenerate All
                </button>
            </div>
        </div>
    {:else}
        <!-- INITIAL STATE -->
        <button
            class="btn-fix-all"
            on:click={handleStartBatch}
            disabled={disabled || failedRulesCount === 0}
        >
            <span class="btn-icon">✨</span>
            <span class="btn-text">
                Fix All {failedRulesCount} Issue{failedRulesCount !== 1
                    ? "s"
                    : ""}
            </span>
            <span class="btn-badge">AI-Powered</span>
        </button>

        <p class="hint">
            Generate intelligent fixes for all failed validation rules at once
        </p>
    {/if}
</div>

<!-- ======================================================================== -->
<!-- STYLES -->
<!-- ======================================================================== -->

<style>
    /* ====================================================================== */
    /* BASE PANEL */
    /* ====================================================================== */

    .batch-fix-panel {
        padding: 1.5rem;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 16px;
        color: white;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .batch-fix-panel.disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    /* ====================================================================== */
    /* HEADER */
    /* ====================================================================== */

    .panel-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.25rem;
    }

    .header-icon {
        font-size: 2rem;
    }

    .header-text h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
    }

    .header-text p {
        margin: 0.25rem 0 0;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.6);
    }

    /* ====================================================================== */
    /* FIX ALL BUTTON */
    /* ====================================================================== */

    .btn-fix-all {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    }

    .btn-fix-all:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(102, 126, 234, 0.5);
    }

    .btn-fix-all:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-icon {
        font-size: 1.2rem;
    }

    .btn-badge {
        padding: 0.2rem 0.5rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .hint {
        text-align: center;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.4);
        margin: 1rem 0 0;
    }

    /* ====================================================================== */
    /* PROGRESS */
    /* ====================================================================== */

    .generation-progress {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .progress-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .progress-bar {
        flex: 1;
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: visible;
        position: relative;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        border-radius: 4px;
        transition: width 0.3s ease;
    }

    .progress-glow {
        position: absolute;
        top: -4px;
        width: 16px;
        height: 16px;
        background: radial-gradient(
            circle,
            rgba(102, 126, 234, 0.6) 0%,
            transparent 70%
        );
        border-radius: 50%;
        transform: translateX(-50%);
        animation: pulse 1.5s ease-in-out infinite;
    }

    .progress-percent {
        min-width: 3rem;
        text-align: right;
        font-size: 0.85rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
    }

    .status-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
    }

    .current-rule {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: rgba(255, 255, 255, 0.8);
    }

    .current-rule strong {
        color: white;
    }

    .spinner-small {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 0.6;
        }
        50% {
            opacity: 1;
        }
    }

    .eta {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.8rem;
    }

    /* ====================================================================== */
    /* LIVE FIXES / FIX CHIPS */
    /* ====================================================================== */

    .live-fixes {
        margin-top: 0.5rem;
    }

    .live-fixes label {
        display: block;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 0.5rem;
    }

    .fix-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
    }

    .fix-chips.scrollable {
        max-height: 120px;
        overflow-y: auto;
    }

    .fix-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.35rem 0.65rem;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .fix-chip:hover {
        background: rgba(255, 255, 255, 0.15);
        color: white;
    }

    .fix-chip.verified {
        background: rgba(34, 197, 94, 0.15);
        border-color: rgba(34, 197, 94, 0.3);
        color: #86efac;
    }

    .fix-chip.accepted {
        background: rgba(34, 197, 94, 0.25);
        border-color: rgba(34, 197, 94, 0.5);
        color: #4ade80;
    }

    .fix-chip.error {
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.3);
        color: #fca5a5;
    }

    .chip-status {
        font-size: 0.7rem;
    }

    .chip-name {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* ====================================================================== */
    /* SUMMARY STATS */
    /* ====================================================================== */

    .fixes-summary {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .summary-stats {
        display: flex;
        gap: 1.5rem;
    }

    .stat {
        display: flex;
        align-items: baseline;
        gap: 0.35rem;
    }

    .stat-number {
        font-size: 1.5rem;
        font-weight: 700;
    }

    .stat-label {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    .stat.verified .stat-number {
        color: #4ade80;
    }

    .stat.error .stat-number {
        color: #f87171;
    }

    /* ====================================================================== */
    /* ACTION BUTTONS */
    /* ====================================================================== */

    .action-buttons {
        display: flex;
        gap: 0.75rem;
        margin-top: 0.5rem;
    }

    .btn-download {
        flex: 1;
        padding: 0.75rem 1rem;
        background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
    }

    .btn-download:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
    }

    .btn-accept-all {
        flex: 1;
        padding: 0.75rem 1rem;
        background: linear-gradient(135deg, #059669 0%, #10b981 100%);
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-accept-all:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    }

    .btn-regenerate,
    .btn-cancel {
        padding: 0.65rem 1rem;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-regenerate:hover,
    .btn-cancel:hover {
        border-color: rgba(255, 255, 255, 0.4);
        color: white;
    }
</style>
