/* =============================================================================
 * case.js — Rendu de l'étude de cas (etude-edr.html) depuis PF.CASE_EDR :
 * sommaire collant, chiffres clés, tableaux, schéma, extrait de code coloré.
 * FR/EN et thème partagés avec le reste du site.
 * ========================================================================== */
(function (PF) {
  "use strict";
  const K = PF.CASE_EDR, tx = PF.tx, t = PF.t;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  /** **gras** et *italique* (après échappement). */
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");

  /** Coloration minimale PowerShell : commentaires, chaînes, variables, cmdlets. */
  function highlight(code) {
    return code.split("\n").map((line) => {
      const i = line.indexOf("#");
      const body = i >= 0 ? line.slice(0, i) : line, comment = i >= 0 ? line.slice(i) : "";
      let h = esc(body)
        .replace(/(&quot;.*?&quot;)/g, '<span class="c-str">$1</span>')
        .replace(/(\$[A-Za-z_]\w*)/g, '<span class="c-var">$1</span>')
        .replace(/\b([A-Z][a-z]+-[A-Z]\w+)\b/g, '<span class="c-cmd">$1</span>');
      return h + (comment ? `<span class="c-com">${esc(comment)}</span>` : "");
    }).join("\n");
  }

  const table = (tb) => `
    <div class="case-table-wrap"><table class="case-table">
      ${tb.caption ? `<caption>${esc(tx(tb.caption))}</caption>` : ""}
      <thead><tr>${tb.head.map((h) => `<th scope="col">${esc(tx(h))}</th>`).join("")}</tr></thead>
      <tbody>${tb.rows.map((r) => `<tr>${r.map((c, i) => {
        const v = esc(tx(c));
        if (i === 0) return `<th scope="row">${v}</th>`;
        const verdict = i === r.length - 1 && /^(Retenu|Selected|Écarté|Ruled out)$/.test(tx(c));
        return `<td>${verdict ? `<span class="verdict ${/Retenu|Selected/.test(tx(c)) ? "ok" : ""}">${v}</span>` : v}</td>`;
      }).join("")}</tr>`).join("")}</tbody>
    </table></div>`;

  function render() {
    document.documentElement.lang = PF.lang;
    document.title = (PF.lang === "fr" ? "Migration EDR + SOC : étude de cas" : "EDR + SOC rollout: case study") + " — Oscar Ginet";
    $$("[data-t]").forEach((el) => (el.textContent = t(el.dataset.t)));
    $$("[data-t-label]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.tLabel)));
    $$("[data-lang-pill]").forEach((el) => el.classList.toggle("active", el.dataset.langPill === PF.lang));
    $$('a[href^="CV_Ginet_Oscar"]').forEach((a) => a.setAttribute("href", t("cv.file")));

    $("#toc").innerHTML = `<p class="toc-title">${esc(t("case.toc"))}</p><ol>${K.sections.map((s) =>
      `<li><a href="#${s.id}" data-sec="${s.id}">${esc(tx(s.title))}</a></li>`).join("")}</ol>`;

    $("#case").innerHTML = `
      <header class="case-head">
        <p class="sec-label"><span>EDR</span>${esc(tx(K.eyebrow))}</p>
        <h1 class="case-title">${md(tx(K.title))}</h1>
        <p class="case-lead">${esc(tx(K.lead))}</p>
        <ul class="stats case-facts">${K.facts.map((f) => `<li><b>${esc(tx(f.value))}</b><span>${esc(tx(f.label))}</span></li>`).join("")}</ul>
        <p class="case-role">${esc(tx(K.role))}</p>
        <blockquote class="case-q"><p>${esc(tx(K.question))}</p></blockquote>
      </header>
      ${K.sections.map((s) => `
        <section class="case-sec" id="${s.id}" aria-labelledby="${s.id}-h">
          <h2 id="${s.id}-h">${esc(tx(s.title))}</h2>
          ${(s.paras || []).map((p) => `<p>${md(tx(p))}</p>`).join("")}
          ${s.list ? `<ul class="case-list">${s.list.map((l) => `<li>${md(tx(l))}</li>`).join("")}</ul>` : ""}
          ${s.table ? table(s.table) : ""}
          ${s.diagram ? `<figure class="diagram-fig">${PF.diagram(s.diagram)}<figcaption>${esc(PF.diagramCaption())}</figcaption></figure>` : ""}
          ${s.code ? `<figure class="case-code"><pre><code>${highlight(s.code[PF.lang] || s.code.fr)}</code></pre><figcaption>${esc(tx(s.code.caption))}</figcaption></figure>` : ""}
          ${s.after ? `<p>${md(tx(s.after))}</p>` : ""}
        </section>`).join("")}
      <section class="case-cta" aria-label="Contact">
        <p class="case-cta-title">${esc(tx(K.cta))}</p>
        <div class="cc-cta">
          <a class="btn btn-cream" href="mailto:${esc(PF.CONTENT.contact.email)}">${esc(t("contact.write"))} <span aria-hidden="true">→</span></a>
          <a class="btn btn-line" href="${esc(t("cv.file"))}" download>${esc(t("hero.cta.cv"))} <span aria-hidden="true">↓</span></a>
          <a class="btn btn-line" href="classic.html#projects">${esc(t("case.more"))} <span aria-hidden="true">→</span></a>
        </div>
      </section>`;
    spy();
  }

  /* Sommaire : section courante surlignée. */
  let io = null;
  function spy() {
    if (io) io.disconnect();
    if (!("IntersectionObserver" in window)) return;
    io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      $$("#toc a").forEach((a) => a.classList.toggle("on", a.dataset.sec === e.target.id));
    }), { rootMargin: "-30% 0px -60% 0px" });
    $$(".case-sec").forEach((s) => io.observe(s));
  }

  $("#theme-toggle").addEventListener("click", () => PF.toggleTheme());
  $("#lang-toggle").addEventListener("click", () => PF.setLang(PF.lang === "fr" ? "en" : "fr"));
  const want = PF.isPrerender ? "fr" : new URLSearchParams(location.search).get("lang");
  if (want === "en" || want === "fr") PF.setLang(want);
  PF.onLang(render);
  render();
  if (PF.isPrerender) return PF.prerender(["toc", "case"]);
  if (location.hash) { const el = $(location.hash); if (el) el.scrollIntoView(); }
})(window.PF = window.PF || {});
