/* =============================================================================
 * intro3d.js — Écran d'accueil, posé en transparence sur la galaxie qui
 * tourne lentement derrière. Au clic, lance onEnter.
 * ========================================================================== */
(function (PF) {
  "use strict";
  const { U } = PF;

  class Intro3D {
    constructor(onEnter, onTour) {
      this.root = document.getElementById("intro");
      this.onEnter = onEnter;
      this.entered = false;
      document.getElementById("enter").addEventListener("click", () => this.enter());
      document.getElementById("enter-tour").addEventListener("click", () => { this.enter(); onTour && onTour(); });
      addEventListener("keydown", (e) => { if (!this.entered && e.key === "Enter") this.enter(); });
      PF.onLang(() => this.localize());
      this.localize();
      if (U.env.reducedMotion) this.root.classList.add("reduced");
      if (PF.OG) document.body.classList.add("og");
      requestAnimationFrame(() => this.root.classList.add("ready"));
    }

    localize() {
      const id = PF.CONTENT.identity;
      const set = (sel, txt) => { const el = this.root.querySelector(sel); if (el) el.textContent = txt; };
      set(".intro-role", PF.tx(id.role));
      const tg = id.taglines[PF.lang] || id.taglines.fr;
      set(".intro-tagline", tg[PF.OG ? 0 : Math.floor(Math.random() * tg.length)]);
      set("#enter .enter-label", PF.t("intro.enter"));
      set(".enter-tour-label", PF.t("tour.startLong"));
      set(".intro-classic-label", PF.t("hud.classic") + " →");
      set(".intro-reduced", PF.t("intro.reduced"));
      set(".intro-eyebrow-text", PF.lang === "fr" ? "Portfolio 3D · Cybersécurité & Réseaux" : "3D portfolio · Cybersecurity & Networks");
      const ctrl = this.root.querySelector(".intro-controls");
      const fr = PF.lang === "fr";
      if (ctrl) ctrl.innerHTML = U.env.touch
        ? `<span>${PF.t("intro.controlsTouch")}</span><b aria-hidden="true">·</b><span>${fr ? "touchez une étoile" : "tap a star"}</span>`
        : `<kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd><span>${PF.t("intro.controls")}</span>
           <b aria-hidden="true">·</b><kbd>${fr ? "souris" : "mouse"}</kbd><span>${PF.t("intro.look")}</span>
           <b aria-hidden="true">·</b><kbd>1</kbd>–<kbd>5</kbd><span>${fr ? "pilote auto" : "autopilot"}</span>`;
    }

    enter() {
      if (this.entered) return;
      this.entered = true;
      this.root.classList.add("gone");
      setTimeout(() => { this.root.style.display = "none"; }, 900);
      this.onEnter();
    }
  }

  PF.Intro3D = Intro3D;
})(window.PF = window.PF || {});
