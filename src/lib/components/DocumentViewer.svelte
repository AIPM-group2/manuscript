<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import type { RuleResult } from "../../types/rules";
    import AutoFixPanel from "./AutoFixPanel.svelte";
    import type { AutoFixResult } from "../../services/autofix";

    export let documentBuffer: ArrayBuffer | null = null;
    export let errors: RuleResult[] = [];
    export let selectedError: RuleResult | null = null;
    export let currentFix: AutoFixResult | null = null;
    export let isGeneratingFix = false;

    const dispatch = createEventDispatcher<{
        errorSelect: RuleResult;
        generateFix: string;
        acceptFix: AutoFixResult;
        rejectFix: AutoFixResult;
    }>();

    let docxContainer: HTMLDivElement;
    let isLoading = false;
    let renderError = "";
    let hasRendered = false;
    let lastBufferSize = 0; // Track buffer to prevent re-renders

    // Only render when buffer actually changes (new upload)
    $: if (documentBuffer && docxContainer && !hasRendered) {
        const currentSize = documentBuffer.byteLength;
        if (currentSize !== lastBufferSize) {
            lastBufferSize = currentSize;
            renderDocx(documentBuffer);
        }
    }

    async function renderDocx(buffer: ArrayBuffer) {
        if (hasRendered && buffer.byteLength === lastBufferSize) {
            return; // Already rendered this buffer
        }

        isLoading = true;
        renderError = "";

        try {
            // Dynamic import for docx-preview (client-side only)
            const docxPreview = await import("docx-preview");

            // Clear previous content and any existing highlights
            docxContainer.innerHTML = "";

            // Render the DOCX with enhanced options for high-fidelity
            await docxPreview.renderAsync(buffer, docxContainer, undefined, {
                className: "docx-viewer",
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false,
                ignoreFonts: false,
                breakPages: true,
                useBase64URL: true,
                renderHeaders: true,
                renderFooters: true,
                renderFootnotes: true,
                renderEndnotes: true,
                // Enhanced options for better structure preservation
                experimental: true,
                renderComments: false,
                debug: false,
            });

            hasRendered = true;
            isLoading = false;
        } catch (err: any) {
            console.error("DOCX render error:", err);
            renderError = err.message || "Failed to render document";
            isLoading = false;
        }
    }

    function getSeverity(error: RuleResult): "critical" | "warning" | "info" {
        return (
            error.location?.severity ||
            (error.status === "FAIL" ? "critical" : "warning")
        );
    }

    function handleErrorClick(error: RuleResult) {
        dispatch("errorSelect", error);

        // Priority 1: Try exact text from location.text
        if (error.location?.text) {
            highlightExactText(error.location.text, error);
            return;
        }

        // Priority 2: Try snippet field
        if (error.snippet) {
            highlightExactText(error.snippet, error);
            return;
        }

        // Priority 3: Fallback to section-based scrolling
        scrollToSection(error.location?.section || "general");
    }

    /**
     * Highlight exact text in the rendered document.
     * Uses TreeWalker to find the text and wraps it in a highlight element.
     */
    function highlightExactText(searchText: string, error: RuleResult) {
        if (!docxContainer || !searchText || searchText.length < 3) {
            scrollToSection(error.location?.section || "general");
            return;
        }

        // Remove any existing highlights first
        const existingHighlights = docxContainer.querySelectorAll(
            ".error-highlight-text",
        );
        existingHighlights.forEach((el) => {
            const parent = el.parentNode;
            if (parent) {
                parent.replaceChild(
                    document.createTextNode(el.textContent || ""),
                    el,
                );
                parent.normalize(); // Merge adjacent text nodes
            }
        });

        // Normalize the search text (handle line breaks, extra spaces)
        const normalizedSearch = searchText
            .trim()
            .replace(/\s+/g, " ")
            .substring(0, 100);

        // Use TreeWalker to find text nodes, skipping TOC elements
        const walker = document.createTreeWalker(
            docxContainer,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node: Node) => {
                    // Skip nodes inside Table of Contents
                    const parent = node.parentElement;
                    if (parent) {
                        // Check for various TOC indicators
                        const isTOC =
                            parent.closest(
                                '.toc, [class*="toc"], [class*="TableOfContents"], nav',
                            ) ||
                            parent.style
                                ?.getPropertyValue("mso-field-code")
                                ?.includes("TOC") ||
                            parent.closest("[data-toc]");
                        if (isTOC) {
                            return NodeFilter.FILTER_REJECT;
                        }
                    }
                    return NodeFilter.FILTER_ACCEPT;
                },
            },
        );

        let node: Text | null;
        let foundNode: Text | null = null;
        let foundIndex = -1;

        while ((node = walker.nextNode() as Text | null)) {
            const content = node.textContent || "";
            // Normalize content for comparison
            const normalizedContent = content.replace(/\s+/g, " ");

            // Try exact match first
            let index = normalizedContent.indexOf(normalizedSearch);

            // If no exact match, try partial match (first 50 chars)
            if (index === -1 && normalizedSearch.length > 50) {
                const partialSearch = normalizedSearch.substring(0, 50);
                index = normalizedContent.indexOf(partialSearch);
            }

            // Try case-insensitive if still not found
            if (index === -1) {
                index = normalizedContent
                    .toLowerCase()
                    .indexOf(normalizedSearch.toLowerCase());
            }

            if (index !== -1) {
                foundNode = node;
                foundIndex = index;
                break;
            }
        }

        if (foundNode && foundIndex !== -1) {
            try {
                const textLength = Math.min(
                    normalizedSearch.length,
                    (foundNode.textContent?.length || 0) - foundIndex,
                );

                // Create range and wrap with highlight
                const range = document.createRange();
                range.setStart(foundNode, foundIndex);
                range.setEnd(foundNode, foundIndex + textLength);

                const highlight = document.createElement("mark");
                highlight.className = "error-highlight-text";
                highlight.setAttribute("data-rule", error.name);
                range.surroundContents(highlight);

                // Scroll to the highlight with animation
                highlight.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });

                // Auto-remove highlight after 8 seconds
                setTimeout(() => {
                    if (highlight.parentNode) {
                        const textNode = document.createTextNode(
                            highlight.textContent || "",
                        );
                        highlight.parentNode.replaceChild(textNode, highlight);
                        textNode.parentNode?.normalize();
                    }
                }, 8000);
            } catch (err) {
                console.warn("Could not create text highlight:", err);
                scrollToSection(error.location?.section || "general");
            }
        } else {
            // Fallback to section-based scrolling
            scrollToSection(error.location?.section || "general");
        }
    }

    function scrollToSection(section: string) {
        if (!docxContainer) return;

        // Expanded section keywords for better matching
        const sectionMap: Record<string, string[]> = {
            title: ["title", "manuscript"],
            abstract: [
                "Abstract",
                "ABSTRACT",
                "Background",
                "Objective",
                "Purpose",
            ],
            keywords: ["Keywords", "Key words", "KEYWORDS", "Key Words"],
            introduction: ["Introduction", "INTRODUCTION", "Background"],
            methods: [
                "Methods",
                "Materials and Methods",
                "METHODS",
                "Methodology",
                "Study Design",
            ],
            results: ["Results", "RESULTS", "Findings"],
            discussion: ["Discussion", "DISCUSSION", "Interpretation"],
            conclusion: ["Conclusion", "CONCLUSION", "Summary"],
            references: [
                "References",
                "REFERENCES",
                "Bibliography",
                "Literature",
            ],
            figures: ["Figure", "Fig.", "Fig "],
            tables: ["Table "],
            general: [],
            pattern: ["citation", "format"],
            measurement: ["word", "count", "length"],
            presence: ["missing", "required"],
            structure: ["section", "heading"],
        };

        const searchTerms = sectionMap[section.toLowerCase()] || [section];

        // If no search terms, scroll to top
        if (searchTerms.length === 0) {
            docxContainer.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        // Search through document content
        const walker = document.createTreeWalker(
            docxContainer,
            NodeFilter.SHOW_TEXT,
            null,
        );

        let node;
        let foundElement: HTMLElement | null = null;

        while ((node = walker.nextNode())) {
            const text = node.textContent || "";
            for (const term of searchTerms) {
                // Match at word start for better precision
                const regex = new RegExp(`\\b${term}`, "i");
                if (regex.test(text)) {
                    foundElement = node.parentElement;
                    break;
                }
            }
            if (foundElement) break;
        }

        if (foundElement) {
            // Scroll to element
            foundElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });

            // Add pulse animation with red border
            const originalStyle = foundElement.getAttribute("style") || "";
            foundElement.style.cssText =
                originalStyle +
                `
                outline: 3px solid #DC2626;
                outline-offset: 4px;
                background-color: rgba(220, 38, 38, 0.15);
                transition: all 0.3s ease;
            `;

            // Remove highlight after 3 seconds
            setTimeout(() => {
                foundElement!.style.cssText = originalStyle;
            }, 3000);
        } else {
            // Fallback: scroll to top
            docxContainer.scrollTo({ top: 0, behavior: "smooth" });
        }
    }

    // Group errors by section for the error list
    $: errorsBySection = errors.reduce(
        (acc, err) => {
            const section = err.location?.section || "general";
            if (!acc[section]) acc[section] = [];
            acc[section].push(err);
            return acc;
        },
        {} as Record<string, RuleResult[]>,
    );

    onMount(() => {
        // Rendering is handled by the reactive statement above
        // This just ensures container is ready
    });
</script>

<div class="document-viewer">
    <!-- Left Panel: Document Preview -->
    <div class="doc-panel">
        <div class="doc-header">
            <span class="doc-title">📄 Document Preview</span>
            <div class="error-summary">
                <span class="error-count critical"
                    >{errors.filter((e) => e.status === "FAIL").length} errors</span
                >
                <span class="error-count warning"
                    >{errors.filter((e) => e.status === "WARNING").length} warnings</span
                >
            </div>
        </div>

        <div class="doc-content" bind:this={docxContainer}>
            {#if isLoading}
                <div class="loading-doc">
                    <div class="spinner"></div>
                    <p>Rendering document...</p>
                </div>
            {:else if renderError}
                <div class="render-error">
                    <p>⚠️ {renderError}</p>
                </div>
            {:else if !documentBuffer}
                <div class="empty-doc">
                    <p>Document content will appear here after upload</p>
                </div>
            {/if}
        </div>
    </div>

    <!-- Right Panel: Error Details -->
    <div class="error-panel">
        <div class="error-header">
            <span class="error-title">🔍 Errors & Fixes</span>
        </div>

        <div class="error-list">
            {#each Object.entries(errorsBySection) as [section, sectionErrors]}
                <div class="error-section">
                    <button
                        class="section-header"
                        on:click={() => scrollToSection(section)}
                    >
                        📍 {section.charAt(0).toUpperCase() + section.slice(1)}
                        <span class="section-count">{sectionErrors.length}</span
                        >
                    </button>

                    {#each sectionErrors as error}
                        <button
                            class="error-item {getSeverity(
                                error,
                            )} {selectedError?.ruleId === error.ruleId
                                ? 'selected'
                                : ''}"
                            on:click={() => handleErrorClick(error)}
                        >
                            <div class="error-indicator"></div>
                            <div class="error-info">
                                <span class="error-name">{error.name}</span>
                                <span class="error-message"
                                    >{error.message.slice(0, 60)}...</span
                                >
                            </div>
                            {#if error.status === "FAIL" && error.autoFixable}
                                <button
                                    class="inline-fix-btn"
                                    on:click|stopPropagation={() =>
                                        dispatch("generateFix", error.name)}
                                    title="Fix this issue"
                                >
                                    🔧
                                </button>
                            {/if}
                        </button>
                    {/each}
                </div>
            {/each}
        </div>

        <!-- Selected Error Details -->
        {#if selectedError}
            <div class="error-details">
                <div class="detail-header">
                    <span class="severity-badge {getSeverity(selectedError)}">
                        {selectedError.status}
                    </span>
                    <h3>{selectedError.name}</h3>
                </div>

                <div class="detail-body">
                    <p class="detail-message">{selectedError.message}</p>

                    {#if selectedError.location?.text}
                        <div class="problem-text">
                            <span class="detail-label">Problem Text:</span>
                            <code>{selectedError.location.text}</code>
                        </div>
                    {/if}

                    {#if selectedError.suggestion}
                        <div class="suggestion">
                            <span class="detail-label">💡 Suggestion:</span>
                            <p>{selectedError.suggestion}</p>
                        </div>
                    {/if}
                </div>

                <!-- AutoFix -->
                {#if selectedError.status === "FAIL"}
                    <div class="autofix-area">
                        {#if currentFix && currentFix.ruleName === selectedError.name}
                            <AutoFixPanel
                                fix={currentFix}
                                isGenerating={isGeneratingFix}
                                on:accept={(e) =>
                                    dispatch("acceptFix", e.detail)}
                                on:reject={(e) =>
                                    dispatch("rejectFix", e.detail)}
                            />
                        {:else}
                            <div class="fix-actions">
                                {#if selectedError.autoFixable}
                                    <div class="auto-fix-card">
                                        <div class="fix-card-header">
                                            <span class="fix-sparkle">✨</span>
                                            <span class="fix-title"
                                                >AI Fix Available</span
                                            >
                                        </div>
                                        <p class="fix-description">
                                            This formatting issue can be
                                            corrected automatically.
                                        </p>
                                        <button
                                            class="premium-fix-btn"
                                            on:click={() =>
                                                dispatch(
                                                    "generateFix",
                                                    selectedError.name,
                                                )}
                                            disabled={isGeneratingFix}
                                        >
                                            {#if isGeneratingFix}
                                                <span class="btn-spinner"
                                                ></span>
                                                <span>Generating...</span>
                                            {:else}
                                                <span class="btn-icon">🔧</span>
                                                <span>Fix This Issue</span>
                                            {/if}
                                        </button>
                                    </div>
                                {:else}
                                    <div class="manual-fix-card">
                                        <div class="fix-card-header">
                                            <span class="fix-sparkle">🛠️</span>
                                            <span class="fix-title"
                                                >Manual Fix Required</span
                                            >
                                        </div>
                                        <p class="fix-description">
                                            This issue involves content that
                                            requires your judgment. Please
                                            address it directly in your
                                            document.
                                        </p>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {:else}
            <div class="empty-selection">
                <p>👆 Select an error to see details and fix options</p>
            </div>
        {/if}
    </div>
</div>

<style>
    .document-viewer {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 1.5rem;
        height: calc(100vh - 200px);
        min-height: 600px;
    }

    /* Document Panel */
    .doc-panel {
        display: flex;
        flex-direction: column;
        background: white;
        border-radius: 12px;
        border: 1px solid var(--border-light);
        overflow: hidden;
    }

    .doc-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--border-light);
        background: var(--fix-bg);
    }

    .doc-title {
        font-weight: 600;
        font-size: 1rem;
    }

    .error-summary {
        display: flex;
        gap: 0.75rem;
    }

    .error-count {
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.25rem 0.6rem;
        border-radius: 12px;
    }

    .error-count.critical {
        background: rgba(220, 38, 38, 0.1);
        color: #dc2626;
    }

    .error-count.warning {
        background: rgba(217, 119, 6, 0.1);
        color: #d97706;
    }

    .doc-content {
        flex: 1;
        overflow-y: auto;
        background: #f5f5f5;
        padding: 1rem;
    }

    /* docx-preview styling */
    .doc-content :global(.docx-wrapper) {
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin: 0 auto;
    }

    .doc-content :global(.docx) {
        padding: 2rem;
    }

    /* Enhanced table styling for structure preservation */
    .doc-content :global(table) {
        border-collapse: collapse;
        width: 100%;
        margin: 1rem 0;
        font-size: 0.9rem;
    }

    .doc-content :global(td),
    .doc-content :global(th) {
        border: 1px solid #d1d5db;
        padding: 0.5rem 0.75rem;
        text-align: left;
        vertical-align: top;
    }

    .doc-content :global(th) {
        background: #f9fafb;
        font-weight: 600;
    }

    .doc-content :global(tr:nth-child(even)) {
        background: #fafafa;
    }

    /* Enhanced image styling */
    .doc-content :global(img) {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1rem auto;
    }

    /* Exact text error highlighting */
    .doc-content :global(.error-highlight-text) {
        background: linear-gradient(
            135deg,
            rgba(220, 38, 38, 0.35),
            rgba(220, 38, 38, 0.15)
        );
        padding: 2px 4px;
        border-radius: 3px;
        border-bottom: 3px solid #dc2626;
        animation: pulseHighlight 1s ease-in-out 3;
        position: relative;
    }

    .doc-content :global(.error-highlight-text)::before {
        content: "⚠️";
        position: absolute;
        top: -1.5rem;
        left: 0;
        font-size: 1rem;
        animation: bounceIcon 0.5s ease-in-out infinite alternate;
    }

    @keyframes pulseHighlight {
        0%,
        100% {
            background: rgba(220, 38, 38, 0.15);
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4);
        }
        50% {
            background: rgba(220, 38, 38, 0.4);
            box-shadow: 0 0 8px 4px rgba(220, 38, 38, 0.3);
        }
    }

    @keyframes bounceIcon {
        from {
            transform: translateY(0);
        }
        to {
            transform: translateY(-4px);
        }
    }

    /* Figure caption styling */
    .doc-content :global(figcaption),
    .doc-content :global(.caption) {
        font-size: 0.85rem;
        color: #666;
        text-align: center;
        margin-top: 0.5rem;
        font-style: italic;
    }

    .loading-doc,
    .render-error,
    .empty-doc {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 1rem;
        color: var(--text-muted);
    }

    .loading-doc .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-light);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .render-error {
        color: var(--error);
    }

    /* Error Panel */
    .error-panel {
        display: flex;
        flex-direction: column;
        background: white;
        border-radius: 12px;
        border: 1px solid var(--border-light);
        overflow: hidden;
    }

    .error-header {
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--border-light);
        background: var(--fix-bg);
    }

    .error-title {
        font-weight: 600;
        font-size: 1rem;
    }

    .error-list {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem;
    }

    .error-section {
        margin-bottom: 0.5rem;
    }

    .section-header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0.75rem;
        background: rgba(0, 0, 0, 0.03);
        border: none;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: var(--text-secondary);
        cursor: pointer;
        transition: background 0.2s;
    }

    .section-header:hover {
        background: rgba(0, 0, 0, 0.06);
    }

    .section-count {
        background: var(--text-muted);
        color: white;
        padding: 0.1rem 0.4rem;
        border-radius: 10px;
        font-size: 0.7rem;
    }

    .error-item {
        width: 100%;
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;
        margin-top: 0.25rem;
        background: white;
        border: 1px solid var(--border-light);
        border-radius: 8px;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s;
    }

    .error-item:hover {
        border-color: var(--border-medium);
        background: rgba(0, 0, 0, 0.01);
    }

    .error-item.selected {
        border-color: var(--primary);
        background: rgba(79, 70, 229, 0.05);
    }

    .error-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-top: 0.35rem;
        flex-shrink: 0;
    }

    .error-item.critical .error-indicator {
        background: #dc2626;
    }
    .error-item.warning .error-indicator {
        background: #d97706;
    }
    .error-item.info .error-indicator {
        background: #2563eb;
    }

    .error-info {
        flex: 1;
        min-width: 0;
    }

    .error-name {
        display: block;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-main);
        margin-bottom: 0.2rem;
    }

    .error-message {
        display: block;
        font-size: 0.75rem;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .inline-fix-btn {
        padding: 0.35rem 0.6rem;
        background: linear-gradient(135deg, #10b981, #059669);
        border: none;
        border-radius: 6px;
        font-size: 0.9rem;
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
    }

    .inline-fix-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
    }

    /* Error Details */
    .error-details {
        border-top: 1px solid var(--border-light);
        padding: 1.25rem;
        background: var(--fix-bg);
        max-height: 50%;
        overflow-y: auto;
    }

    .detail-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    .severity-badge {
        padding: 0.25rem 0.6rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
    }

    .severity-badge.critical {
        background: #dc2626;
        color: white;
    }

    .severity-badge.warning {
        background: #d97706;
        color: white;
    }

    .severity-badge.info {
        background: #2563eb;
        color: white;
    }

    .detail-header h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
    }

    .detail-body {
        margin-bottom: 1rem;
    }

    .detail-message {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-bottom: 0.75rem;
    }

    .detail-label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: 0.35rem;
    }

    .problem-text {
        margin-bottom: 0.75rem;
    }

    .problem-text code {
        display: block;
        padding: 0.5rem 0.75rem;
        background: rgba(220, 38, 38, 0.08);
        border-left: 3px solid #dc2626;
        border-radius: 4px;
        font-family: var(--font-mono);
        font-size: 0.85rem;
    }

    .suggestion {
        padding: 0.75rem;
        background: rgba(22, 163, 74, 0.08);
        border-left: 3px solid #16a34a;
        border-radius: 4px;
    }

    .suggestion p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-main);
    }

    .autofix-area {
        padding-top: 1rem;
        border-top: 1px dashed var(--border-light);
    }

    /* Premium Fix Cards */
    .auto-fix-card,
    .manual-fix-card {
        padding: 1rem 1.25rem;
        border-radius: 12px;
        margin-top: 0.5rem;
    }

    .auto-fix-card {
        background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.08) 0%,
            rgba(5, 150, 105, 0.15) 100%
        );
        border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .manual-fix-card {
        background: linear-gradient(
            135deg,
            rgba(245, 158, 11, 0.08) 0%,
            rgba(217, 119, 6, 0.12) 100%
        );
        border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .fix-card-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .fix-sparkle {
        font-size: 1.1rem;
    }

    .fix-title {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--text-main);
    }

    .fix-description {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin: 0 0 1rem;
        line-height: 1.5;
    }

    /* Premium Fix Button */
    .premium-fix-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.85rem 1.25rem;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
    }

    .premium-fix-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.35);
    }

    .premium-fix-btn:active:not(:disabled) {
        transform: translateY(0);
    }

    .premium-fix-btn:disabled {
        opacity: 0.85;
        cursor: not-allowed;
    }

    .btn-icon {
        font-size: 1.1rem;
    }

    .btn-spinner {
        width: 18px;
        height: 18px;
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

    .empty-selection {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
        color: var(--text-muted);
        border-top: 1px solid var(--border-light);
    }

    @media (max-width: 1024px) {
        .document-viewer {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 1fr;
        }
    }
</style>
