/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // You can extend the default Tailwind theme here
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Default sans-serif
        serif: ['Cal Sans', 'serif'], // If you want to use Cal Sans
        // Add other font families from your Vite config
      },
      colors: {
        // Add custom colors from your Vite config
        primary: '#your-primary-color',
        secondary: '#your-secondary-color',
        // ...
      },
      spacing: {
        // Add custom spacing units from your Vite config
        '72': '18rem',
        '80': '20rem',
        // ...
      },
    },
  },
  plugins: [
    // Add any Tailwind plugins you were using in Vite
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
    // ...
  ],
};
