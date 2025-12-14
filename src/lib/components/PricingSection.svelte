<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    let isYearly = false;
    let mounted = false;
    let cardsVisible = false;
    let hoveredCard: number | null = null;

    // Pricing configuration
    const plans = [
        {
            name: "Starter",
            tagline: "For individual researchers",
            originalPrice: 0,
            discountedPrice: 0,
            originalYearlyPrice: 0,
            discountedYearlyPrice: 0,
            features: [
                "5 validations per month",
                "Basic formatting checks",
                "Community support",
            ],
            cta: "Start Free",
            popular: false,
            isFree: true,
            icon: "🚀",
            gradient: "from-slate-400 to-slate-600",
        },
        {
            name: "Pro",
            tagline: "For individual researchers",
            originalPrice: 49,
            discountedPrice: 34,
            originalYearlyPrice: 499,
            discountedYearlyPrice: 349,
            features: [
                "Unlimited validations",
                "Advanced citation analysis",
                "Custom rule sets",
                "Priority support",
                "Team collaboration",
                "API access",
            ],
            cta: "Upgrade to Pro",
            popular: true,
            isFree: false,
            icon: "⚡",
            gradient: "from-rose-500 to-orange-500",
        },
        {
            name: "Labs",
            tagline: "For research institutions",
            originalPrice: 129,
            discountedPrice: 90,
            originalYearlyPrice: 1299,
            discountedYearlyPrice: 909,
            features: [
                "Everything in Pro",
                "Unlimited team members",
                "SSO integration",
                "Dedicated support",
                "Custom integrations",
                "SLA guarantee",
            ],
            cta: "Contact Sales",
            popular: false,
            isFree: false,
            isBestValue: true,
            icon: "🏛️",
            gradient: "from-emerald-500 to-teal-500",
        },
    ];

    onMount(() => {
        mounted = true;
        setTimeout(() => {
            cardsVisible = true;
        }, 300);
    });
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin="anonymous"
    />
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<section class="pricing-section" id="pricing">
    <!-- Animated Background -->
    <div class="background-effects">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
        <div class="gradient-orb orb-3"></div>
        <div class="noise-overlay"></div>
        <div class="grid-pattern"></div>
    </div>

    <!-- Floating Particles -->
    <div class="particles">
        {#each Array(20) as _, i}
            <div
                class="particle"
                style="
                    left: {Math.random() * 100}%;
                    animation-delay: {Math.random() * 5}s;
                    animation-duration: {8 + Math.random() * 4}s;
                "
            ></div>
        {/each}
    </div>

    <div class="pricing-container">
        {#if mounted}
            <!-- Holiday Banner with Shimmer -->
            <div
                class="holiday-banner"
                in:scale={{ duration: 500, easing: quintOut }}
            >
                <div class="banner-glow"></div>
                <div class="banner-content">
                    <span class="banner-emoji">🎄</span>
                    <span class="banner-text">
                        <span class="shimmer-text">Holiday Special</span> — 30% Off
                        All Paid Plans!
                    </span>
                    <span class="banner-emoji">🎁</span>
                </div>
            </div>

            <!-- Header -->
            <div class="pricing-header" in:fade={{ duration: 600, delay: 100 }}>
                <div class="header-badge">PRICING</div>
                <h2 class="pricing-title">
                    Choose Your
                    <span class="title-gradient">Research Edge</span>
                </h2>
                <p class="pricing-subtitle">
                    Validate manuscripts with precision. Every plan includes
                    end-to-end encryption and zero data retention.
                </p>
            </div>

            <!-- Billing Toggle -->
            <div
                class="toggle-container"
                in:fade={{ duration: 600, delay: 200 }}
            >
                <div class="toggle-wrapper">
                    <button
                        class="toggle-btn"
                        class:active={!isYearly}
                        on:click={() => (isYearly = false)}
                    >
                        Monthly
                    </button>
                    <button
                        class="toggle-btn"
                        class:active={isYearly}
                        on:click={() => (isYearly = true)}
                    >
                        Yearly
                        <span class="save-badge">Save 30%</span>
                    </button>
                    <div class="toggle-slider" class:yearly={isYearly}></div>
                </div>
            </div>

            <!-- Pricing Cards -->
            <div class="pricing-grid">
                {#each plans as plan, i}
                    {#if cardsVisible}
                        <div
                            class="pricing-card"
                            class:popular={plan.popular}
                            class:hovered={hoveredCard === i}
                            in:fly={{
                                y: 60,
                                duration: 700,
                                delay: 150 + i * 100,
                                easing: quintOut,
                            }}
                            on:mouseenter={() => (hoveredCard = i)}
                            on:mouseleave={() => (hoveredCard = null)}
                            role="article"
                        >
                            <!-- Card Glow Effect -->
                            <div
                                class="card-glow"
                                class:active={hoveredCard === i}
                            ></div>

                            <!-- Popular Badge -->
                            {#if plan.popular}
                                <div class="popular-badge">
                                    <span class="badge-icon">⚡</span>
                                    Most Popular
                                </div>
                            {/if}

                            <!-- Best Value Badge -->
                            {#if plan.isBestValue && isYearly}
                                <div class="best-value-badge">
                                    <span class="badge-icon">🏆</span>
                                    Best Value
                                </div>
                            {/if}

                            <!-- Sale Tag -->
                            {#if !plan.isFree}
                                <div class="sale-tag">
                                    <span>30% OFF</span>
                                </div>
                            {/if}

                            <!-- Card Content -->
                            <div class="card-content">
                                <!-- Plan Icon & Name -->
                                <div class="plan-header">
                                    <div class="plan-icon">{plan.icon}</div>
                                    <div class="plan-info">
                                        <h3 class="plan-name">{plan.name}</h3>
                                        <p class="plan-tagline">
                                            {plan.tagline}
                                        </p>
                                    </div>
                                </div>

                                <!-- Pricing -->
                                <div class="pricing-display">
                                    {#if plan.isFree}
                                        <div class="price-row">
                                            <span class="price-main free"
                                                >Free</span
                                            >
                                        </div>
                                        <p class="price-note">
                                            No credit card required
                                        </p>
                                    {:else}
                                        <div class="price-original">
                                            <span class="strikethrough">
                                                CHF {isYearly
                                                    ? plan.originalYearlyPrice
                                                    : plan.originalPrice}
                                            </span>
                                        </div>
                                        <div class="price-row">
                                            <span class="price-currency"
                                                >CHF</span
                                            >
                                            <span class="price-main"
                                                >{isYearly
                                                    ? plan.discountedYearlyPrice
                                                    : plan.discountedPrice}</span
                                            >
                                            <span class="price-period"
                                                >/{isYearly
                                                    ? "year"
                                                    : "mo"}</span
                                            >
                                        </div>
                                        <p class="price-note">
                                            {isYearly
                                                ? "Billed annually"
                                                : "Billed monthly"}
                                        </p>
                                    {/if}
                                </div>

                                <!-- CTA Button -->
                                <button
                                    class="cta-btn"
                                    class:primary={plan.popular}
                                    class:free={plan.isFree}
                                >
                                    <span class="btn-text">{plan.cta}</span>
                                    <span class="btn-arrow">→</span>
                                </button>

                                <!-- Divider -->
                                <div class="features-divider">
                                    <span>What's included</span>
                                </div>

                                <!-- Features List -->
                                <ul class="features-list">
                                    {#each plan.features as feature}
                                        <li class="feature-item">
                                            <div class="check-icon">
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M20 6L9 17L4 12"
                                                        stroke="currentColor"
                                                        stroke-width="2.5"
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                    />
                                                </svg>
                                            </div>
                                            <span>{feature}</span>
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>

            <!-- Trust Indicators -->
            <div class="trust-section" in:fade={{ duration: 600, delay: 700 }}>
                <div class="trust-items">
                    <div class="trust-item">
                        <span class="trust-icon">🔒</span>
                        <span>256-bit SSL</span>
                    </div>
                    <div class="trust-divider"></div>
                    <div class="trust-item">
                        <span class="trust-icon">🚫</span>
                        <span>Zero Data Retention</span>
                    </div>
                    <div class="trust-divider"></div>
                    <div class="trust-item">
                        <span class="trust-icon">⏰</span>
                        <span>Offer ends Dec 31, 2025</span>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</section>

<style>
    /* ========== Base Styles ========== */
    .pricing-section {
        position: relative;
        padding: 100px 0 120px;
        overflow: hidden;
        font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
        background: linear-gradient(
            180deg,
            #0f172a 0%,
            #1e293b 50%,
            #0f172a 100%
        );
        min-height: 100vh;
    }

    /* ========== Background Effects ========== */
    .background-effects {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
    }

    .gradient-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.4;
        animation: float 20s ease-in-out infinite;
    }

    .orb-1 {
        width: 600px;
        height: 600px;
        background: linear-gradient(135deg, #f43f5e, #ec4899);
        top: -200px;
        left: -100px;
        animation-delay: 0s;
    }

    .orb-2 {
        width: 500px;
        height: 500px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        top: 50%;
        right: -150px;
        animation-delay: -7s;
    }

    .orb-3 {
        width: 400px;
        height: 400px;
        background: linear-gradient(135deg, #10b981, #14b8a6);
        bottom: -100px;
        left: 30%;
        animation-delay: -14s;
    }

    @keyframes float {
        0%,
        100% {
            transform: translate(0, 0) scale(1);
        }
        33% {
            transform: translate(30px, -30px) scale(1.05);
        }
        66% {
            transform: translate(-20px, 20px) scale(0.95);
        }
    }

    .noise-overlay {
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        opacity: 0.03;
        mix-blend-mode: overlay;
    }

    .grid-pattern {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(
                rgba(255, 255, 255, 0.02) 1px,
                transparent 1px
            ),
            linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.02) 1px,
                transparent 1px
            );
        background-size: 60px 60px;
    }

    /* ========== Particles ========== */
    .particles {
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        animation: rise linear infinite;
    }

    @keyframes rise {
        0% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100px) scale(1);
            opacity: 0;
        }
    }

    /* ========== Container ========== */
    .pricing-container {
        position: relative;
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 24px;
        z-index: 10;
    }

    /* ========== Holiday Banner ========== */
    .holiday-banner {
        position: relative;
        max-width: 600px;
        margin: 0 auto 40px;
        padding: 16px 32px;
        background: linear-gradient(
            135deg,
            rgba(220, 38, 38, 0.9),
            rgba(185, 28, 28, 0.9)
        );
        border-radius: 16px;
        overflow: hidden;
        box-shadow:
            0 0 40px rgba(220, 38, 38, 0.4),
            0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .banner-glow {
        position: absolute;
        inset: -2px;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
        );
        animation: shimmer 3s ease-in-out infinite;
    }

    @keyframes shimmer {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(100%);
        }
    }

    .banner-content {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: white;
        font-weight: 700;
        font-size: 1.1rem;
    }

    .banner-emoji {
        font-size: 1.5rem;
    }

    .shimmer-text {
        background: linear-gradient(90deg, #fff, #fcd34d, #fff);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: text-shimmer 2s linear infinite;
    }

    @keyframes text-shimmer {
        0% {
            background-position: -200% center;
        }
        100% {
            background-position: 200% center;
        }
    }

    /* ========== Header ========== */
    .pricing-header {
        text-align: center;
        margin-bottom: 48px;
    }

    .header-badge {
        display: inline-block;
        padding: 8px 20px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 100px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.15em;
        color: #94a3b8;
        margin-bottom: 20px;
    }

    .pricing-title {
        font-size: clamp(2.5rem, 5vw, 4rem);
        font-weight: 800;
        line-height: 1.1;
        color: white;
        margin: 0 0 20px;
        letter-spacing: -0.02em;
    }

    .title-gradient {
        background: linear-gradient(135deg, #f43f5e, #ec4899, #8b5cf6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .pricing-subtitle {
        font-size: 1.125rem;
        color: #94a3b8;
        max-width: 560px;
        margin: 0 auto;
        line-height: 1.7;
    }

    /* ========== Toggle ========== */
    .toggle-container {
        display: flex;
        justify-content: center;
        margin-bottom: 56px;
    }

    .toggle-wrapper {
        position: relative;
        display: flex;
        gap: 4px;
        padding: 6px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        backdrop-filter: blur(10px);
    }

    .toggle-btn {
        position: relative;
        z-index: 2;
        padding: 12px 28px;
        background: transparent;
        border: none;
        font-size: 0.9375rem;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        transition: color 0.3s;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .toggle-btn.active {
        color: white;
    }

    .toggle-slider {
        position: absolute;
        top: 6px;
        left: 6px;
        width: calc(50% - 8px);
        height: calc(100% - 12px);
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border-radius: 10px;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .toggle-slider.yearly {
        transform: translateX(calc(100% + 4px));
    }

    .save-badge {
        padding: 4px 8px;
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: #0f172a;
        font-size: 0.7rem;
        font-weight: 800;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* ========== Pricing Grid ========== */
    .pricing-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        max-width: 1100px;
        margin: 0 auto;
    }

    @media (max-width: 968px) {
        .pricing-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
        }
    }

    /* ========== Pricing Card ========== */
    .pricing-card {
        position: relative;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        padding: 32px 28px;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(20px);
    }

    .pricing-card:hover {
        transform: translateY(-8px);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .pricing-card.popular {
        background: rgba(244, 63, 94, 0.08);
        border-color: rgba(244, 63, 94, 0.3);
        box-shadow:
            0 0 60px rgba(244, 63, 94, 0.15),
            0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .pricing-card.popular:hover {
        border-color: rgba(244, 63, 94, 0.5);
        box-shadow:
            0 0 80px rgba(244, 63, 94, 0.25),
            0 25px 50px rgba(0, 0, 0, 0.4);
    }

    .card-glow {
        position: absolute;
        inset: -1px;
        border-radius: 24px;
        background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.3),
            rgba(139, 92, 246, 0.3)
        );
        opacity: 0;
        transition: opacity 0.4s;
        z-index: -1;
        filter: blur(20px);
    }

    .card-glow.active {
        opacity: 1;
    }

    /* ========== Badges ========== */
    .popular-badge,
    .best-value-badge {
        position: absolute;
        top: -14px;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 20px;
        border-radius: 100px;
        font-size: 0.8rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
    }

    .popular-badge {
        background: linear-gradient(135deg, #f43f5e, #ec4899);
        color: white;
        box-shadow: 0 4px 20px rgba(244, 63, 94, 0.4);
    }

    .best-value-badge {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: #0f172a;
        box-shadow: 0 4px 20px rgba(251, 191, 36, 0.4);
    }

    .sale-tag {
        position: absolute;
        top: 20px;
        right: 20px;
        padding: 6px 12px;
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        color: white;
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.05em;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }

    /* ========== Card Content ========== */
    .card-content {
        position: relative;
    }

    .plan-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 28px;
        padding-top: 8px;
    }

    .plan-icon {
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        font-size: 1.75rem;
    }

    .plan-name {
        font-size: 1.5rem;
        font-weight: 700;
        color: white;
        margin: 0 0 4px;
    }

    .plan-tagline {
        font-size: 0.875rem;
        color: #64748b;
        margin: 0;
    }

    /* ========== Pricing Display ========== */
    .pricing-display {
        margin-bottom: 28px;
    }

    .price-original {
        margin-bottom: 4px;
    }

    .strikethrough {
        font-size: 1rem;
        color: #64748b;
        text-decoration: line-through;
        text-decoration-color: #f43f5e;
        text-decoration-thickness: 2px;
    }

    .price-row {
        display: flex;
        align-items: baseline;
        gap: 4px;
    }

    .price-currency {
        font-size: 1.25rem;
        font-weight: 700;
        color: #10b981;
    }

    .price-main {
        font-size: 3.5rem;
        font-weight: 800;
        color: white;
        letter-spacing: -0.02em;
        line-height: 1;
    }

    .price-main.free {
        background: linear-gradient(135deg, #10b981, #14b8a6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .price-period {
        font-size: 1rem;
        color: #64748b;
        font-weight: 500;
    }

    .price-note {
        font-size: 0.8rem;
        color: #475569;
        margin: 8px 0 0;
    }

    /* ========== CTA Button ========== */
    .cta-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 16px 24px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 14px;
        color: white;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s;
        margin-bottom: 28px;
    }

    .cta-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    .cta-btn.primary {
        background: linear-gradient(135deg, #f43f5e, #ec4899);
        border: none;
        box-shadow: 0 4px 20px rgba(244, 63, 94, 0.3);
    }

    .cta-btn.primary:hover {
        box-shadow: 0 8px 30px rgba(244, 63, 94, 0.4);
    }

    .cta-btn.free {
        background: linear-gradient(135deg, #10b981, #14b8a6);
        border: none;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
    }

    .cta-btn.free:hover {
        box-shadow: 0 8px 30px rgba(16, 185, 129, 0.4);
    }

    .btn-arrow {
        transition: transform 0.3s;
    }

    .cta-btn:hover .btn-arrow {
        transform: translateX(4px);
    }

    /* ========== Features ========== */
    .features-divider {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .features-divider::before,
    .features-divider::after {
        content: "";
        flex: 1;
        height: 1px;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
        );
    }

    .features-divider span {
        padding: 0 16px;
    }

    .features-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .feature-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 14px;
        font-size: 0.9375rem;
        color: #cbd5e1;
    }

    .check-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(16, 185, 129, 0.2);
        border-radius: 6px;
        color: #10b981;
        margin-top: 2px;
    }

    .check-icon svg {
        width: 14px;
        height: 14px;
    }

    /* ========== Trust Section ========== */
    .trust-section {
        margin-top: 64px;
        display: flex;
        justify-content: center;
    }

    .trust-items {
        display: flex;
        align-items: center;
        gap: 24px;
        padding: 20px 40px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        backdrop-filter: blur(10px);
    }

    .trust-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.875rem;
        font-weight: 600;
        color: #94a3b8;
    }

    .trust-icon {
        font-size: 1.25rem;
    }

    .trust-divider {
        width: 1px;
        height: 24px;
        background: rgba(255, 255, 255, 0.1);
    }

    /* ========== Responsive ========== */
    @media (max-width: 768px) {
        .pricing-section {
            padding: 60px 0 80px;
        }

        .holiday-banner {
            margin: 0 16px 32px;
            padding: 14px 20px;
        }

        .banner-content {
            font-size: 0.9rem;
            flex-wrap: wrap;
            text-align: center;
        }

        .pricing-title {
            font-size: 2rem;
        }

        .pricing-subtitle {
            font-size: 1rem;
        }

        .toggle-wrapper {
            flex-direction: column;
            gap: 8px;
        }

        .toggle-slider {
            display: none;
        }

        .toggle-btn.active {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border-radius: 10px;
        }

        .price-main {
            font-size: 2.75rem;
        }

        .trust-items {
            flex-direction: column;
            gap: 16px;
            padding: 24px;
        }

        .trust-divider {
            width: 60%;
            height: 1px;
        }
    }

    /* ========== Reduced Motion ========== */
    @media (prefers-reduced-motion: reduce) {
        .gradient-orb,
        .particle,
        .banner-glow,
        .shimmer-text {
            animation: none;
        }

        .pricing-card,
        .cta-btn {
            transition: none;
        }
    }
</style>
