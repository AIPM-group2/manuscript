<script lang="ts">
    import "../../styles/design-system.css";
    import { onMount } from "svelte";
    import {
        login,
        signInWithGoogle,
        authError,
        authLoading,
    } from "$lib/stores/auth";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";

    let form = {
        email: "",
        password: "",
    };

    let isSubmitting = false;

    // Clear auth errors on page load
    onMount(() => {
        authError.set(null);
    });

    // Clear errors when user starts typing
    function clearError() {
        authError.set(null);
    }

    async function handleLogin() {
        if (!form.email || !form.password) {
            return;
        }

        isSubmitting = true;
        const success = await login(form.email, form.password);
        isSubmitting = false;

        if (success) {
            goto(`${base}/dashboard`);
        }
    }

    async function loginWithGoogle() {
        isSubmitting = true;
        const success = await signInWithGoogle();
        isSubmitting = false;

        if (success) {
            goto(`${base}/dashboard`);
        }
    }
</script>

<svelte:head>
    <title>Login — Manuscript</title>
</svelte:head>

<div
    style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: var(--spacing-6);"
>
    <div style="width: 100%; max-width: 480px;">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: var(--spacing-8);">
            <a
                href="{base}/"
                style="display: inline-flex; align-items: center; gap: 0.75rem; font-size: 1.75rem; font-weight: 800; color: var(--text-main); text-decoration: none;"
            >
                <span
                    style="display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: linear-gradient(135deg, var(--primary) 0%, #1e40af 100%); color: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(38, 87, 193, 0.3);"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M4 4h2l6 14 6-14h2"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <path
                            d="M20 20H4"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            opacity="0.6"
                        />
                    </svg>
                </span>
                <span
                    >Manu<span
                        style="background: linear-gradient(135deg, var(--primary), #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
                        >script</span
                    ></span
                >
            </a>
        </div>

        <!-- Card -->
        <div class="card">
            <h2 style="margin-bottom: var(--spacing-2); text-align: center;">
                Welcome back
            </h2>
            <p
                style="text-align: center; color: var(--gray-600); margin-bottom: var(--spacing-8);"
            >
                Log in to your account to continue
            </p>

            {#if $authError}
                <div
                    style="background: #fee2e2; border: 2px solid #ef4444; border-radius: var(--radius-md); padding: var(--spacing-3); margin-bottom: var(--spacing-4); color: #991b1b;"
                >
                    {$authError}
                </div>
            {/if}

            <!-- Social Login -->
            <div style="margin-bottom: var(--spacing-6);">
                <button
                    on:click={loginWithGoogle}
                    disabled={isSubmitting}
                    class="btn btn-secondary"
                    style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    {isSubmitting ? "Signing in..." : "Continue with Google"}
                </button>
            </div>

            <div
                style="position: relative; text-align: center; margin-bottom: var(--spacing-6);"
            >
                <div
                    style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: var(--gray-200);"
                ></div>
                <span
                    style="position: relative; background: white; padding: 0 var(--spacing-4); color: var(--gray-500); font-size: 0.875rem;"
                    >Or continue with email</span
                >
            </div>

            <!-- Form -->
            <form on:submit|preventDefault={handleLogin}>
                <div style="margin-bottom: var(--spacing-4);">
                    <label
                        style="display: block; margin-bottom: var(--spacing-2); font-weight: 600; color: var(--gray-700);"
                        >Email</label
                    >
                    <input
                        type="email"
                        bind:value={form.email}
                        on:input={clearError}
                        required
                        placeholder="you@example.com"
                    />
                </div>

                <div style="margin-bottom: var(--spacing-2);">
                    <label
                        style="display: block; margin-bottom: var(--spacing-2); font-weight: 600; color: var(--gray-700);"
                        >Password</label
                    >
                    <input
                        type="password"
                        bind:value={form.password}
                        on:input={clearError}
                        required
                        placeholder="••••••••"
                    />
                </div>

                <div
                    style="text-align: right; margin-bottom: var(--spacing-6);"
                >
                    <a
                        href="{base}/forgot-password"
                        style="font-size: 0.875rem; color: var(--primary); text-decoration: none;"
                        >Forgot password?</a
                    >
                </div>

                <button
                    type="submit"
                    class="btn btn-primary"
                    style="width: 100%; margin-bottom: var(--spacing-4);"
                >
                    Log In
                </button>

                <p
                    style="text-align: center; font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0;"
                >
                    Don't have an account?
                    <a
                        href="{base}/signup"
                        style="color: var(--primary); font-weight: 600; text-decoration: none;"
                        >Sign up</a
                    >
                </p>
            </form>
        </div>
    </div>
</div>
