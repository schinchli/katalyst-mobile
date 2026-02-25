/**
 * NativeWind / Tailwind config — Vuexy v10.11.1 design tokens
 *
 * Parent theme:  Vuexy v10.11.1 (nextjs-version › colorSchemes.ts + _variables.scss)
 * Child layer:   app-* semantic tokens defined here
 *
 * When Vuexy updates: only change token values in packages/theme/src/tokens.ts
 * then copy updated values into this file.  No component changes needed.
 *
 * Dark mode: NativeWind reads system color scheme.
 * Use `dark:` prefix on any class: className="bg-app-bg dark:bg-app-bg-dark"
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'media', // follows system prefers-color-scheme

  theme: {
    extend: {
      colors: {
        // ── Primary (Vuexy purple — identical in light + dark) ──────────────
        'app-primary': '#7367F0',

        // ── Backgrounds ──────────────────────────────────────────────────────
        'app-bg':           '#F8F7FA',   // light  — Vuexy: $body-bg
        'app-bg-dark':      '#25293C',   // dark   — Vuexy: $dark-body-bg

        // ── Surface (card / sheet backgrounds) ───────────────────────────────
        'app-surface':      '#FFFFFF',   // light
        'app-surface-dark': '#2F3349',   // dark   — Vuexy: $dark-card-bg

        // ── Borders / dividers ────────────────────────────────────────────────
        'app-border':       '#DBDADE',   // light  — Vuexy: $border-color
        'app-border-dark':  '#4B4F66',   // dark   — Vuexy: $dark-border-color

        // ── Text ─────────────────────────────────────────────────────────────
        'app-text':         '#23212A',   // light  — Vuexy: $headings-color
        'app-text-dark':    '#E3E7FA',   // dark   — Vuexy: $dark-headings-color
        'app-muted':        '#6A6B76',   // light  — Vuexy: $text-muted
        'app-muted-dark':   '#9EA1BA',   // dark   — Vuexy: $dark-text-muted

        // ── Primary light (tinted icon containers, selected states) ──────────
        'app-primary-faint':      '#EBE9FD',  // light
        'app-primary-faint-dark': '#43406B',  // dark

        // ── Status (same hex in both modes — Vuexy values) ───────────────────
        'app-success':      '#28C76F',   // Vuexy $success
        'app-success-tint': '#D1F7E2',   // 10% success on white
        'app-warning':      '#FF9F43',   // Vuexy $warning
        'app-warning-tint': '#FEF3C7',
        'app-error':        '#FF4C51',   // Vuexy $danger
        'app-error-tint':   '#FFE5E6',   // 10% error on white
        'app-info':         '#00BAD1',   // Vuexy $info

        // ── Brand ─────────────────────────────────────────────────────────────
        'app-aws':          '#FF9900',   // AWS orange

        // ── Tab bar ───────────────────────────────────────────────────────────
        'app-tab-inactive': '#9EA1BA',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['SpaceMono', 'Courier New', 'monospace'],
      },

      borderRadius: {
        // Vuexy uses 6px as default $border-radius
        DEFAULT: '6px',
        sm:    '6px',
        md:    '8px',
        lg:    '12px',
        xl:    '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
    },
  },

  plugins: [],
};
