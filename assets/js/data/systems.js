/* =============================================================================
 * systems.js — Adapte PF.CONTENT en "systèmes stellaires".
 * Chaque section = un système ; chaque item = une planète (un corps).
 * Un corps : { name, meta, desc, tags?, points?, groups?, metrics?, highlight?,
 *              href?, glyph? } — les champs texte restent des objets {fr,en}
 * résolus à l'affichage via PF.tx.
 * ========================================================================== */
(function (PF) {
  "use strict";

  const C = PF.CONTENT;
  /** Concatène des morceaux bilingues : join(" · ", a, b) → {fr, en}. */
  const join = (sep, ...parts) => {
    const pick = (v, l) => (v == null ? "" : typeof v === "string" ? v : v[l] ?? v.fr);
    const out = (l) => parts.map((p) => pick(p, l)).filter(Boolean).join(sep);
    return { fr: out("fr"), en: out("en") };
  };

  /** Construit la liste des corps d'un système à partir de son id. */
  function bodies(id) {
    switch (id) {
      case "skills":
        return C.skills.categories.flatMap((cat) =>
          cat.items.map((it) => ({
            name: it.name, short: it.short, meta: join(" · ", cat.code, cat.name), desc: it.note,
            tags: (it.ctx || []).map((k) => PF.STRINGS["ctx." + k]),
          })));

      case "experience":
        return [
          ...C.experience.jobs.map((j) => ({
            name: j.title, short: j.org, meta: join(" · ", j.org, j.date), desc: j.desc,
            groups: j.groups, tags: j.tags, sub: j.meta,
          })),
          ...C.experience.education.map((e) => ({
            name: e.title, short: e.short, meta: join(" · ", e.org, e.date), desc: e.desc, highlight: e.highlight,
          })),
          ...C.experience.certifications.map((c) => ({
            name: c.name, short: c.short, meta: join(" · ", c.issuer, c.date), desc: c.note || { fr: "", en: "" },
            tags: [{ fr: "Certification", en: "Certification" }],
          })),
        ];

      case "projects":
        return C.projects.items.map((p) => ({
          name: p.title, short: p.short,
          meta: join(" · ", PF.STRINGS["proj.org." + p.ctx], p.badge),
          desc: p.desc, points: p.points, metrics: p.metrics, tags: p.env,
          href: p.link && p.link.href, hrefLabel: p.link && p.link.label, diagram: p.diagram,
        }));

      case "engagement":
        return C.engagement.items.map((e) => ({
          name: e.title, short: e.short, meta: e.meta, desc: e.desc, glyph: e.glyph,
        }));

      case "contact":
        return C.contact.links.map((l) => ({
          name: l.value, meta: l.label, href: l.href,
          desc: { fr: "", en: "" },
        }));

      default:
        return [];
    }
  }

  /** Métadonnées d'un système (titre/intro de section + couleur d'accent). */
  PF.getSystem = (id) => {
    const def = C.hubs.find((h) => h.id === id);
    const section = C[id] || {};
    return {
      id,
      label: def.label,
      glyph: def.glyph,
      color: def.color,
      title: section.title,
      intro: section.intro,
      bodies: bodies(id),
    };
  };

  PF.systemIds = () => C.hubs.map((h) => h.id);
})(window.PF = window.PF || {});
