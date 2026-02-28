import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0f1115",
                surface: "#1a1d24",
                border: "#2b2f3a",
                primary: "#00e5ff", // Neon accent
                positive: "#10b981",
                negative: "#ef4444",
                muted: "#9ca3af"
            },
        },
    },
    plugins: [],
};
export default config;
