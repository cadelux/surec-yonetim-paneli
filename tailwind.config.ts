import type { Config } from "tailwindcss";

export default {
    darkMode: 'class',
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                card: "var(--card)",
                surface: "var(--surface)",
                border: "var(--border)",
                hover: "var(--hover)",
                primary: {
                    DEFAULT: "var(--color-primary)",
                    hover: "var(--color-primary-hover)",
                    foreground: "var(--color-primary-foreground)",
                },
                success: {
                    DEFAULT: "var(--color-success)",
                    bg: "var(--color-success-bg)",
                },
                warning: {
                    DEFAULT: "var(--color-warning)",
                    bg: "var(--color-warning-bg)",
                },
                error: {
                    DEFAULT: "var(--color-error)",
                    bg: "var(--color-error-bg)",
                },
                info: {
                    DEFAULT: "var(--color-info)",
                    bg: "var(--color-info-bg)",
                },
            },
            fontFamily: {
                sans: "var(--font-sans)",
                mono: "var(--font-mono)",
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            transitionTimingFunction: {
                'apple': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
        },
    },
    plugins: [],
} satisfies Config;