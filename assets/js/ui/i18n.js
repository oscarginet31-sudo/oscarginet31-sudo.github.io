/* =============================================================================
 * i18n.js — Internationalisation FR/EN. Source : PF.STRINGS (chrome) et les
 * objets {fr,en} de PF.CONTENT. Expose :
 *   PF.lang            langue courante
 *   PF.t(key)          chaîne d'interface
 *   PF.tx(value)       résout un {fr,en} (ou renvoie la string telle quelle)
 *   PF.setLang / PF.onLang
 * ========================================================================== */
(function (PF) {
  "use strict";

  const KEY = "pf-lang";
  PF.lang = localStorage.getItem(KEY) || (navigator.language || "fr").slice(0, 2);
  if (PF.lang !== "en") PF.lang = "fr";

  const listeners = [];

  PF.t = (key) => {
    const s = PF.STRINGS[key];
    return s ? (s[PF.lang] ?? s.fr) : key;
  };

  PF.tx = (v) => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    return v[PF.lang] ?? v.fr ?? "";
  };

  PF.setLang = (lang) => {
    lang = lang === "en" ? "en" : "fr";
    if (lang === PF.lang) return;
    PF.lang = lang;
    localStorage.setItem(KEY, lang);
    document.documentElement.lang = lang;
    listeners.forEach((fn) => fn(lang));
  };

  PF.onLang = (fn) => listeners.push(fn);

  /** Libellé localisé d'un hub depuis son id. */
  PF.hubLabel = (id) => {
    const h = PF.CONTENT.hubs.find((x) => x.id === id);
    return h ? PF.tx(h.label) : id;
  };

  document.documentElement.lang = PF.lang;

  /** Mode affiche (?og) : rendu figé sans interface, pour l'image de partage. */
  PF.OG = new URLSearchParams(location.search).has("og");
  if (PF.OG) { PF.lang = "fr"; document.documentElement.lang = "fr"; }
})(window.PF = window.PF || {});
