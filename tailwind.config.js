/**
 * NativeWind / Tailwind config — aligned with Elite Quiz Admin Panel (Vuexy semi-dark).
 *
 * Token alignment with admin panel vuexy.css:
 *   app-text        → --vx-text       (#4B465C)
 *   app-muted       → --vx-text-muted (#A3A0B3) — same in both modes
 *   app-border      → --vx-border     (#EBE9F1)
 *   app-bg-dark     → --vx-sidebar-bg (#283046, semi-dark navy)
 *   app-error       → --vx-danger     (#EA5455)
 *   app-info        → alias for primary (cyan removed)
 *
 * Dark mode: class-based via NativeWind. Actual dark toggle is managed
 * through themeStore (Zustand) — see hooks/useThemeColors.ts.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        // ── Primary (fresh blue/teal stack) ─────────────────────────────────
        'app-primary':             '#0EA5E9',
        'app-primary-2':           '#10B981',

        // ── Backgrounds ──────────────────────────────────────────────────────
        'app-bg':                  '#F6F8FB',
        'app-bg-dark':             '#0B1221',

        // ── Surface (card / sheet backgrounds) ───────────────────────────────
        'app-surface':             '#FFFFFF',
        'app-surface-dark':        'rgba(19,25,38,0.9)',

        // ── Borders / dividers ────────────────────────────────────────────────
        'app-border':              '#E5E7EB',
        'app-border-dark':         '#1F2937',

        // ── Text — two shades only ────────────────────────────────────────────
        'app-text':                '#0F172A',
        'app-text-dark':           '#E5E7EB',
        'app-muted':               '#6B7280',
        'app-muted-dark':          '#9CA3AF',

        // ── Primary light (tinted states) ────────────────────────────────────
        'app-primary-faint':       '#E0F7FF',
        'app-primary-faint-dark':  'rgba(14,165,233,0.14)',

        // ── Status (functional only) ─────────────────────────────────────────
        'app-success':             '#10B981',
        'app-success-tint':        '#D1F7E2',
        'app-warning':             '#F59E0B',
        'app-warning-tint':        '#FEF3C7',
        'app-error':               '#EF4444',
        'app-error-tint':          '#FCEAEA',
        'app-info':                '#0EA5E9',

        // ── Tab bar ───────────────────────────────────────────────────────────
        'app-tab-inactive':        '#9CA3AF',
      },

      fontFamily: {
        sans: ['SpaceGrotesk', 'Inter', 'PublicSans-Regular', 'system-ui', 'sans-serif'],
        mono: ['SpaceMono', 'Courier New', 'monospace'],
      },

      borderRadius: {
        // Vuexy uses 6px as default $border-radius
        DEFAULT: '10px',
        sm:    '10px',
        md:    '12px',
        lg:    '16px',
        xl:    '20px',
        '2xl': '26px',
        '3xl': '32px',
      },
    },
  },

  plugins: [],
};
