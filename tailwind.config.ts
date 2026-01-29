import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ralph: {
          yellow: '#f9ca24',
          orange: '#ee5a24',
          red: '#ff6b6b',
          purple: '#667eea',
        }
      },
      animation: {
        'wiggle': 'wiggle 0.5s ease-in-out',
        'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
export default config
