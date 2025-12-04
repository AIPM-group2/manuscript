<script lang="ts">
    export let planName: string;
    export let description: string;
    export let price: string;
    export let features: string[];
    export let buttonText: string;
    export let buttonVariant: "primary" | "secondary" = "secondary";
    export let isPopular: boolean = false;
</script>

<div
    class="relative bg-white rounded-2xl shadow-lg p-8 border-2 {isPopular
        ? 'border-cyan-500 scale-105'
        : 'border-slate-200'} transition-all hover:shadow-xl"
>
    {#if isPopular}
        <div
            class="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-white px-4 py-1 rounded-full text-sm font-semibold"
        >
            Most Popular
        </div>
    {/if}

    <h3 class="text-2xl font-bold text-slate-900 mb-2">{planName}</h3>
    <p class="text-slate-600 mb-6">{description}</p>

    <div class="mb-6">
        <span class="text-5xl font-bold text-slate-900">${price}</span>
        <span class="text-slate-600">/month</span>
    </div>

    <ul class="space-y-3 mb-8">
        {#each features as feature}
            <li class="flex items-start gap-3">
                <svg
                    class="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                    />
                </svg>
                <span class="text-slate-700">{feature}</span>
            </li>
        {/each}
    </ul>

    <button
        class="w-full py-3 px-6 rounded-lg font-semibold transition-all {buttonVariant ===
        'primary'
            ? 'bg-cyan-500 text-white hover:bg-cyan-600'
            : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}"
    >
        {buttonText}
    </button>
</div>
