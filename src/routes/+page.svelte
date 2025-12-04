<script lang="ts">
    import "../styles/design-system.css";
    import { user } from "$lib/stores/auth";
    import GridBackground from "$lib/components/GridBackground.svelte";
    import PricingSection from "$lib/components/PricingSection.svelte";

    let activeFaq = -1;
    let contactForm = { name: "", email: "", message: "" };

    const features = [
        {
            icon: "⚡",
            title: "Lightning Fast",
            desc: "Instant analysis powered by advanced LLMs.",
        },
        {
            icon: "🎯",
            title: "99% Accurate",
            desc: "Validated against thousands of guidelines.",
        },
        {
            icon: "🔒",
            title: "Secure & Private",
            desc: "End-to-end encryption. Zero data retention.",
        },
        {
            icon: "🌍",
            title: "Global Support",
            desc: "Works with 50+ major academic journals.",
        },
    ];

    const steps = [
        {
            num: "01",
            title: "Upload",
            desc: "Drag & drop your .docx manuscript.",
        },
        {
            num: "02",
            title: "Analyze",
            desc: "AI checks formatting & citations.",
        },
        { num: "03", title: "Perfect", desc: "Fix issues and export report." },
    ];

    const faqs = [
        {
            q: "What formats are supported?",
            a: "Currently .docx files. PDF support coming soon.",
        },
        {
            q: "Is it free to use?",
            a: "Yes, get started with 5 free validations per month.",
        },
        {
            q: "How secure is my data?",
            a: "We use enterprise-grade encryption and never store your work.",
        },
        {
            q: "Can I cancel anytime?",
            a: "Yes, there are no long-term contracts.",
        },
    ];

    function submitContact() {
        alert("Message sent!");
        contactForm = { name: "", email: "", message: "" };
    }
</script>

<svelte:head>
    <title>ApexScript - Modern Manuscript Validation</title>
</svelte:head>

<!-- Navigation -->
<nav class="nav">
    <div class="container nav-content">
        <a href="/" class="brand">
            <div class="logo-icon">A</div>
            <span>ApexScript</span>
        </a>
        <div class="nav-links">
            <a href="/pricing">Pricing</a>
            <a href="/docs">Documentation</a>
            <a href="#features">Features</a>
            {#if $user}
                <a href="/dashboard" class="btn btn-primary btn-sm">Dashboard</a
                >
            {:else}
                <a href="/login" class="btn btn-ghost btn-sm">Log in</a>
                <a href="/signup" class="btn btn-primary btn-sm">Sign up</a>
            {/if}
        </div>
    </div>
</nav>

<!-- Hero Section -->
<section class="hero">
    <GridBackground />
    <div class="container hero-content">
        <div class="badge-pill">New: AI Analysis v2.0</div>
        <h1 class="hero-title">
            Browser automation <br />
            <span class="text-gradient">for researchers</span>
        </h1>
        <p class="hero-subtitle">
            ApexScript provides all the infrastructure needed for modern
            manuscript validation. Automated formatting checks, citation
            analysis, and more.
        </p>
        <div class="hero-actions">
            <a href="/signup" class="btn btn-primary btn-lg">Try for free</a>
            <a href="/docs" class="btn btn-secondary btn-lg">Documentation</a>
        </div>

        <div class="trusted-by">
            <p>TRUSTED BY RESEARCHERS FROM</p>
            <div class="logos">
                <img
                    src="/logos/EPFL_Logo_Digital_RGB_PROD.png"
                    alt="EPFL Logo"
                    class="logo-img epfl"
                />
                <img
                    src="/logos/Brandpanel_UNIBAS_EN.jpg"
                    alt="University of Basel Logo"
                    class="logo-img unibas"
                />
            </div>
        </div>
    </div>
</section>

<!-- Features Grid -->
<section id="features" class="section">
    <div class="container">
        <div class="section-header">
            <h2>Everything you need</h2>
            <p>Complete toolkit for academic compliance.</p>
        </div>
        <div class="grid grid-4">
            {#each features as feature}
                <div class="feature-card">
                    <div class="feature-icon">{feature.icon}</div>
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                </div>
            {/each}
        </div>
    </div>
</section>

<!-- How It Works -->
<section class="section bg-dots">
    <div class="container">
        <div class="grid grid-3 steps">
            {#each steps as step}
                <div class="step-card">
                    <div class="step-num">{step.num}</div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                </div>
            {/each}
        </div>
    </div>
</section>

<!-- Pricing Section -->
<PricingSection />

<!-- FAQ -->
<section class="section">
    <div class="container" style="max-width: 800px;">
        <h2 class="text-center mb-12">Common Questions</h2>
        <div class="faq-grid">
            {#each faqs as faq, i}
                <div class="faq-item {activeFaq === i ? 'active' : ''}">
                    <button
                        on:click={() => (activeFaq = activeFaq === i ? -1 : i)}
                    >
                        {faq.q}
                        <span class="icon">{activeFaq === i ? "−" : "+"}</span>
                    </button>
                    {#if activeFaq === i}
                        <div class="answer">{faq.a}</div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
</section>

<!-- Footer -->
<footer class="footer">
    <div class="container">
        <div class="footer-content">
            <div class="footer-brand">
                <h3>ApexScript</h3>
                <p>Automating academic compliance.</p>
            </div>
            <div class="footer-links">
                <div>
                    <h4>Product</h4>
                    <a href="/pricing">Pricing</a>
                    <a href="/docs">Docs</a>
                    <a href="/dashboard">Dashboard</a>
                </div>
                <div>
                    <h4>Company</h4>
                    <a href="/about">About</a>
                    <a href="/blog">Blog</a>
                    <a href="/contact">Contact</a>
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            © 2024 ApexScript Inc. All rights reserved.
        </div>
    </div>
</footer>

<style>
    /* Navigation */
    .nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(12px);
        z-index: 100;
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
    }

    .nav-links {
        display: flex;
        align-items: center;
        gap: 2rem;
    }

    .nav-links a:not(.btn) {
        color: var(--text-secondary);
        text-decoration: none;
        font-weight: 500;
        font-size: 0.9375rem;
    }

    .nav-links a:not(.btn):hover {
        color: var(--primary);
    }

    /* Hero */
    .hero {
        position: relative;
        padding: 180px 0 120px;
        text-align: center;
        overflow: hidden;
    }

    .hero-content {
        position: relative;
        z-index: 10;
        max-width: 900px;
        margin: 0 auto;
    }

    .badge-pill {
        display: inline-block;
        padding: 0.5rem 1rem;
        background: white;
        border: 1px solid var(--border-medium);
        border-radius: 999px;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--primary);
        margin-bottom: 2rem;
        box-shadow: var(--shadow-sm);
    }

    .hero-title {
        font-size: 4.5rem;
        line-height: 1.1;
        margin-bottom: 1.5rem;
        letter-spacing: -0.03em;
    }

    .hero-subtitle {
        font-size: 1.25rem;
        color: var(--text-secondary);
        max-width: 600px;
        margin: 0 auto 3rem;
    }

    .hero-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 5rem;
    }

    .trusted-by {
        border-top: 1px solid var(--border-light);
        padding-top: 3rem;
    }

    .trusted-by p {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        color: var(--text-muted);
        margin-bottom: 1.5rem;
    }

    .logos {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 4rem;
        color: var(--text-secondary);
        opacity: 0.7;
    }

    .logo-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .logo-img {
        height: 40px;
        width: auto;
        opacity: 0.8;
        transition: opacity 0.3s;
        filter: grayscale(100%);
    }

    .logo-img:hover {
        filter: grayscale(0%);
        opacity: 1;
    }

    .logo-img.epfl {
        height: 32px; /* EPFL logo is wider */
    }

    .logo-text {
        font-size: 1.25rem;
        line-height: 1;
        display: flex;
        flex-direction: column;
        text-align: left;
    }

    .logos > *:hover {
        opacity: 1;
        color: var(--text-main);
    }

    /* Features */
    .section-header {
        text-align: center;
        margin-bottom: 4rem;
    }

    .feature-card {
        padding: 2rem;
        background: white;
        border: 1px solid var(--border-light);
        border-radius: var(--radius-xl);
        transition: all 0.3s ease;
    }

    .feature-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-lg);
        border-color: var(--primary);
    }

    .feature-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }

    /* Steps */
    .bg-dots {
        background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
        background-size: 20px 20px;
    }

    .step-card {
        text-align: center;
        padding: 2rem;
    }

    .step-num {
        font-size: 4rem;
        font-weight: 900;
        color: var(--border-medium);
        opacity: 0.3;
        line-height: 1;
        margin-bottom: 1rem;
    }

    /* FAQ */
    .faq-item {
        border-bottom: 1px solid var(--border-light);
    }

    .faq-item button {
        width: 100%;
        padding: 1.5rem 0;
        text-align: left;
        background: none;
        border: none;
        font-size: 1.125rem;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
        cursor: pointer;
        color: var(--text-main);
    }

    .answer {
        padding-bottom: 1.5rem;
        color: var(--text-secondary);
    }

    .icon {
        color: var(--primary);
        font-size: 1.5rem;
    }

    /* Footer */
    .footer {
        background: white;
        border-top: 1px solid var(--border-light);
        padding: 5rem 0 2rem;
    }

    .footer-content {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4rem;
    }

    .footer-links {
        display: flex;
        gap: 5rem;
    }

    .footer-links h4 {
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
        margin-bottom: 1.5rem;
    }

    .footer-links a {
        display: block;
        color: var(--text-secondary);
        text-decoration: none;
        margin-bottom: 0.75rem;
    }

    .footer-bottom {
        text-align: center;
        color: var(--text-muted);
        font-size: 0.875rem;
    }

    @media (max-width: 768px) {
        .hero-title {
            font-size: 3rem;
        }
        .grid-4,
        .grid-3 {
            grid-template-columns: 1fr;
        }
        .footer-content {
            flex-direction: column;
            gap: 3rem;
        }
        .nav-links {
            display: none;
        }
    }
</style>
