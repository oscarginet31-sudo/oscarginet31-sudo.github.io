/* =============================================================================
 * infocard.js — Fiche descriptive (overlay centré) :
 *   open(planet)  fiche d'un item (projet, compétence, expérience…)
 *   openCore()    fiche "à propos" quand on vise le cœur galactique
 * Le contenu vient des objets {fr,en} de PF.CONTENT, résolus via PF.tx.
 * ========================================================================== */
(function (PF) {
  "use strict";
  const tx = PF.tx;
  const esc = (s) => String(s).replace(/[&<>"]/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  /** *texte* → <em>texte</em> (après échappement). */
  const rich = (s) => esc(s).replace(/\*(.+?)\*/g, "<em>$1</em>");

  const CLASS = {
    terran: { fr: "Planète tellurique", en: "Terrestrial planet" },
    ocean: { fr: "Monde océan", en: "Ocean world" },
    gas: { fr: "Géante gazeuse", en: "Gas giant" },
    icegiant: { fr: "Géante de glace", en: "Ice giant" },
    desert: { fr: "Planète désertique", en: "Desert planet" },
    ice: { fr: "Monde glacé", en: "Ice world" },
    lava: { fr: "Monde de lave", en: "Lava world" },
    rock: { fr: "Planète rocheuse", en: "Rocky planet" },
    toxic: { fr: "Monde à effet de serre", en: "Greenhouse world" },
  };

  class InfoCard {
    constructor(root) {
      this.root = root;
      this.content = root.querySelector("#card-content");
      this.current = null;
      this.onClose = () => {};
      root.querySelector(".card-close").addEventListener("click", () => this.close());
      root.querySelector(".card-scrim").addEventListener("click", () => this.close());
      addEventListener("keydown", (e) => {
        if (this.current && (e.key === "Escape" || e.key.toLowerCase() === "e")) this.close();
      });
      PF.onLang(() => { if (this.current) this._build(this.current); });
    }

    _build(cur) {
      if (cur === "core") return this._buildCore();
      if (cur === "secret") return this._buildSecret();
      const planet = cur, b = planet.body, color = planet.color;
      const kind = CLASS[planet.obj.userData.type];
      const list = (arr) => arr && arr.length
        ? `<ul class="card-points">${arr.map((p) => `<li>${esc(tx(p))}</li>`).join("")}</ul>` : "";
      const groups = b.groups ? `<div class="card-groups">${b.groups.map((g) => `
          <div class="card-group"><h3>${esc(tx(g.label))}</h3>${list(g.points)}</div>`).join("")}</div>` : "";
      const metrics = b.metrics ? `<div class="card-metrics">${b.metrics.map((m) => `
          <div><b>${esc(tx(m.value))}</b><span>${esc(tx(m.label))}</span></div>`).join("")}</div>` : "";
      const tags = b.tags && b.tags.length
        ? `<div class="tags">${b.tags.map((t) => `<span class="tag">${esc(tx(t))}</span>`).join("")}</div>` : "";
      const cta = b.href ? `
        <div class="card-cta">
          <a class="btn btn-primary" href="${esc(b.href)}"${b.href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>
            ${esc(tx(b.hrefLabel || b.name))} ${b.href.startsWith("http") ? "↗" : "→"}
          </a>
        </div>` : "";

      this.content.innerHTML = `
        <div class="card-eyebrow" style="color:${color}">
          <span class="card-dot" style="background:${color}"></span>${esc(tx(planet.system.def.label))}
          ${kind ? `<span class="card-class">· ${esc(tx(kind))}</span>` : ""}
        </div>
        <h2 class="card-title">${esc(tx(b.name))}</h2>
        ${b.meta && tx(b.meta) ? `<div class="card-meta">${esc(tx(b.meta))}</div>` : ""}
        ${b.sub ? `<div class="card-sub">${esc(tx(b.sub))}</div>` : ""}
        ${b.highlight ? `<div class="card-highlight">★ ${esc(tx(b.highlight))}</div>` : ""}
        ${tx(b.desc) ? `<p class="card-desc">${esc(tx(b.desc))}</p>` : ""}
        ${metrics}${b.diagram ? `<figure class="diagram-fig">${PF.diagram(b.diagram)}<figcaption>${esc(PF.diagramCaption())}</figcaption></figure>` : ""}${list(b.points)}${groups}${tags}${cta}`;
      this.root.style.setProperty("--hub", color);
    }

    _buildCore() {
      const id = PF.CONTENT.identity;
      const fr = PF.lang === "fr";
      const stats = id.stats.map((s) => `<div><b>${esc(tx(s.value))}</b><span>${esc(tx(s.label))}</span></div>`).join("");
      this.content.innerHTML = `
        <div class="card-eyebrow" style="color:#ffd9a0">
          <span class="card-dot" style="background:#ffd9a0"></span>${fr ? "Cœur galactique" : "Galactic core"}
        </div>
        <h2 class="card-title">${esc(id.name)}</h2>
        <div class="card-meta">${esc(tx(id.headline))}</div>
        <p class="card-quote">${rich(tx(id.motto))}</p>
        ${id.bio.map((p) => `<p class="card-desc">${esc(tx(p))}</p>`).join("")}
        <div class="card-metrics">${stats}</div>
        <div class="card-cta">
          <a class="btn btn-primary" href="${PF.t("cv.file")}" download>${fr ? "Télécharger le CV" : "Download CV"} ↓</a>
          <a class="btn btn-ghost" href="${esc(PF.CONTENT.contact.links[2].href)}" target="_blank" rel="noopener">LinkedIn ↗</a>
          <a class="btn btn-ghost" href="classic.html">${esc(PF.t("hud.classic"))} →</a>
        </div>`;
      this.root.style.setProperty("--hub", "#ffd9a0");
    }

    _buildSecret() {
      const fr = PF.lang === "fr", gold = "#ffd27a", n = PF.app3d ? PF.app3d.app.galaxy.planetCount : 41;
      this.content.innerHTML = `
        <div class="card-eyebrow" style="color:${gold}"><span class="card-dot" style="background:${gold}"></span>${fr ? "Succès débloqué" : "Achievement unlocked"}</div>
        <h2 class="card-title">${fr ? "Explorateur de galaxie" : "Galaxy explorer"}</h2>
        <div class="card-meta">${fr ? `Les ${n} planètes explorées` : `All ${n} planets explored`}</div>
        <p class="card-quote">${fr ? "Merci d’être allé <em>jusqu’au bout.</em>" : "Thanks for going <em>all the way.</em>"}</p>
        <p class="card-desc">${fr
          ? "Vous avez vu l’ensemble de mon parcours : projets, compétences, formation et engagements. Si vous êtes arrivé jusqu’ici, nous avons sûrement des choses à nous dire."
          : "You’ve seen my whole journey: projects, skills, education and commitments. If you made it this far, we probably have things to talk about."}</p>
        <p class="card-desc">${fr ? "Dernier secret : ouvrez le terminal (touche /) et tapez" : "One last secret: open the terminal (/ key) and type"} <code class="card-code">sudo hire oscar</code>.</p>
        <div class="card-cta">
          <a class="btn btn-primary" href="mailto:${esc(PF.CONTENT.contact.email)}">${fr ? "Écrire un email" : "Send an email"} →</a>
          <a class="btn btn-ghost" href="${PF.t("cv.file")}" download>${fr ? "Télécharger le CV" : "Download CV"} ↓</a>
        </div>`;
      this.root.style.setProperty("--hub", gold);
    }

    openSecret() { this.open("secret"); }

    open(planet) {
      if (!this.current) this._returnFocus = document.activeElement;
      this.current = planet;
      this._build(planet);
      this.root.classList.add("open");
      this.root.setAttribute("aria-hidden", "false");
      const title = this.content.querySelector(".card-title");
      this.root.querySelector(".card-body").setAttribute("aria-label", title ? title.textContent : "Fiche");
      setTimeout(() => this.root.querySelector(".card-close").focus({ preventScroll: true }), 60);
      this.root.querySelector(".card-body").scrollTop = 0;
    }

    openCore() { this.open("core"); }

    close() {
      if (!this.current) return;
      this.current = null;
      this.root.classList.remove("open");
      this.root.setAttribute("aria-hidden", "true");
      const back = this._returnFocus;
      this._returnFocus = null;
      if (back && back.focus && document.contains(back)) back.focus({ preventScroll: true });
      this.onClose();
    }
  }

  PF.InfoCard = InfoCard;
})(window.PF = window.PF || {});
