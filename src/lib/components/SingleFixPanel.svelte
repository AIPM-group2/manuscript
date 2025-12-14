<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fade, fly } from "svelte/transition";
    import type { RuleResult } from "../../types/rules";

    export let error: RuleResult | null = null;
    export let fix: {
        original: string;
        suggested: string;
        ruleName: string;
    } | null = null;
    export let isGenerating = false;

    const dispatch = createEventDispatcher<{
        generate: RuleResult;
        apply: { original: string; suggested: string };
        cancel: void;
    }>();

    function handleGenerate() {
        if (error) {
            dispatch("generate", error);
        }
    }

    function handleApply() {
        if (fix) {
            dispatch("apply", fix);
        }
    }

    function handleCancel() {
        dispatch("cancel");
    }

    // Simple diff highlighting
    function getChangedParts(
        original: string,
        suggested: string,
    ): { removed: string; added: string } {
        return {
            removed: original,
            added: suggested,
        };
    }
</script>

{#if error}
    <div class="single-fix-panel" in:fly={{ y: 20, duration: 300 }} out:fade>
        <div class="panel-header">
            <div class="header-left">
                <span class="fix-icon">🔧</span>
                <h3>Fix: {error.name}</h3>
            </div>
            <button class="close-btn" on:click={handleCancel}>×</button>
        </div>

        <div class="panel-content">
            <!-- Error Info -->
            <div class="error-info">
                <div class="info-row">
                    <span class="label">Issue:</span>
                    <span class="value">{error.message}</span>
                </div>
                {#if error.snippet}
                    <div class="info-row">
                        <span class="label">Found:</span>
                        <code class="snippet">{error.snippet}</code>
                    </div>
                {/if}
                {#if error.suggestion}
                    <div class="info-row">
                        <span class="label">Suggestion:</span>
                        <span class="value">{error.suggestion}</span>
                    </div>
                {/if}
            </div>

            {#if !fix && !isGenerating}
                <!-- Generate Fix Button -->
                <button class="generate-btn" on:click={handleGenerate}>
                    <span>✨</span> Generate Fix
                </button>
            {:else if isGenerating}
                <!-- Loading State -->
                <div class="generating">
                    <div class="spinner"></div>
                    <span>Generating fix...</span>
                </div>
            {:else if fix}
                <!-- Show Diff -->
                <div class="diff-view">
                    <div class="diff-header">Proposed Change</div>
                    <div class="diff-content">
                        <div class="diff-row removed">
                            <span class="diff-indicator">−</span>
                            <span class="diff-text">{fix.original}</span>
                        </div>
                        <div class="diff-row added">
                            <span class="diff-indicator">+</span>
                            <span class="diff-text">{fix.suggested}</span>
                        </div>
                    </div>
                </div>

                <div class="action-buttons">
                    <button class="apply-btn" on:click={handleApply}>
                        ✓ Apply Fix
                    </button>
                    <button class="cancel-btn" on:click={handleCancel}>
                        Cancel
                    </button>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .single-fix-panel {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 420px;
        max-width: calc(100vw - 48px);
        background: white;
        border-radius: 16px;
        box-shadow:
            0 20px 40px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(0, 0, 0, 0.05);
        z-index: 1000;
        overflow: hidden;
    }

    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .fix-icon {
        font-size: 1.25rem;
    }

    .panel-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
    }

    .close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        font-size: 1.25rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    .panel-content {
        padding: 20px;
    }

    .error-info {
        margin-bottom: 16px;
    }

    .info-row {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 0.875rem;
    }

    .label {
        font-weight: 600;
        color: #64748b;
        min-width: 70px;
    }

    .value {
        color: #1e293b;
    }

    .snippet {
        background: #fef3c7;
        color: #92400e;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.8rem;
    }

    .generate-btn {
        width: 100%;
        padding: 12px 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition:
            transform 0.2s,
            box-shadow 0.2s;
    }

    .generate-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .generating {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 16px;
        color: #64748b;
    }

    .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #e2e8f0;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .diff-view {
        background: #f8fafc;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 16px;
    }

    .diff-header {
        padding: 10px 14px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748b;
        background: #e2e8f0;
    }

    .diff-content {
        padding: 12px 14px;
    }

    .diff-row {
        display: flex;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 6px;
        margin-bottom: 6px;
        font-family: ui-monospace, monospace;
        font-size: 0.8rem;
    }

    .diff-row.removed {
        background: #fef2f2;
        color: #991b1b;
    }

    .diff-row.added {
        background: #f0fdf4;
        color: #166534;
    }

    .diff-indicator {
        font-weight: 700;
        width: 14px;
        flex-shrink: 0;
    }

    .diff-text {
        word-break: break-word;
    }

    .action-buttons {
        display: flex;
        gap: 10px;
    }

    .apply-btn {
        flex: 1;
        padding: 12px 16px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .apply-btn:hover {
        transform: translateY(-2px);
    }

    .cancel-btn {
        padding: 12px 16px;
        background: #f1f5f9;
        color: #475569;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    }

    .cancel-btn:hover {
        background: #e2e8f0;
    }
</style>
