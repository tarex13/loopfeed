module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
      theme: {
        extend: {
            colors: {
                brand: {
                    primary: '#6b4eff',
                    surface: '#ffffff',
                    muted: '#6b7280',
                    dark: '#0d0d10',
                    bgLight: '#f9f9fb',
                    bgDark: '#1a1a1f',
                    accent1: '#00b3b3',
                    accent2: '#ff7c70',
                }
            }
        }
    },
  variants: {
    extend: {},
  },
  plugins: [require('tailwindcss-filters')],
  
}
