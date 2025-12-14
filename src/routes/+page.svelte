<script lang="ts">
    import "../styles/design-system.css";
    import { user } from "$lib/stores/auth";
    import GridBackground from "$lib/components/GridBackground.svelte";
    import PricingSection from "$lib/components/PricingSection.svelte";
    import { base } from "$app/paths";

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
            desc: "Works with 10+ academic journals.",
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
        <a href="{base}/" class="brand">
            <div class="logo-icon">A</div>
            <span>ApexScript</span>
        </a>
        <div class="nav-links">
            <a href="{base}/pricing">Pricing</a>
            <a href="{base}/docs">Documentation</a>
            <a href="#features">Features</a>
            {#if $user}
                <a href="{base}/dashboard" class="btn btn-primary btn-sm">Dashboard</a
                >
            {:else}
                <a href="{base}/login" class="btn btn-ghost btn-sm">Log in</a>
                <a href="{base}/signup" class="btn btn-primary btn-sm">Sign up</a>
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
            <a href="{base}/signup" class="btn btn-primary btn-lg">Try for free</a>
            <a href="{base}/docs" class="btn btn-secondary btn-lg">Documentation</a>
        </div>

        <div class="trusted-by">
            <p>TRUSTED BY RESEARCHERS FROM</p>
            <div class="logos">
                <img
                    src="{base}/logos/epfl-logo.png"
                    alt="EPFL Logo"
                    class="logo-img epfl"
                />
                <img
                    src="{base}/logos/unibas-logo.jpg"
                    alt="University of Basel Logo"
                    class="logo-img unibas"
                />
                <img
                    src="{base}/logos/unil-logo.png"
                    alt="UNIL Logo"
                    class="logo-img unil"
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
                    <a href="{base}/pricing">Pricing</a>
                    <a href="{base}/docs">Docs</a>
                    <a href="{base}/dashboard">Dashboard</a>
                </div>
                <div>
                    <h4>Company</h4>
                    <a href="{base}/about">About</a>
                    <a href="{base}/blog">Blog</a>
                    <a href="{base}/contact">Contact</a>
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            © 2025 ApexScript Inc. All rights reserved.
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
        padding-top: 4rem;
        margin-top: 2rem;
    }

    .trusted-by p {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        color: var(--text-muted);
        margin-bottom: 2rem;
    }

    .logos {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 4rem;
        padding-bottom: 2rem;
    }

    .logo-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .logo-img {
        height: 45px;
        width: auto;
        opacity: 1;
        transition:
            transform 0.3s,
            opacity 0.3s;
        /* No grayscale - show original colors */
    }

    .logo-img:hover {
        transform: scale(1.05);
        opacity: 0.9;
    }

    .logo-img.epfl {
        height: 38px; /* EPFL logo is wider */
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
    }

    /* Features */
    .section-header {
        text-align: center;
        margin-bottom: 4rem;
    }

    .feature-card {
        padding: 2rem;
        background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
        border: 1px solid rgba(38, 87, 193, 0.15);
        border-radius: var(--radius-xl);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.05),
            0 2px 4px -1px rgba(0, 0, 0, 0.03),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        transform-style: preserve-3d;
        perspective: 1000px;
    }

    .feature-card::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: inherit;
        padding: 2px;
        background: linear-gradient(
            135deg,
            rgba(38, 87, 193, 0.3),
            rgba(59, 111, 217, 0.1),
            rgba(38, 87, 193, 0.3)
        );
        mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
        -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
        mask-composite: xor;
        -webkit-mask-composite: xor;
        opacity: 0;
        transition: opacity 0.4s ease;
        pointer-events: none;
    }

    .feature-card:hover {
        transform: translateY(-8px) rotateX(2deg);
        box-shadow:
            0 25px 50px -12px rgba(38, 87, 193, 0.25),
            0 0 30px rgba(38, 87, 193, 0.15),
            0 0 60px rgba(38, 87, 193, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 1);
        border-color: rgba(38, 87, 193, 0.4);
    }

    .feature-card:hover::before {
        opacity: 1;
        animation: glowPulse 2s ease-in-out infinite;
    }

    @keyframes glowPulse {
        0%,
        100% {
            opacity: 0.6;
        }
        50% {
            opacity: 1;
        }
    }

    .feature-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
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
