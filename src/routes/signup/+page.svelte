<script lang="ts">
    import "../../styles/design-system.css";
    import { signup } from "$lib/stores/auth";
    import { goto } from "$app/navigation";

    let form = {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    };

    let error = "";

    function handleSignup() {
        error = "";

        if (form.password !== form.confirmPassword) {
            error = "Passwords do not match";
            return;
        }

        if (form.password.length < 6) {
            error = "Password must be at least 6 characters";
            return;
        }

        signup(form.email, form.password, form.name);
        goto("/dashboard");
    }

    function signupWithGoogle() {
        // Demo: simulate Google OAuth
        signup("google@example.com", "google-auth", "Google User");
        goto("/dashboard");
    }

    function signupWithGitHub() {
        // Demo: simulate GitHub OAuth
        signup("github@example.com", "github-auth", "GitHub User");
        goto("/dashboard");
    }
</script>

<svelte:head>
    <title>Sign Up - ApexScript</title>
</svelte:head>

<div
    style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: var(--spacing-6);"
>
    <div style="width: 100%; max-width: 480px;">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: var(--spacing-8);">
            <a
                href="/"
                style="font-size: 2rem; font-weight: 800; color: var(--primary); text-decoration: none;"
            >
                <span
                    style="background: var(--primary); color: white; padding: 0.5rem 1rem; border-radius: 0.75rem; margin-right: 0.5rem;"
                    >A</span
                >
                ApexScript
            </a>
        </div>

        <!-- Card -->
        <div class="card">
            <h2 style="margin-bottom: var(--spacing-2); text-align: center;">
                Create your account
            </h2>
            <p
                style="text-align: center; color: var(--gray-600); margin-bottom: var(--spacing-8);"
            >
                Start validating manuscripts for free
            </p>

            {#if error}
                <div
                    style="background: #fee2e2; border: 2px solid #ef4444; border-radius: var(--radius-md); padding: var(--spacing-3); margin-bottom: var(--spacing-4); color: #991b1b;"
                >
                    {error}
                </div>
            {/if}

            <!-- Social Login -->
            <div
                style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-3); margin-bottom: var(--spacing-6);"
            >
                <button
                    on:click={signupWithGoogle}
                    class="btn btn-secondary"
                    style="width: 100%;"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24"
                        ><path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        /><path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        /><path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        /><path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        /></svg
                    >
                    Google
                </button>
                <button
                    on:click={signupWithGitHub}
                    class="btn btn-secondary"
                    style="width: 100%;"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24"
                        ><path
                            fill="currentColor"
                            d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
                        /></svg
                    >
                    GitHub
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
            <form on:submit|preventDefault={handleSignup}>
                <div style="margin-bottom: var(--spacing-4);">
                    <label
                        style="display: block; margin-bottom: var(--spacing-2); font-weight: 600; color: var(--gray-700);"
                        >Full Name</label
                    >
                    <input
                        type="text"
                        bind:value={form.name}
                        required
                        placeholder="John Doe"
                    />
                </div>

                <div style="margin-bottom: var(--spacing-4);">
                    <label
                        style="display: block; margin-bottom: var(--spacing-2); font-weight: 600; color: var(--gray-700);"
                        >Email</label
                    >
                    <input
                        type="email"
                        bind:value={form.email}
                        required
                        placeholder="you@example.com"
                    />
                </div>

                <div style="margin-bottom: var(--spacing-4);">
                    <label
                        style="display: block; margin-bottom: var(--spacing-2); font-weight: 600; color: var(--gray-700);"
                        >Password</label
                    >
                    <input
                        type="password"
                        bind:value={form.password}
                        required
                        placeholder="••••••••"
                    />
                </div>

                <div style="margin-bottom: var(--spacing-6);">
                    <label
                        style="display: block; margin-bottom: var(--spacing-2); font-weight: 600; color: var(--gray-700);"
                        >Confirm Password</label
                    >
                    <input
                        type="password"
                        bind:value={form.confirmPassword}
                        required
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    class="btn btn-primary"
                    style="width: 100%; margin-bottom: var(--spacing-4);"
                >
                    Create Account
                </button>

                <p
                    style="text-align: center; font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0;"
                >
                    Already have an account?
                    <a
                        href="/login"
                        style="color: var(--primary); font-weight: 600; text-decoration: none;"
                        >Log in</a
                    >
                </p>
            </form>
        </div>

        <p
            style="text-align: center; font-size: 0.75rem; color: var(--gray-500); margin-top: var(--spacing-4);"
        >
            By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
    </div>
</div>
