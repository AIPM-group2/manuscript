<script lang="ts">
    /**
     * AutoFixPanel — Premium Redesign
     *
     * Displays fix suggestions with:
     * - Inline diff visualization (insertions/deletions)
     * - Verification status badge
     * - Confidence indicator
     * - Alternative suggestions
     * - Smooth animations
     *
     * Design Principles (per rules-ui-front-end.md):
     * - Information hierarchy: status > diff > explanation > actions
     * - Obvious interactions: clear accept/reject buttons
     * - System states visible: generating, verified, error
     */

    import { createEventDispatcher, onMount } from "svelte";
    import type { AutoFixResult, DiffOperation } from "../../services/autofix";

    // ========================================================================
    // PROPS
    // ========================================================================

    export let fix: AutoFixResult | null = null;
    export let isGenerating = false;

    // ========================================================================
    // EVENTS
    // ========================================================================

    const dispatch = createEventDispatcher<{
        accept: AutoFixResult;
        reject: AutoFixResult;
        regenerate: { ruleId: number; ruleName: string };
    }>();

    // ========================================================================
    // LOCAL STATE
    // ========================================================================

    let showAlternatives = false;
    let viewMode: "diff" | "sideBySide" = "diff";
    let mounted = false;

    onMount(() => {
        mounted = true;
    });

    // ========================================================================
    // HANDLERS
    // ========================================================================

    function handleAccept() {
        if (fix) dispatch("accept", fix);
    }

    function handleReject() {
        if (fix) dispatch("reject", fix);
    }

    function handleRegenerate() {
        if (fix) {
            dispatch("regenerate", {
                ruleId: fix.ruleId,
                ruleName: fix.ruleName,
            });
        }
    }

    function toggleViewMode() {
        viewMode = viewMode === "diff" ? "sideBySide" : "diff";
    }

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    $: confidenceLevel = fix
        ? fix.confidence >= 0.8
            ? "high"
            : fix.confidence >= 0.5
              ? "medium"
              : "low"
        : "low";

    $: statusColor =
        fix?.status === "verified"
            ? "success"
            : fix?.status === "error"
              ? "error"
              : fix?.status === "accepted"
                ? "accepted"
                : fix?.status === "rejected"
                  ? "rejected"
                  : "pending";

    $: hasChanges = fix?.diff?.some((d) => d.op !== "equal") ?? false;
</script>

<!-- ======================================================================== -->
<!-- TEMPLATE -->
<!-- ======================================================================== -->

<div class="autofix-panel" class:generating={isGenerating} class:mounted>
    {#if isGenerating}
        <!-- GENERATING STATE -->
        <div class="generating-state">
            <div class="spinner-container">
                <div class="spinner"></div>
                <div class="spinner-glow"></div>
            </div>
            <p class="generating-text">Generating intelligent fix...</p>
            <p class="generating-hint">
                Analyzing content and generating correction
            </p>
        </div>
    {:else if fix}
        <!-- FIX CONTENT -->
        <div class="fix-content">
            <!-- HEADER ROW: Status + Confidence -->
            <div class="header-row">
                <div class="status-section">
                    <span class="status-badge {statusColor}">
                        {#if fix.status === "verified"}
                            <span class="status-icon">✓</span>
                            <span>Verified</span>
                        {:else if fix.status === "generated"}
                            <span class="status-icon">✨</span>
                            <span>Fix Ready</span>
                        {:else if fix.status === "accepted"}
                            <span class="status-icon">✓</span>
                            <span>Accepted</span>
                        {:else if fix.status === "rejected"}
                            <span class="status-icon">✗</span>
                            <span>Rejected</span>
                        {:else if fix.status === "error"}
                            <span class="status-icon">⚠</span>
                            <span>Error</span>
                        {:else}
                            <span class="status-icon">⏳</span>
                            <span>Pending</span>
                        {/if}
                    </span>

                    {#if fix.verified && fix.verificationMessage}
                        <span class="verification-badge">
                            <span class="verification-icon">🛡️</span>
                            {fix.verificationMessage}
                        </span>
                    {/if}
                </div>

                <div class="confidence-section">
                    <div class="confidence-bar">
                        <div
                            class="confidence-fill {confidenceLevel}"
                            style="width: {fix.confidence * 100}%"
                        ></div>
                    </div>
                    <span class="confidence-label">
                        {Math.round(fix.confidence * 100)}% confident
                    </span>
                </div>
            </div>

            <!-- CATEGORY TAG -->
            {#if fix.category && fix.category !== "unknown"}
                <div class="category-tag">
                    <span class="category-icon">
                        {#if fix.category === "formatting"}📝
                        {:else if fix.category === "citation"}📚
                        {:else if fix.category === "structural"}🏗️
                        {:else if fix.category === "declaration"}📋
                        {:else if fix.category === "content"}✏️
                        {:else}🔧
                        {/if}
                    </span>
                    {fix.category.charAt(0).toUpperCase() +
                        fix.category.slice(1)} Fix
                </div>
            {/if}

            <!-- VIEW MODE TOGGLE -->
            <div class="view-toggle">
                <button
                    class="toggle-btn"
                    class:active={viewMode === "diff"}
                    on:click={() => (viewMode = "diff")}
                >
                    Inline Diff
                </button>
                <button
                    class="toggle-btn"
                    class:active={viewMode === "sideBySide"}
                    on:click={() => (viewMode = "sideBySide")}
                >
                    Side by Side
                </button>
            </div>

            <!-- DIFF VISUALIZATION -->
            {#if viewMode === "diff" && fix.diff && fix.diff.length > 0}
                <div class="diff-inline-container">
                    <label>📝 Changes</label>
                    <div class="diff-inline">
                        {#each fix.diff as op}
                            {#if op.op === "equal"}
                                <span class="diff-equal">{op.text}</span>
                            {:else if op.op === "insert"}
                                <span class="diff-insert">{op.text}</span>
                            {:else if op.op === "delete"}
                                <span class="diff-delete">{op.text}</span>
                            {/if}
                        {/each}
                    </div>
                </div>
            {:else}
                <!-- SIDE BY SIDE VIEW -->
                <div class="diff-side-by-side">
                    <div class="diff-section original">
                        <label>📄 Original</label>
                        <div class="diff-box">
                            {fix.original || "No content extracted"}
                        </div>
                    </div>

                    <div class="diff-arrow">→</div>

                    <div class="diff-section suggested">
                        <label>✨ Suggested</label>
                        <div class="diff-box">
                            {fix.suggested || "No suggestion available"}
                        </div>
                    </div>
                </div>
            {/if}

            <!-- EXPLANATION -->
            {#if fix.explanation}
                <div class="explanation">
                    <label>💡 What changed</label>
                    <p>{fix.explanation}</p>
                </div>
            {/if}

            <!-- ERROR MESSAGE -->
            {#if fix.status === "error" && fix.errorMessage}
                <div class="error-message">
                    <span class="error-icon">⚠️</span>
                    <p>{fix.errorMessage}</p>
                </div>
            {/if}

            <!-- ACTIONS -->
            {#if fix.status === "generated" || fix.status === "verified"}
                <div class="actions">
                    <button class="btn-accept" on:click={handleAccept}>
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                        >
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Accept Fix
                    </button>
                    <button class="btn-reject" on:click={handleReject}>
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                        >
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                        Reject
                    </button>
                </div>
                <button class="btn-regenerate" on:click={handleRegenerate}>
                    ↻ Try a different fix
                </button>
            {:else if fix.status === "accepted"}
                <div class="status-message success">
                    <span class="status-message-icon">✓</span>
                    <span>Fix accepted — will be applied on export</span>
                    <button class="btn-undo" on:click={handleReject}
                        >Undo</button
                    >
                </div>
            {:else if fix.status === "rejected"}
                <div class="status-message rejected">
                    <span>Fix rejected</span>
                    <button
                        class="btn-regenerate-small"
                        on:click={handleRegenerate}
                    >
                        Try again
                    </button>
                </div>
            {:else if fix.status === "error"}
                <button class="btn-regenerate" on:click={handleRegenerate}>
                    ↻ Try again
                </button>
            {/if}
        </div>
    {:else}
        <!-- EMPTY STATE -->
        <div class="empty-state">
            <div class="empty-icon">🔧</div>
            <p class="empty-title">No fix generated yet</p>
            <p class="empty-hint">
                Click "Generate Fix" on a failed rule to get started
            </p>
        </div>
    {/if}
</div>

<!-- ======================================================================== -->
<!-- STYLES -->
<!-- ======================================================================== -->

<style>
    /* ====================================================================== */
    /* BASE PANEL */
    /* ====================================================================== */

    .autofix-panel {
        padding: 1.5rem;
        background: linear-gradient(135deg, #faf9f7 0%, #f5f3ef 100%);
        border-radius: 16px;
        border: 1px solid rgba(0, 0, 0, 0.06);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        opacity: 0;
        transform: translateY(8px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .autofix-panel.mounted {
        opacity: 1;
        transform: translateY(0);
    }

    /* ====================================================================== */
    /* GENERATING STATE */
    /* ====================================================================== */

    .generating-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 2rem;
        gap: 1rem;
    }

    .spinner-container {
        position: relative;
        width: 48px;
        height: 48px;
    }

    .spinner {
        width: 48px;
        height: 48px;
        border: 3px solid rgba(45, 106, 79, 0.15);
        border-top-color: #2d6a4f;
        border-radius: 50%;
        animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    .spinner-glow {
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        background: radial-gradient(
            circle,
            rgba(45, 106, 79, 0.15) 0%,
            transparent 70%
        );
        animation: pulse 2s ease-in-out infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 0.5;
            transform: scale(1);
        }
        50% {
            opacity: 1;
            transform: scale(1.1);
        }
    }

    .generating-text {
        color: #2d6a4f;
        font-weight: 600;
        font-size: 1rem;
    }

    .generating-hint {
        color: #666;
        font-size: 0.85rem;
    }

    /* ====================================================================== */
    /* HEADER ROW */
    /* ====================================================================== */

    .header-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .status-section {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.4rem 0.85rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    .status-badge.success {
        background: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%);
        color: white;
    }

    .status-badge.pending {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
    }

    .status-badge.accepted {
        background: #2d6a4f;
        color: white;
    }

    .status-badge.rejected {
        background: #9d4e4e;
        color: white;
    }

    .status-badge.error {
        background: #dc8a1a;
        color: white;
    }

    .status-icon {
        font-size: 0.9rem;
    }

    .verification-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.75rem;
        background: rgba(45, 106, 79, 0.1);
        border-radius: 12px;
        font-size: 0.75rem;
        color: #2d6a4f;
        font-weight: 500;
    }

    .confidence-section {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
    }

    .confidence-bar {
        width: 80px;
        height: 6px;
        background: rgba(0, 0, 0, 0.08);
        border-radius: 3px;
        overflow: hidden;
    }

    .confidence-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.5s ease-out;
    }

    .confidence-fill.high {
        background: linear-gradient(90deg, #2d6a4f, #40916c);
    }

    .confidence-fill.medium {
        background: linear-gradient(90deg, #c9a227, #e0b82a);
    }

    .confidence-fill.low {
        background: linear-gradient(90deg, #9d4e4e, #b85c5c);
    }

    .confidence-label {
        font-size: 0.7rem;
        color: #888;
    }

    /* ====================================================================== */
    /* CATEGORY TAG */
    /* ====================================================================== */

    .category-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.3rem 0.65rem;
        background: rgba(0, 0, 0, 0.04);
        border-radius: 8px;
        font-size: 0.75rem;
        color: #666;
        margin-bottom: 1rem;
    }

    .category-icon {
        font-size: 0.85rem;
    }

    /* ====================================================================== */
    /* VIEW TOGGLE */
    /* ====================================================================== */

    .view-toggle {
        display: flex;
        gap: 0.25rem;
        margin-bottom: 1rem;
        padding: 0.25rem;
        background: rgba(0, 0, 0, 0.04);
        border-radius: 8px;
        width: fit-content;
    }

    .toggle-btn {
        padding: 0.4rem 0.75rem;
        border: none;
        background: transparent;
        border-radius: 6px;
        font-size: 0.8rem;
        color: #666;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .toggle-btn.active {
        background: white;
        color: #2d6a4f;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .toggle-btn:hover:not(.active) {
        color: #333;
    }

    /* ====================================================================== */
    /* INLINE DIFF */
    /* ====================================================================== */

    .diff-inline-container {
        margin-bottom: 1.25rem;
    }

    .diff-inline-container label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
        color: #666;
    }

    .diff-inline {
        padding: 1rem;
        background: white;
        border-radius: 10px;
        border: 1px solid rgba(0, 0, 0, 0.06);
        font-size: 0.92rem;
        line-height: 1.7;
        max-height: 300px;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
    }

    .diff-equal {
        color: #333;
    }

    .diff-insert {
        background: linear-gradient(
            135deg,
            rgba(34, 197, 94, 0.25) 0%,
            rgba(34, 197, 94, 0.15) 100%
        );
        color: #15803d;
        padding: 0.1em 0.25em;
        border-radius: 3px;
        text-decoration: none;
        animation: highlightIn 0.5s ease-out;
    }

    .diff-delete {
        background: linear-gradient(
            135deg,
            rgba(239, 68, 68, 0.25) 0%,
            rgba(239, 68, 68, 0.15) 100%
        );
        color: #b91c1c;
        text-decoration: line-through;
        padding: 0.1em 0.25em;
        border-radius: 3px;
        opacity: 0.8;
    }

    @keyframes highlightIn {
        from {
            background: rgba(34, 197, 94, 0.5);
            transform: scale(1.02);
        }
        to {
            background: rgba(34, 197, 94, 0.25);
            transform: scale(1);
        }
    }

    /* ====================================================================== */
    /* SIDE BY SIDE DIFF */
    /* ====================================================================== */

    .diff-side-by-side {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 1rem;
        margin-bottom: 1.25rem;
    }

    .diff-arrow {
        display: flex;
        align-items: center;
        font-size: 1.5rem;
        color: #ccc;
    }

    .diff-section label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
        color: #666;
    }

    .diff-box {
        padding: 1rem;
        border-radius: 10px;
        font-size: 0.9rem;
        line-height: 1.6;
        max-height: 200px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .original .diff-box {
        background: rgba(239, 68, 68, 0.06);
        border: 1px solid rgba(239, 68, 68, 0.15);
    }

    .suggested .diff-box {
        background: rgba(34, 197, 94, 0.06);
        border: 1px solid rgba(34, 197, 94, 0.15);
    }

    /* ====================================================================== */
    /* EXPLANATION */
    /* ====================================================================== */

    .explanation {
        margin-bottom: 1.5rem;
        padding: 0.85rem 1rem;
        background: rgba(59, 130, 246, 0.06);
        border-radius: 10px;
        border-left: 3px solid #3b82f6;
    }

    .explanation label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        margin-bottom: 0.35rem;
        color: #3b82f6;
    }

    .explanation p {
        font-size: 0.9rem;
        color: #333;
        margin: 0;
        line-height: 1.5;
    }

    /* ====================================================================== */
    /* ERROR MESSAGE */
    /* ====================================================================== */

    .error-message {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.85rem 1rem;
        background: rgba(239, 68, 68, 0.08);
        border-radius: 10px;
        border-left: 3px solid #ef4444;
        margin-bottom: 1rem;
    }

    .error-icon {
        font-size: 1rem;
    }

    .error-message p {
        font-size: 0.9rem;
        color: #b91c1c;
        margin: 0;
    }

    /* ====================================================================== */
    /* ACTIONS */
    /* ====================================================================== */

    .actions {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
    }

    .btn-accept,
    .btn-reject {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.9rem 1.25rem;
        border: none;
        border-radius: 10px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-accept {
        background: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(45, 106, 79, 0.2);
    }

    .btn-accept:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(45, 106, 79, 0.3);
    }

    .btn-reject {
        background: transparent;
        border: 2px solid #9d4e4e;
        color: #9d4e4e;
    }

    .btn-reject:hover {
        background: rgba(157, 78, 78, 0.08);
    }

    .btn-regenerate {
        width: 100%;
        padding: 0.65rem;
        background: transparent;
        border: 1px dashed rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        color: #666;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-regenerate:hover {
        border-color: #333;
        color: #333;
    }

    /* ====================================================================== */
    /* STATUS MESSAGES */
    /* ====================================================================== */

    .status-message {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.85rem 1rem;
        border-radius: 10px;
        font-size: 0.9rem;
    }

    .status-message.success {
        background: rgba(45, 106, 79, 0.08);
        color: #2d6a4f;
    }

    .status-message.rejected {
        background: rgba(157, 78, 78, 0.08);
        color: #9d4e4e;
    }

    .status-message-icon {
        margin-right: 0.5rem;
    }

    .btn-undo,
    .btn-regenerate-small {
        padding: 0.4rem 0.75rem;
        background: transparent;
        border: 1px solid currentColor;
        border-radius: 6px;
        color: inherit;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-undo:hover,
    .btn-regenerate-small:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    /* ====================================================================== */
    /* EMPTY STATE */
    /* ====================================================================== */

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 2rem;
        text-align: center;
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }

    .empty-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #333;
        margin-bottom: 0.5rem;
    }

    .empty-hint {
        font-size: 0.9rem;
        color: #888;
    }

    /* ====================================================================== */
    /* RESPONSIVE */
    /* ====================================================================== */

    @media (max-width: 640px) {
        .header-row {
            flex-direction: column;
        }

        .confidence-section {
            align-items: flex-start;
        }

        .diff-side-by-side {
            grid-template-columns: 1fr;
        }

        .diff-arrow {
            justify-content: center;
            transform: rotate(90deg);
        }

        .actions {
            flex-direction: column;
        }
    }
</style>
