/* =============================================================================
 * early.js — Chargé dans <head> (bloquant, minuscule), avant le premier rendu :
 *   - pose le thème tout de suite (pas de flash clair → sombre) ;
 *   - ajoute la classe .js : les animations d'apparition ne masquent le contenu
 *     pré-rendu que si JavaScript tourne (sans JS, tout reste lisible).
 * ========================================================================== */
(function () {
  "use strict";
  var root = document.documentElement, stored = null;
  root.classList.add("js");
  try { stored = localStorage.getItem("theme"); } catch (e) { /* stockage bloqué */ }
  var dark = stored ? stored === "dark" : !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  root.setAttribute("data-theme", dark ? "dark" : "light");
})();
