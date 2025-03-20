/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cor principal - Azul profissional
        primary: {
          50: '#012928',
          100: '#012928',
          200: '#012928',
          300: '#012928',
          400: '#012928',
          500: '#012928',
          600: '#012928',
          700: '#012928',
          800: '#012928',
          900: '#012928',
          950: '#012928',
        },
        // Cor secundária - Cinza elegante
        secondary: {
          50: '#01FBA1',
          100: '#01FBA1',
          200: '#01FBA1',
          300: '#01FBA1',
          400: '#01FBA1',
          500: '#01FBA1',
          600: '#01FBA1',
          700: '#01FBA1',
          800: '#01FBA1',
          900: '#01FBA1',
          950: '#01FBA1',
        },
        // Cores de status
        status: {
          new: '#22c55e',        // Verde para novos leads
          in_progress: '#3b76ff', // Azul para leads em progresso
          qualified: '#8b5cf6',   // Roxo para leads qualificados
          lost: '#ef4444',       // Vermelho para leads perdidos
          archived: '#6b7280',   // Cinza para leads arquivados
        },
        // Cores de destaque
        accent: {
          success: '#22c55e',    // Verde
          warning: '#f59e0b',    // Amarelo
          error: '#ef4444',      // Vermelho
          info: '#3b76ff',       // Azul
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}