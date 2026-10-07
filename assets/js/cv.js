/* cv.js — Rendu du CV (cv.html) depuis assets/js/data/content.js. ?lang=fr|en */
(function (PF) {
  "use strict";
  // Langue imposée par l'URL (?lang=en), indépendamment des préférences du navigateur.
  PF.lang = new URLSearchParams(location.search).get("lang") === "en" ? "en" : "fr";
  document.documentElement.lang = PF.lang;
  const C = PF.CONTENT, tx = PF.tx, fr = PF.lang === "fr";
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const L = (f, e) => (fr ? f : e);
  document.title = L("CV — Oscar Ginet", "Resume — Oscar Ginet");

  /* --- Colonne latérale --- */
  const links = C.contact.links;
  const contact = [
    [L("Email", "Email"), `<a href="mailto:${esc(C.contact.email)}">${esc(C.contact.email)}</a>`],
    [L("Téléphone", "Phone"), `<a href="tel:+33685330014">${esc(L(links[1].value, "+33 6 85 33 00 14"))}</a>`],
    ["LinkedIn", `<a href="${esc(links[2].href)}">linkedin.com/in/oscar-ginet-6523862b3</a>`],
    [L("Basé", "Based"), esc(tx(C.identity.location))],
    [L("Mobilité", "Mobility"), esc(L("Permis B · véhicule personnel", "Driving licence · own car"))],
  ];
  document.getElementById("side").innerHTML = `
    <section><h2>${L("Contact", "Contact")}</h2>
      <ul class="contact">${contact.map(([k, v]) => `<li><span>${k}</span>${v}</li>`).join("")}</ul></section>
    <section><h2>${L("Compétences", "Skills")}</h2>
      <div class="skills">${C.skills.categories.map((c) => `
        <div><h3>${esc(tx(c.name))}</h3><p>${c.items.map((i) => esc(tx(i.name))).join(" · ")}</p></div>`).join("")}</div></section>
    <section><h2>${L("Certifications", "Certifications")}</h2>
      <ul class="certs">${C.experience.certifications.map((c) => `
        <li><b>${esc(tx(c.name))}</b><span>${esc(tx(c.issuer))} · ${esc(tx(c.date))}</span></li>`).join("")}</ul></section>
    <section><h2>${L("Langues", "Languages")}</h2>
      <ul class="langs">${C.cv.languages.map((l) => `<li>${esc(tx(l.name))} <span>— ${esc(tx(l.level))}</span></li>`).join("")}</ul></section>
    <section><h2>${L("Centres d’intérêt", "Interests")}</h2>
      <ul class="interests">${C.cv.interests.map((i) => `<li>${esc(tx(i))}</li>`).join("")}</ul></section>`;

  /* --- Colonne principale --- */
  const X = C.experience;
  const lam = X.jobs[0], farm = X.jobs[1];
  const reserve = C.engagement.items.find((e) => e.featured);
  const pro = C.projects.items.filter((p) => p.ctx === "pro");
  const iut = C.projects.items.filter((p) => p.ctx === "iut");

  document.getElementById("main").innerHTML = `
    <header class="head">
      <h1 class="name">Oscar <em>Ginet</em></h1>
      <p class="role">${esc(tx(C.identity.role))}</p>
      <p class="sub">${esc(L("BUT Réseaux & Télécommunications parcours Cybersécurité · IUT d’Annecy · alternance jusqu’en juillet 2027",
                            "BUT Networks & Telecommunications, Cybersecurity track · IUT Annecy · apprenticeship until July 2027"))}</p>
    </header>
    <p class="summary">${esc(tx(C.cv.summary))}</p>
    <p class="goal"><b>${esc(L("Objectif", "Goal"))}</b> ${esc(tx(C.identity.goal))}</p>

    <section><h2>${L("Expérience", "Experience")}</h2>
      <article class="job">
        <div class="job-top"><h3>${esc(tx(lam.title))}</h3><span class="date">${esc(tx(lam.date))}</span></div>
        <p class="org"><b>${esc(tx(lam.org))}</b> · ${esc(tx(lam.meta))}</p>
        <p class="desc">${esc(tx(lam.desc))}</p>
        <p class="domains">${lam.groups.map((g) => `<span>${esc(tx(g.label))}</span>`).join("")}</p>
      </article>
      <article class="job">
        <div class="job-top"><h3>${esc(tx(reserve.title))}</h3><span class="date">${esc(L("Juil. 2026 — aujourd’hui", "Jul 2026 — present"))}</span></div>
        <p class="org"><b>${esc(L("Armée de Terre", "French Army"))}</b> · ${esc(L("engagement de 5 ans · troupes de montagne · en parallèle de l’alternance", "5-year commitment · mountain troops · alongside the apprenticeship"))}</p>
      </article>
      <article class="job">
        <div class="job-top"><h3>${esc(tx(farm.title))}</h3><span class="date">${esc(tx(farm.date))}</span></div>
        <p class="org"><b>${esc(tx(farm.org))}</b> · ${esc(tx(farm.meta))}</p>
      </article>
    </section>

    <section><h2>${L("Projets en entreprise", "Projects on the job")}</h2>
      <ul class="projects">${pro.map((p) => `
        <li><b>${esc(tx(p.title))}${p.badge ? `<em>${esc(tx(p.badge))}</em>` : ""}</b>
          <p>${esc(tx(p.desc))}</p>
          <p class="tech">${p.env.map(esc).join(" · ")}</p></li>`).join("")}</ul>
      <p class="iut"><b>${L("À l’IUT :", "At university:")}</b> ${iut.map((p) => `${esc(tx(p.title))} (${esc(tx(p.badge))}, ${p.env.slice(0, 3).map(esc).join(", ")})`).join(" · ")}.</p>
    </section>

    <section><h2>${L("Formation", "Education")}</h2>
      <ul class="edu">${X.education.map((e, i) => `
        <li><span class="date">${esc(e.date)}</span><div><b>${esc(tx(e.title))}</b><p>${esc(tx(e.org))}${tx(e.desc) && i > 0 ? " — " + esc(tx(e.desc)) : ""}</p></div></li>`).join("")}</ul>
    </section>

    <p class="foot"><span>${esc(L("Portfolio interactif : galaxie 3D et version classique — lien sur mon profil LinkedIn", "Interactive portfolio: 3D galaxy and classic version — link on my LinkedIn profile"))}</span><span>${new Date().getFullYear()}</span></p>`;
})(window.PF);
