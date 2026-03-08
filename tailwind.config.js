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
        // ── Primary (Vuexy purple — identical in light + dark) ──────────────
        'app-primary':             '#7367F0',

        // ── Backgrounds ──────────────────────────────────────────────────────
        'app-bg':                  '#F8F7FA',   // light  — admin --vx-body-bg
        'app-bg-dark':             '#283046',   // dark   — admin --vx-sidebar-bg (semi-dark)

        // ── Surface (card / sheet backgrounds) ───────────────────────────────
        'app-surface':             '#FFFFFF',   // light  — admin --vx-card-bg
        'app-surface-dark':        '#2F3349',   // dark   — one shade lighter than bg

        // ── Borders / dividers ────────────────────────────────────────────────
        'app-border':              '#EBE9F1',   // light  — admin --vx-border
        'app-border-dark':         '#3B4059',   // dark   — subtle on #283046

        // ── Text — two shades only ────────────────────────────────────────────
        'app-text':                '#4B465C',   // light  — admin --vx-text (unified)
        'app-text-dark':           '#E3E7FA',   // dark   — high contrast on #283046
        'app-muted':               '#A3A0B3',   // light  — admin --vx-text-muted
        'app-muted-dark':          '#A3A0B3',   // dark   — same value, consistent

        // ── Primary light (tinted states) ────────────────────────────────────
        'app-primary-faint':       '#EBE9FD',   // light  — admin --vx-primary-light
        'app-primary-faint-dark':  '#352E6B',   // dark   — primary tint on #283046

        // ── Status (functional only — no cyan info) ───────────────────────────
        'app-success':             '#28C76F',   // admin --vx-success ✓
        'app-success-tint':        '#D1F7E2',   // 12% success on white
        'app-warning':             '#FF9F43',   // admin --vx-warning ✓
        'app-warning-tint':        '#FEF3C7',   // 12% warning on white
        'app-error':               '#EA5455',   // admin --vx-danger (was #FF4C51)
        'app-error-tint':          '#FCEAEA',   // 12% error on white
        'app-info':                '#7367F0',   // cyan removed — alias for primary

        // ── Brand ─────────────────────────────────────────────────────────────
        'app-aws':                 '#FF9900',   // AWS orange

        // ── Tab bar ───────────────────────────────────────────────────────────
        'app-tab-inactive':        '#A3A0B3',   // matches app-muted
      },

      fontFamily: {
        sans: ['PublicSans-Regular', 'system-ui', 'sans-serif'],
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
