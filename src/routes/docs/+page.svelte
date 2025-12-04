<script lang="ts">
    import "../../styles/design-system.css";

    let activeSection = "introduction";

    const sections = [
        { id: "introduction", title: "Introduction" },
        { id: "getting-started", title: "Getting Started" },
        { id: "api-reference", title: "API Reference" },
        { id: "guidelines", title: "Supported Guidelines" },
        { id: "troubleshooting", title: "Troubleshooting" },
    ];
</script>

<svelte:head>
    <title>Documentation - ApexScript</title>
</svelte:head>

<div class="docs-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="sidebar-header">
            <a href="/" class="brand">
                <div class="logo-icon">A</div>
                <span>ApexScript</span>
            </a>
        </div>

        <nav class="sidebar-nav">
            {#each sections as section}
                <button
                    class="nav-item {activeSection === section.id
                        ? 'active'
                        : ''}"
                    on:click={() => (activeSection = section.id)}
                >
                    {section.title}
                </button>
            {/each}
        </nav>

        <div class="sidebar-footer">
            <a href="/login" class="btn btn-secondary w-full">Log In</a>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="content">
        <div class="content-wrapper">
            {#if activeSection === "introduction"}
                <h1>Introduction</h1>
                <p class="lead">
                    ApexScript is an AI-powered manuscript validation engine
                    designed for modern research workflows.
                </p>

                <div class="card info-box">
                    <h3>Why ApexScript?</h3>
                    <p>
                        Traditional manual checking takes hours. ApexScript
                        validates your manuscript against 50+ journal guidelines
                        in seconds.
                    </p>
                </div>

                <h2>Core Features</h2>
                <ul>
                    <li>
                        <strong>Automated Formatting:</strong> Checks margins, fonts,
                        and spacing.
                    </li>
                    <li>
                        <strong>Citation Analysis:</strong> Verifies reference styles
                        (APA, MLA, Chicago, etc.).
                    </li>
                    <li>
                        <strong>Structure Check:</strong> Ensures all required sections
                        (Abstract, Methods, etc.) are present.
                    </li>
                </ul>
            {:else if activeSection === "getting-started"}
                <h1>Getting Started</h1>
                <p>Follow these steps to validate your first manuscript.</p>

                <div class="step">
                    <div class="step-num">1</div>
                    <div class="step-content">
                        <h3>Create an Account</h3>
                        <p>
                            Sign up for a free account to get 5 monthly
                            validations.
                        </p>
                    </div>
                </div>

                <div class="step">
                    <div class="step-num">2</div>
                    <div class="step-content">
                        <h3>Upload Manuscript</h3>
                        <p>
                            Navigate to the dashboard and drag & drop your .docx
                            file.
                        </p>
                    </div>
                </div>

                <div class="step">
                    <div class="step-num">3</div>
                    <div class="step-content">
                        <h3>Review Results</h3>
                        <p>
                            Our AI will highlight issues. Click on any issue to
                            see detailed fix instructions.
                        </p>
                    </div>
                </div>
            {:else if activeSection === "api-reference"}
                <h1>API Reference</h1>
                <p>Integrate ApexScript into your own tools.</p>

                <div class="code-block">
                    <div class="code-header">POST /v1/validate</div>
                    <pre><code
                            >curl -X POST https://api.apexscript.com/v1/validate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@manuscript.docx"</code
                        ></pre>
                </div>
            {:else}
                <h1>{sections.find((s) => s.id === activeSection)?.title}</h1>
                <p>Documentation for this section is coming soon.</p>
            {/if}
        </div>
    </main>
</div>

<style>
    .docs-layout {
        display: flex;
        min-height: 100vh;
        background: white;
    }

    /* Sidebar */
    .sidebar {
        width: 280px;
        border-right: 1px solid var(--border-light);
        background: var(--bg-body);
        display: flex;
        flex-direction: column;
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
    }

    .sidebar-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--border-light);
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
    }

    .sidebar-nav {
        flex: 1;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .nav-item {
        text-align: left;
        padding: 0.75rem 1rem;
        background: none;
        border: none;
        border-radius: var(--radius-md);
        color: var(--text-secondary);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .nav-item:hover {
        background: rgba(0, 0, 0, 0.05);
        color: var(--text-main);
    }

    .nav-item.active {
        background: white;
        color: var(--primary);
        box-shadow: var(--shadow-sm);
        font-weight: 600;
    }

    .sidebar-footer {
        padding: 1.5rem;
        border-top: 1px solid var(--border-light);
    }

    /* Content */
    .content {
        flex: 1;
        margin-left: 280px;
        padding: 4rem 6rem;
    }

    .content-wrapper {
        max-width: 800px;
        margin: 0 auto;
    }

    h1 {
        margin-bottom: 1.5rem;
        font-size: 2.5rem;
    }

    h2 {
        margin-top: 3rem;
        margin-bottom: 1.5rem;
        font-size: 1.75rem;
    }

    h3 {
        margin-bottom: 1rem;
        font-size: 1.25rem;
    }

    p {
        margin-bottom: 1.5rem;
        color: var(--text-secondary);
    }

    .lead {
        font-size: 1.25rem;
        color: var(--text-main);
    }

    .info-box {
        background: #f0f9ff;
        border-color: #bae6fd;
        margin: 2rem 0;
    }

    ul {
        margin-bottom: 2rem;
        padding-left: 1.5rem;
    }

    li {
        margin-bottom: 0.75rem;
        color: var(--text-secondary);
    }

    /* Steps */
    .step {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .step-num {
        width: 32px;
        height: 32px;
        background: var(--primary);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        flex-shrink: 0;
    }

    /* Code Block */
    .code-block {
        background: var(--text-main);
        border-radius: var(--radius-lg);
        overflow: hidden;
        margin: 2rem 0;
    }

    .code-header {
        background: rgba(255, 255, 255, 0.1);
        padding: 0.75rem 1.5rem;
        color: var(--text-muted);
        font-family: var(--font-mono);
        font-size: 0.875rem;
    }

    pre {
        padding: 1.5rem;
        color: white;
        font-family: var(--font-mono);
        overflow-x: auto;
    }

    .w-full {
        width: 100%;
    }
</style>
