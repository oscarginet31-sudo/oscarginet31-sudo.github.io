/* cv.js — Rendu du CV (cv.html) depuis assets/js/data/content.js. ?lang=fr|en
 * Pensé pour être lu en quelques secondes : objectif et réalisations en gras en haut,
 * le détail ensuite pour qui veut creuser. Textes propres au CV : PF.CONTENT.cv. */
(function (PF) {
  "use strict";
  // Langue imposée par l'URL (?lang=en), indépendamment des préférences du navigateur.
  PF.lang = new URLSearchParams(location.search).get("lang") === "en" ? "en" : "fr";
  document.documentElement.lang = PF.lang;
  const C = PF.CONTENT, V = C.cv, X = C.experience, tx = PF.tx, fr = PF.lang === "fr";
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  /** **gras** (après échappement). */
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  const L = (f, e) => (fr ? f : e);
  document.title = L("CV — Oscar Ginet", "Resume — Oscar Ginet");

  // Le téléphone n'est pas dans le dépôt : tools/build_cv.py l'injecte (<meta name="cv-phone">)
  // depuis tools/private.json, fichier local ignoré par Git. Sans lui, la ligne est omise.
  const tel = (document.querySelector('meta[name="cv-phone"]') || {}).content || "";   // ex. "+33 6 12 34 56 78"
  const SITE = "oscarginet31-sudo.github.io";
  const lam = X.jobs[0];
  const reserve = C.engagement.items.find((e) => e.featured);

  const contact = [
    `<a href="mailto:${esc(C.contact.email)}">${esc(C.contact.email)}</a>`,
    tel && `<a href="tel:${esc(tel.replace(/\s/g, ""))}">${esc(fr ? tel.replace(/^\+33\s?/, "0") : tel)}</a>`,
    `<a href="${esc(C.contact.linkedin)}">linkedin.com/in/oscar-ginet</a>`,
    `${esc(tx(C.identity.location))} · ${esc(L("permis B", "driving licence"))}`,
  ].filter(Boolean);

  // Une ligne par certification : nom en gras, organisme et année à droite.
  const certs = X.certifications.map((c) => ({
    k: c.cvName || c.short || tx(c.name),
    v: [c.issuer && tx(c.issuer).split(" — ")[0], (/\d{4}/.exec(tx(c.date)) || [""])[0]].filter((x) => x && x !== (c.short || tx(c.name))).join(" · "),
  }));
  const kv = (items, cls = "") => `<ul class="kv ${cls}">${items.map((i) => `<li><b>${esc(i.k)}</b><span>${esc(i.v)}</span></li>`).join("")}</ul>`;

  document.getElementById("cv").innerHTML = `
    <header class="top">
      <div>
        <h1>Oscar <em>Ginet</em></h1>
        <p class="role">${esc(tx(C.identity.role))}</p>
        ${V.now.map((l) => `<p class="now">${md(tx(l))}</p>`).join("")}
      </div>
      <ul class="contact">${contact.map((c) => `<li>${c}</li>`).join("")}</ul>
    </header>

    <p class="goal"><span>${L("Objectif", "Goal")}</span>${md(tx(V.goal))}</p>

    <div class="cols">
      <div>
        <section><h2>${L("Expérience", "Experience")}</h2>
          <article class="job">
            <div class="row"><h3>${esc(tx(lam.title))}</h3><span class="date">${esc(L("Depuis sept. 2024", "Since Sep 2024"))}</span></div>
            <p class="org"><b>${esc(tx(lam.org))}</b> · ${esc(L("groupe industriel multi-sites, petite équipe IT", "multi-site industrial group, small IT team"))}</p>
            <ul class="hl">${V.highlights.map((h) => `<li>${md(tx(h))}</li>`).join("")}</ul>
          </article>
          <article class="job">
            <div class="row"><h3>${esc(tx(reserve.title))}</h3><span class="date">${esc(L("Depuis juil. 2026", "Since Jul 2026"))}</span></div>
            <p class="org"><b>${esc(L("Armée de Terre", "French Army"))}</b> · ${esc(L("troupes de montagne, engagement de 5 ans en parallèle de l’alternance", "mountain troops, 5-year commitment alongside the apprenticeship"))}</p>
          </article>
        </section>

        <section><h2>${L("Formation", "Education")}</h2>
          <ul class="edu">${X.education.filter((e) => e.cv !== false).map((e) => `
            <li><span class="date">${esc(e.date)}</span><div>
              <h3>${esc(tx(e.title))}${e.badge ? `<em>${esc(tx(e.badge))}</em>` : ""}</h3>
              <p>${esc(tx(e.org))}</p></div></li>`).join("")}</ul>
        </section>
      </div>

      <aside class="side">
        <section><h2>${L("Compétences", "Skills")}</h2>${kv(V.skills.map((s) => ({ k: tx(s.k), v: tx(s.v) })))}</section>
        <section><h2>${L("Certifications", "Certifications")}</h2>${kv(certs, "line")}</section>
        <section><h2>${L("Langues", "Languages")}</h2>${kv(V.languages.map((l) => ({ k: tx(l.name), v: tx(l.level) })), "line")}</section>
        <section><h2>${L("À côté", "Outside work")}</h2><p class="hobbies">${esc(tx(V.hobbies))}</p></section>
      </aside>
    </div>

    <p class="foot"><span>${md(tx(V.foot))}</span><a href="https://${SITE}/">${SITE} →</a></p>`;
})(window.PF);
