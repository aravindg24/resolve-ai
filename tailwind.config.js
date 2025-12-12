/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cyber: {
                    black: '#000000',
                    dark: '#0f0f13',
                    panel: '#15151a',
                    text: '#e0e0e0',
                    muted: '#808080',
                    primary: '#00e5ff',
                    secondary: '#d600ff',
                    danger: '#ff003c',
                }
            },
            fontFamily: {
                tech: ['Inter', 'sans-serif'], // Fallback or install fonts later
                mono: ['Fira Code', 'monospace']
            },
            boxShadow: {
                'neon-cyan': '0 0 10px #00e5ff, 0 0 20px #00e5ff33',
                'neon-purple': '0 0 10px #d600ff, 0 0 20px #d600ff33',
                'neon-red': '0 0 10px #ff003c, 0 0 20px #ff003c33',
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'spin-slow': 'spin 3s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
