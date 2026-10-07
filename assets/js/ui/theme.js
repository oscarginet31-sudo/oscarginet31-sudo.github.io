/* =============================================================================
 * theme.js — Thème clair/sombre. Pilote l'attribut [data-theme] (pour le CSS)
 * ET PF.palette (couleurs hex utilisées par le rendu canvas, qui ne sait pas
 * lire les variables CSS oklch de façon fiable).
 * ========================================================================== */
(function (PF) {
  "use strict";

  const KEY = "theme";
  const FONTS = {
    serif: "'Instrument Serif', Georgia, serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  };

  const PALETTES = {
    light: {
      bg: "#faf7ef", fg: "#1c1f26", cream: "#f7f0e0",
      blue: "#1d3a5f", accent: "#bf6a39",
      star: "#1d3a5f", netLine: "#1d3a5f", ...FONTS,
    },
    dark: {
      bg: "#111318", fg: "#e4e5e9", cream: "#f1e8d6",
      blue: "#7eaed4", accent: "#d08651",
      star: "#e8dcc8", netLine: "#5a8ab5", ...FONTS,
    },
  };

  const listeners = [];

  function apply(dark) {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    PF.palette = PALETTES[dark ? "dark" : "light"];
    PF.isDark = dark;
    localStorage.setItem(KEY, dark ? "dark" : "light");
    listeners.forEach((fn) => fn(dark));
  }

  PF.onTheme = (fn) => listeners.push(fn);
  PF.toggleTheme = () => apply(document.documentElement.getAttribute("data-theme") !== "dark");

  // Init : préférence stockée, sinon préférence système.
  const stored = localStorage.getItem(KEY);
  const dark = stored ? stored === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  apply(dark);
})(window.PF = window.PF || {});
