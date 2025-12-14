<!--
    ExportModal.svelte — Premium Export Progress Modal
    
    Features:
    - Visual progress as fixes are applied
    - Per-fix status (success/failure)
    - Change summary with download button
    - Elegant dark theme matching BatchFixPanel
    
    Design Principles (per rules-ui-front-end.md):
    - System states visible: progress, status per fix
    - Information hierarchy: overall progress > per-fix status > actions
    - Obvious next action: Download button
-->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { AutoFixResult } from "../../services/autofix";

    // ========================================================================
    // PROPS
    // ========================================================================

    /** Whether the modal is visible */
    export let visible = false;
    /** Export state */
    export let state: "preparing" | "applying" | "complete" | "error" =
        "preparing";
    /** Fixes being applied */
    export let fixes: AutoFixResult[] = [];
    /** Current fix index being applied */
    export let currentFixIndex = 0;
    /** Error message if state is 'error' */
    export let errorMessage = "";
    /** Results per fix (true=success, false=failed) */
    export let fixResults: Map<string, boolean> = new Map();
    /** Document name for download */
    export let documentName = "document";

    // ========================================================================
    // EVENTS
    // ========================================================================

    const dispatch = createEventDispatcher<{
        close: void;
        download: void;
    }>();

    // ========================================================================
    // COMPUTED
    // ========================================================================

    $: progressPercent =
        fixes.length > 0
            ? Math.round((currentFixIndex / fixes.length) * 100)
            : 0;
    $: successCount = Array.from(fixResults.values()).filter((v) => v).length;
    $: failCount = Array.from(fixResults.values()).filter((v) => !v).length;

    // ========================================================================
    // HANDLERS
    // ========================================================================

    function handleClose() {
        dispatch("close");
    }

    function handleDownload() {
        dispatch("download");
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget && state !== "applying") {
            handleClose();
        }
    }
</script>

<!-- ======================================================================== -->
<!-- TEMPLATE -->
<!-- ======================================================================== -->

{#if visible}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="modal-backdrop" on:click={handleBackdropClick}>
        <div class="modal-card">
            <!-- HEADER -->
            <div class="modal-header">
                <div class="header-icon">
                    {#if state === "complete"}📄{:else if state === "error"}⚠️{:else}⚙️{/if}
                </div>
                <h2>
                    {#if state === "preparing"}
                        Preparing Export...
                    {:else if state === "applying"}
                        Applying Fixes...
                    {:else if state === "complete"}
                        Export Complete
                    {:else}
                        Export Failed
                    {/if}
                </h2>
            </div>

            <!-- CONTENT -->
            <div class="modal-content">
                {#if state === "preparing"}
                    <div class="spinner-container">
                        <div class="spinner"></div>
                        <p>Preparing your document...</p>
                    </div>
                {:else if state === "applying"}
                    <!-- Progress Bar -->
                    <div class="progress-section">
                        <div class="progress-bar">
                            <div
                                class="progress-fill"
                                style="width: {progressPercent}%"
                            ></div>
                        </div>
                        <span class="progress-text"
                            >{currentFixIndex}/{fixes.length} fixes applied</span
                        >
                    </div>

                    <!-- Fix List -->
                    <div class="fix-list">
                        {#each fixes as fix, i}
                            <div
                                class="fix-item"
                                class:active={i === currentFixIndex}
                                class:done={i < currentFixIndex}
                            >
                                <span class="fix-status">
                                    {#if i < currentFixIndex}
                                        {fixResults.get(fix.id) ? "✓" : "✗"}
                                    {:else if i === currentFixIndex}
                                        <span class="spinner-tiny"></span>
                                    {:else}
                                        ○
                                    {/if}
                                </span>
                                <span class="fix-name">{fix.ruleName}</span>
                            </div>
                        {/each}
                    </div>
                {:else if state === "complete"}
                    <!-- Success Summary -->
                    <div class="success-summary">
                        <div class="success-icon">✅</div>
                        <p class="success-message">
                            Your document is ready with <strong
                                >{successCount}</strong
                            >
                            fix{successCount !== 1 ? "es" : ""} applied.
                        </p>
                        {#if failCount > 0}
                            <p class="partial-warning">
                                ⚠️ {failCount} fix{failCount !== 1 ? "es" : ""} could
                                not be applied (text not found in document).
                            </p>
                        {/if}
                    </div>

                    <!-- Change Summary -->
                    <div class="change-summary">
                        <h4>Changes Applied:</h4>
                        <ul>
                            {#each fixes as fix}
                                {#if fixResults.get(fix.id)}
                                    <li class="change-item">
                                        <span class="change-check">✓</span>
                                        <span class="change-rule"
                                            >{fix.ruleName}</span
                                        >
                                    </li>
                                {/if}
                            {/each}
                        </ul>
                    </div>

                    <!-- Download Button -->
                    <button class="btn-download" on:click={handleDownload}>
                        <span class="btn-icon">⬇️</span>
                        <span class="btn-text">Download Fixed Document</span>
                    </button>
                    <p class="file-name">{documentName}</p>
                {:else}
                    <!-- Error State -->
                    <div class="error-state">
                        <p class="error-message">{errorMessage}</p>
                        <button class="btn-close" on:click={handleClose}
                            >Close</button
                        >
                    </div>
                {/if}
            </div>

            <!-- CLOSE BUTTON (only when not applying) -->
            {#if state !== "applying"}
                <button class="close-button" on:click={handleClose}>✕</button>
            {/if}
        </div>
    </div>
{/if}

<!-- ======================================================================== -->
<!-- STYLES -->
<!-- ======================================================================== -->

<style>
    /* Backdrop */
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    /* Modal Card */
    .modal-card {
        position: relative;
        width: 90%;
        max-width: 480px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 20px;
        padding: 2rem;
        color: white;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
        animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    /* Header */
    .modal-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .header-icon {
        font-size: 2rem;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
    }

    /* Content */
    .modal-content {
        min-height: 150px;
    }

    /* Spinner */
    .spinner-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem 0;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top-color: #667eea;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    .spinner-tiny {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-top-color: #667eea;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    /* Progress Section */
    .progress-section {
        margin-bottom: 1.5rem;
    }

    .progress-bar {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        border-radius: 4px;
        transition: width 0.3s ease;
    }

    .progress-text {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.6);
    }

    /* Fix List */
    .fix-list {
        max-height: 200px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .fix-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.5);
        transition: all 0.2s ease;
    }

    .fix-item.active {
        background: rgba(102, 126, 234, 0.15);
        color: white;
    }

    .fix-item.done {
        color: rgba(255, 255, 255, 0.7);
    }

    .fix-status {
        width: 20px;
        text-align: center;
        font-size: 0.8rem;
    }

    .fix-item.done .fix-status {
        color: #4ade80;
    }

    /* Success Summary */
    .success-summary {
        text-align: center;
        margin-bottom: 1.5rem;
    }

    .success-icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
    }

    .success-message {
        font-size: 1rem;
        margin: 0 0 0.5rem;
    }

    .partial-warning {
        font-size: 0.85rem;
        color: #fbbf24;
        margin: 0;
    }

    /* Change Summary */
    .change-summary {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1.5rem;
    }

    .change-summary h4 {
        margin: 0 0 0.75rem;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.6);
    }

    .change-summary ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .change-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
    }

    .change-check {
        color: #4ade80;
    }

    /* Download Button */
    .btn-download {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1rem;
        background: linear-gradient(135deg, #059669 0%, #10b981 100%);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
    }

    .btn-download:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(16, 185, 129, 0.5);
    }

    .file-name {
        text-align: center;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.4);
        margin: 0.75rem 0 0;
    }

    /* Error State */
    .error-state {
        text-align: center;
        padding: 1rem;
    }

    .error-message {
        color: #f87171;
        margin-bottom: 1rem;
    }

    .btn-close {
        padding: 0.75rem 2rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: white;
        cursor: pointer;
    }

    /* Close Button */
    .close-button {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 50%;
        color: rgba(255, 255, 255, 0.6);
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .close-button:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
    }
</style>
