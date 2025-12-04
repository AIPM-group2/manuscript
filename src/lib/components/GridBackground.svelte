<script>
    import { onMount } from "svelte";

    let blocks = [];
    // Increase grid density for better effect
    const rows = 12;
    const cols = 16;

    onMount(() => {
        const newBlocks = [];
        for (let i = 0; i < rows * cols; i++) {
            newBlocks.push({
                id: i,
                // Randomize animation duration and delay for organic feel
                duration: 3 + Math.random() * 4,
                delay: Math.random() * 5,
                // Randomize which blocks are active to avoid clutter
                active: Math.random() > 0.6,
            });
        }
        blocks = newBlocks;
    });
</script>

<div class="grid-background">
    {#each blocks as block}
        <div
            class="block {block.active ? 'animating' : ''}"
            style="
                --duration: {block.duration}s;
                --delay: {block.delay}s;
            "
        ></div>
    {/each}
    <div class="fade-overlay"></div>
</div>

<style>
    .grid-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(16, 1fr);
        grid-template-rows: repeat(12, 1fr);
        gap: 1px;
        background: #f1f5f9; /* Slightly darker gap color for contrast */
        overflow: hidden;
        z-index: 0;
        transform: perspective(1000px) rotateX(5deg) scale(1.1); /* Subtle 3D tilt */
        transform-origin: top center;
    }

    .block {
        background: white;
        width: 100%;
        height: 100%;
        position: relative;
        transition: box-shadow 0.5s ease;
    }

    .block.animating {
        animation: breathe var(--duration) ease-in-out infinite;
        animation-delay: var(--delay);
    }

    /* Simplex-style breathing effect: Shadow intensity changes, not position */
    @keyframes breathe {
        0%,
        100% {
            box-shadow: 0 0 0 rgba(0, 0, 0, 0);
            z-index: 1;
        }
        50% {
            box-shadow:
                0 10px 15px -3px rgba(0, 0, 0, 0.1),
                0 4px 6px -2px rgba(0, 0, 0, 0.05);
            z-index: 10;
            transform: scale(1.02); /* Subtle scale up */
        }
    }

    .fade-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 60%;
        background: linear-gradient(to bottom, transparent 0%, white 100%);
        z-index: 20;
        pointer-events: none;
    }

    @media (max-width: 768px) {
        .grid-background {
            grid-template-columns: repeat(8, 1fr);
            grid-template-rows: repeat(12, 1fr);
        }
    }
</style>
