/* =============================================================================
 * utils.js — Boîte à outils maths & helpers, sans dépendance.
 * ========================================================================== */
(function (PF) {
  "use strict";

  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)");

  const U = {
    /** Borne v dans [min, max]. */
    clamp: (v, min, max) => (v < min ? min : v > max ? max : v),

    /** Interpolation linéaire. */
    lerp: (a, b, t) => a + (b - a) * t,

    /**
     * Lissage exponentiel indépendant du framerate.
     * `smooth` ~ 0..1 : fraction rattrapée par seconde (0.001 = lent, 0.2 = vif).
     */
    damp: (a, b, smooth, dt) => U.lerp(a, b, 1 - Math.pow(smooth, dt)),

    dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
    dist2: (ax, ay, bx, by) => {
      const dx = ax - bx, dy = ay - by;
      return dx * dx + dy * dy;
    },

    /** Interpole un angle en gérant le passage par ±π (chemin le plus court). */
    lerpAngle: (a, b, t) => {
      let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (d < -Math.PI) d += Math.PI * 2;
      return a + d * t;
    },

    rand: (min, max) => min + Math.random() * (max - min),
    randInt: (min, max) => Math.floor(U.rand(min, max + 1)),

    /** Convertit "#rrggbb" en {r,g,b}. */
    hexToRgb: (hex) => {
      const h = hex.replace("#", "");
      const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    },

    /** "rgba(r,g,b,a)" depuis un hex + alpha. */
    rgba: (hex, a) => {
      const { r, g, b } = U.hexToRgb(hex);
      return `rgba(${r},${g},${b},${a})`;
    },

    /** Mélange deux hex (t=0 → a, t=1 → b), renvoie "#rrggbb". */
    mix: (a, b, t) => {
      const A = U.hexToRgb(a), B = U.hexToRgb(b);
      const c = (k) => Math.round(U.lerp(A[k], B[k], t));
      const h = (n) => n.toString(16).padStart(2, "0");
      return `#${h(c("r"))}${h(c("g"))}${h(c("b"))}`;
    },

    /** Détection capacités d'environnement (calculée une fois). */
    env: {
      touch: matchMedia("(hover: none), (pointer: coarse)").matches,
      /** Lu en direct : suit le réglage système même s'il change pendant la visite. */
      get reducedMotion() { return REDUCED.matches; },
    },
  };

  PF.U = U;

  /**
   * Pré-rendu (tools/prerender.py) : avec ?prerender dans l'URL, publie le HTML
   * final des blocs `ids` dans <script type="application/json" id="__prerender">.
   * Le script Python l'injecte ensuite dans la page source, pour que le contenu
   * soit lisible sans JavaScript (moteurs de recherche, aperçus LinkedIn).
   */
  PF.isPrerender = /[?&]prerender\b/.test(location.search);
  PF.prerender = (ids) => {
    const out = {};
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const c = el.cloneNode(true);
      c.querySelectorAll(".reveal").forEach((n) => { n.classList.remove("in"); n.removeAttribute("style"); });
      c.querySelectorAll("a.on").forEach((n) => n.classList.remove("on"));   // lien de menu « courant »
      c.querySelectorAll('[class=""]').forEach((n) => n.removeAttribute("class"));
      out[id] = c.innerHTML.trim();
    });
    const s = document.createElement("script");
    s.type = "application/json";
    s.id = "__prerender";
    s.textContent = JSON.stringify(out).replace(/</g, "\\u003c");
    document.body.appendChild(s);
  };
})(window.PF = window.PF || {});
