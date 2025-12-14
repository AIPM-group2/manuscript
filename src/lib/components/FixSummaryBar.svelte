<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { AutoFixResult } from "../../services/autofix";

    export let fixes: AutoFixResult[] = [];
    export let isExporting = false;

    const dispatch = createEventDispatcher<{
        applyAll: void;
        export: void;
        clear: void;
    }>();

    $: pendingFixes = fixes.filter((f) => f.status === "generated");
    $: acceptedFixes = fixes.filter((f) => f.status === "accepted");
    $: rejectedFixes = fixes.filter((f) => f.status === "rejected");
    $: totalFixes = fixes.length;
</script>

{#if totalFixes > 0}
    <div class="fix-summary-bar">
        <div class="summary-stats">
            <div class="stat">
                <span class="stat-number">{totalFixes}</span>
                <span class="stat-label">fixes ready</span>
            </div>
            <div class="stat accepted">
                <span class="stat-number">{acceptedFixes.length}</span>
                <span class="stat-label">accepted</span>
            </div>
            <div class="stat rejected">
                <span class="stat-number">{rejectedFixes.length}</span>
                <span class="stat-label">rejected</span>
            </div>
        </div>

        <div class="summary-actions">
            {#if pendingFixes.length > 0}
                <button
                    class="btn-accept-all"
                    on:click={() => dispatch("applyAll")}
                >
                    ✓ Accept All ({pendingFixes.length})
                </button>
            {/if}

            {#if acceptedFixes.length > 0}
                <button
                    class="btn-export"
                    on:click={() => dispatch("export")}
                    disabled={isExporting}
                >
                    {#if isExporting}
                        <span class="spinner-small"></span>
                        Exporting...
                    {:else}
                        📥 Download Fixed DOCX
                    {/if}
                </button>
            {/if}

            <button class="btn-clear" on:click={() => dispatch("clear")}>
                ✕
            </button>
        </div>
    </div>
{/if}

<style>
    .fix-summary-bar {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2rem;
        padding: 1rem 1.5rem;
        background: #1a1a1a;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
        z-index: 1000;
        min-width: 500px;
        animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
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
        color: white;
    }

    .stat-label {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    .stat.accepted .stat-number {
        color: #4ade80;
    }

    .stat.rejected .stat-number {
        color: #f87171;
    }

    .summary-actions {
        display: flex;
        gap: 0.75rem;
    }

    .btn-accept-all,
    .btn-export {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 1.25rem;
        border: none;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-accept-all {
        background: rgba(74, 222, 128, 0.15);
        color: #4ade80;
        border: 1px solid rgba(74, 222, 128, 0.3);
    }

    .btn-accept-all:hover {
        background: rgba(74, 222, 128, 0.25);
    }

    .btn-export {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
    }

    .btn-export:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .btn-export:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .btn-clear {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.5);
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-clear:hover {
        border-color: rgba(255, 255, 255, 0.4);
        color: rgba(255, 255, 255, 0.8);
    }

    .spinner-small {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @media (max-width: 640px) {
        .fix-summary-bar {
            min-width: auto;
            left: 1rem;
            right: 1rem;
            transform: none;
            flex-direction: column;
            gap: 1rem;
        }
    }
</style>
