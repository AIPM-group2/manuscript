<script lang="ts">
    import PricingCard from "$lib/components/ui/PricingCard.svelte";

    const myPricingPlans = [
        {
            planName: "Basic",
            description: "Perfect for individual researchers.",
            price: "0",
            features: [
                "5 validations/month",
                "Basic formatting checks",
                "Community Support",
            ],
            buttonText: "Get Started",
            buttonVariant: "secondary" as const,
        },
        {
            planName: "Pro",
            description: "Collaborate with your team on multiple journals.",
            price: "19",
            features: [
                "Unlimited validations",
                "Advanced citation analysis",
                "Priority support",
                "Shared Workspaces",
            ],
            buttonText: "Choose Team Plan",
            isPopular: true,
            buttonVariant: "primary" as const,
        },
        {
            planName: "Lab (Custom)",
            description: "For research groups",
            price: "60",
            features: [
                "Unlimited Users",
                "Custom rule sets",
                "Dedicated Support",
                "SSO Integration",
                "API access",
            ],
            buttonText: "Contact Us",
            buttonVariant: "primary" as const,
        },
    ];
</script>

<svelte:head>
    <title>Pricing - ApexScript</title>
</svelte:head>

<div class="min-h-screen w-full bg-white overflow-hidden relative font-sans">
    <!-- Gradient Ring Background -->
    <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] opacity-80 pointer-events-none"
    >
        <div
            class="w-full h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-green-400 blur-[80px] md:blur-[120px] animate-pulse-slow"
        ></div>
    </div>

    <main
        class="relative z-10 container mx-auto px-4 py-20 flex flex-col items-center"
    >
        <div class="text-center mb-16 max-w-3xl">
            <h1
                class="text-[48px] md:text-[64px] font-normal text-slate-900 tracking-tight leading-[1.1]"
            >
                Find the <span class="text-cyan-500">Perfect Plan</span> for Your
                Business
            </h1>
            <p class="mt-6 text-[18px] text-slate-600">
                Start for free, then grow with us. Flexible plans for projects
                of all sizes.
            </p>
        </div>

        <div
            class="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl items-center"
        >
            {#each myPricingPlans as plan}
                <PricingCard {...plan} />
            {/each}
        </div>
    </main>
</div>

<style>
    /* Custom slow pulse animation for the background */
    @keyframes pulse-slow {
        0%,
        100% {
            opacity: 0.6;
            transform: scale(1);
        }
        50% {
            opacity: 0.8;
            transform: scale(1.05);
        }
    }
    .animate-pulse-slow {
        animation: pulse-slow 8s ease-in-out infinite;
    }
</style>
