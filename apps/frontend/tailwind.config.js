/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-tertiary-container": "#98805d", "inverse-on-surface": "#f3f0f2", "on-secondary-fixed": "#0b1c30",
        "on-background": "#1b1b1d", "on-surface-variant": "#45464d", "surface": "#fcf8fa",
        "tertiary-container": "#271901", "primary": "#000000", "tertiary-fixed": "#fcdeb5",
        "on-tertiary-fixed-variant": "#574425", "on-primary-container": "#7c839b", "surface-container-highest": "#e4e2e4",
        "surface-container": "#f0edef", "on-primary-fixed": "#131b2e", "tertiary-fixed-dim": "#dec29a",
        "secondary-fixed": "#d3e4fe", "on-tertiary": "#ffffff", "primary-fixed": "#dae2fd",
        "inverse-primary": "#bec6e0", "primary-fixed-dim": "#bec6e0", "tertiary": "#000000",
        "on-secondary-fixed-variant": "#38485d", "outline": "#76777d", "error": "#ba1a1a",
        "on-error-container": "#93000a", "on-secondary": "#ffffff", "secondary-container": "#d0e1fb",
        "secondary-fixed-dim": "#b7c8e1", "outline-variant": "#c6c6cd", "background": "#fcf8fa",
        "error-container": "#ffdad6", "on-primary-fixed-variant": "#3f465c", "inverse-surface": "#303032",
        "on-tertiary-fixed": "#271901", "on-secondary-container": "#54647a", "surface-tint": "#565e74",
        "on-error": "#ffffff", "surface-container-lowest": "#ffffff", "surface-bright": "#fcf8fa",
        "surface-container-low": "#f6f3f5", "surface-dim": "#dcd9db", "secondary": "#505f76",
        "surface-container-high": "#eae7e9", "on-primary": "#ffffff", "primary-container": "#131b2e",
        "on-surface": "#1b1b1d", "surface-variant": "#e4e2e4"
      },
      borderRadius: { "DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem" },
      spacing: { "xs": "4px", "sm": "8px", "md": "16px", "lg": "24px", "xl": "32px", "container-margin": "24px", "gutter": "16px" },
      fontFamily: {
        "body-md": ["Inter"], "label-sm": ["Inter"], "headline-md": ["Inter"], "body-lg": ["Inter"],
        "display": ["Inter"], "label-md": ["Inter"], "headline-lg": ["Inter"], "headline-lg-mobile": ["Inter"]
      },
      fontSize: {
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-sm": ["11px", { lineHeight: "14px", fontWeight: "500" }],
        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "display": ["30px", { lineHeight: "38px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "600" }],
        "headline-lg": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-lg-mobile": ["20px", { lineHeight: "28px", fontWeight: "600" }]
      }
    },
  },
  plugins: [],
}
