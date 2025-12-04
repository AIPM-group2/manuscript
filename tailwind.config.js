/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Inter', 'sans-serif'],
            },
            colors: {
                background: '#ffffff',
                foreground: '#0f172a',
                primary: '#2563eb', // Blue
                secondary: '#06b6d4', // Cyan
            }
        },
    },
    plugins: [],
    darkMode: 'class',
}
