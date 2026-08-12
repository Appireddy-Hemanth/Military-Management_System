/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                military: {
                    900: '#0B0F0C', // Dark
                    800: '#111713', // Dark navigation
                    700: '#182018', // Secondary dark
                    600: '#365314', // Deep tactical green
                    500: '#4D7C0F', // Olive
                    400: '#65A30D', // Green
                    100: '#F5F7F5', // Light background
                    border: '#e2e8f0', // Adjust if needed
                },
                status: {
                    success: '#16A34A',
                    warning: '#D97706',
                    danger: '#DC2626',
                    info: '#2563EB',
                },
                text: {
                    main: '#111827',
                    secondary: '#6B7280'
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
