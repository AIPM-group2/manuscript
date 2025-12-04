<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";

    let isYearly = false;
    let mounted = false;
    let cardsVisible = false;

    const plans = [
        {
            name: "Basic",
            tagline: "For individual researchers",
            price: 0,
            yearlyPrice: 0,
            features: [
                "5 validations per month",
                "Basic formatting checks",
                "Citation validation",
                "Community support",
            ],
            cta: "Start Free",
            popular: false,
        },
        {
            name: "Pro",
            tagline: "For research teams",
            price: 19,
            yearlyPrice: 149,
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
        },
        {
            name: "Lab",
            tagline: "For research institutions",
            price: 60,
            yearlyPrice: 499,
            features: [
                "Everything in Pro",
                "SSO integration",
                "Dedicated support",
                "Custom integrations",
                "SLA guarantee",
                "Advanced analytics",
            ],
            cta: "Contact Sales",
            popular: false,
        },
    ];

    onMount(() => {
        mounted = true;
        setTimeout(() => {
            cardsVisible = true;
        }, 200);
    });

    function formatPrice(price: number): string {
        return price.toFixed(0);
    }
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin="anonymous"
    />
    <link
        href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<section class="pricing-section">
    <div class="pricing-background">
        <div class="ruled-lines"></div>
        <div class="grain-overlay"></div>
    </div>

    <div class="pricing-container">
        {#if mounted}
            <div class="pricing-header" in:fade={{ duration: 600 }}>
                <h2 class="pricing-title">Investment in Precision</h2>
                <p class="pricing-subtitle">
                    Choose the rigor your research deserves. Every plan includes <br
                        class="hide-mobile"
                    />
                    end-to-end encryption and zero data retention.
                </p>
            </div>

            <div class="toggle-wrapper" in:fade={{ duration: 600, delay: 200 }}>
                <button
                    class="toggle-option"
                    class:active={!isYearly}
                    on:click={() => (isYearly = false)}
                >
                    Monthly
                </button>
                <button
                    class="toggle-option"
                    class:active={isYearly}
                    on:click={() => (isYearly = true)}
                >
                    Yearly
                    <span class="toggle-badge">Save 20%</span>
                </button>
            </div>

            <div class="pricing-grid">
                {#each plans as plan, i}
                    {#if cardsVisible}
                        <div
                            class="pricing-card"
                            class:popular={plan.popular}
                            in:fly={{
                                y: 40,
                                duration: 600,
                                delay: 100 + i * 150,
                            }}
                        >
                            {#if plan.popular}
                                <div class="popular-badge">Most Popular</div>
                            {/if}

                            <div class="card-header">
                                <div class="plan-label">{plan.name}</div>
                                <p class="plan-tagline">{plan.tagline}</p>
                            </div>

                            <div class="card-pricing">
                                <span class="currency">$</span>
                                <span class="price-amount">
                                    {formatPrice(
                                        isYearly
                                            ? plan.yearlyPrice
                                            : plan.price,
                                    )}
                                </span>
                                <span class="price-period">
                                    /{isYearly ? "year" : "month"}
                                </span>
                            </div>

                            <button
                                class="cta-button"
                                class:primary={plan.popular}
                            >
                                {plan.cta}
                            </button>

                            <div class="features-divider"></div>

                            <ul class="features-list">
                                {#each plan.features as feature}
                                    <li class="feature-item">
                                        <svg
                                            class="feature-check"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M13.3333 4L6 11.3333L2.66667 8"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                            />
                                        </svg>
                                        {feature}
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}
    </div>
</section>

<style>
    :root {
        --font-editorial: "Crimson Pro", Georgia, serif;
        --font-modern: "Plus Jakarta Sans", -apple-system, sans-serif;
        --color-ink: #1e40af;
        --color-amber: #f59e0b;
        --color-warm-gray: #525252;
        --color-light-bg: #f9fafb;
    }

    .pricing-section {
        position: relative;
        background: var(--color-light-bg);
        padding: 120px 0;
        overflow: hidden;
    }

    .pricing-background {
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .ruled-lines {
        position: absolute;
        inset: 0;
        background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 31px,
            rgba(0, 0, 0, 0.02) 31px,
            rgba(0, 0, 0, 0.02) 32px
        );
    }

    .grain-overlay {
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        opacity: 0.02;
        mix-blend-mode: overlay;
    }

    .pricing-container {
        position: relative;
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 2rem;
        z-index: 1;
    }

    .pricing-header {
        text-align: center;
        margin-bottom: 4rem;
    }

    .pricing-title {
        font-family: var(--font-editorial);
        font-size: 4rem;
        font-weight: 700;
        line-height: 1.1;
        color: #0a0a0a;
        margin: 0 0 1.5rem 0;
        letter-spacing: -0.02em;
    }

    .pricing-subtitle {
        font-family: var(--font-modern);
        font-size: 1.125rem;
        line-height: 1.7;
        color: #6b7280;
        max-width: 600px;
        margin: 0 auto;
    }

    .toggle-wrapper {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 4rem;
        background: white;
        padding: 0.5rem;
        border-radius: 12px;
        width: fit-content;
        margin-left: auto;
        margin-right: auto;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .toggle-option {
        font-family: var(--font-modern);
        font-size: 0.9375rem;
        font-weight: 600;
        padding: 0.75rem 1.5rem;
        border: none;
        background: transparent;
        color: #6b7280;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .toggle-option.active {
        background: var(--color-ink);
        color: white;
    }

    .toggle-badge {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: var(--color-amber);
        color: #0a0a0a;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }

    .pricing-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 2rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    .pricing-card {
        background: white;
        border-radius: 16px;
        padding: 3rem 2.5rem;
        position: relative;
        transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        border: 2px solid transparent;
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .pricing-card:hover {
        transform: translateY(-8px);
        box-shadow:
            0 20px 25px -5px rgba(0, 0, 0, 0.2),
            0 10px 10px -5px rgba(0, 0, 0, 0.1);
        border-color: var(--color-ink);
    }

    .pricing-card.popular {
        border-color: var(--color-ink);
        box-shadow:
            0 10px 15px -3px rgba(30, 64, 175, 0.2),
            0 4px 6px -2px rgba(30, 64, 175, 0.1);
    }

    .popular-badge {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        font-family: var(--font-modern);
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        background: var(--color-ink);
        color: white;
        padding: 0.5rem 1.25rem;
        border-radius: 6px;
    }

    .card-header {
        margin-bottom: 2rem;
    }

    .plan-label {
        font-family: var(--font-modern);
        font-size: 0.875rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--color-warm-gray);
        margin-bottom: 0.5rem;
    }

    .plan-tagline {
        font-family: var(--font-modern);
        font-size: 1rem;
        color: #374151;
        margin: 0;
    }

    .card-pricing {
        display: flex;
        align-items: baseline;
        margin-bottom: 2rem;
        font-family: var(--font-editorial);
    }

    .currency {
        font-size: 2rem;
        font-weight: 600;
        color: #0a0a0a;
        margin-right: 0.25rem;
    }

    .price-amount {
        font-size: 4.5rem;
        font-weight: 700;
        line-height: 1;
        color: #0a0a0a;
        letter-spacing: -0.02em;
    }

    .price-period {
        font-family: var(--font-modern);
        font-size: 1rem;
        color: var(--color-warm-gray);
        margin-left: 0.5rem;
    }

    .cta-button {
        width: 100%;
        font-family: var(--font-modern);
        font-size: 1rem;
        font-weight: 700;
        padding: 1rem 2rem;
        border-radius: 10px;
        border: 2px solid #d1d5db;
        background: white;
        color: #0a0a0a;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 2rem;
    }

    .cta-button:hover {
        background: #0a0a0a;
        color: white;
        border-color: #0a0a0a;
        transform: translateY(-2px);
    }

    .cta-button.primary {
        background: var(--color-ink);
        border-color: var(--color-ink);
        color: white;
    }

    .cta-button.primary:hover {
        background: #1e3a8a;
        border-color: #1e3a8a;
    }

    .features-divider {
        height: 1px;
        background: rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
    }

    .features-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .feature-item {
        font-family: var(--font-modern);
        font-size: 0.9375rem;
        color: #374151;
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    .feature-check {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        color: var(--color-ink);
        margin-top: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
        .pricing-card {
            transition: none;
        }
        .pricing-card:hover {
            transform: none;
        }
        .cta-button:hover {
            transform: none;
        }
    }

    @media (max-width: 768px) {
        .pricing-section {
            padding: 80px 0;
        }

        .pricing-title {
            font-size: 2.5rem;
        }

        .pricing-subtitle {
            font-size: 1rem;
        }

        .hide-mobile {
            display: none;
        }

        .pricing-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }

        .price-amount {
            font-size: 3.5rem;
        }

        .pricing-card {
            padding: 2rem 1.5rem;
        }
    }
</style>
