/* =============================================================================
 * tour.js — Visite guidée (≈ 1 min) pour les visiteurs qui ne veulent pas
 * piloter : le pilote automatique enchaîne les systèmes, ouvre les fiches
 * clés et affiche une légende. Étapes définies dans PF.CONTENT.tour.
 * Commandes : Suivant / Précédent / Pause / Quitter, touches ← → Échap.
 * ========================================================================== */
(function (PF) {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));

  class Tour {
    /**
     * @param app   SpaceApp
     * @param card  InfoCard
     * @param open  { planet(p), core() } : ouverture des fiches (avec le même
     *              comportement que si le visiteur cliquait lui-même)
     */
    constructor(app, card, open) {
      this.app = app; this.card = card; this.open = open;
      this.steps = PF.CONTENT.tour;
      this.active = false; this.paused = false;
      this.i = 0; this._dur = 0; this._elapsed = 0; this._raf = 0; this._poll = 0;

      const el = this.el = document.createElement("section");
      el.id = "tour";
      el.className = "tour";
      el.setAttribute("aria-live", "polite");
      el.innerHTML = `
        <div class="tour-top">
          <span class="tour-step"></span><span class="tour-title"></span>
          <button class="tour-x" data-quit>✕</button>
        </div>
        <p class="tour-text"></p>
        <div class="tour-bar"><i></i></div>
        <div class="tour-actions">
          <button class="tour-btn" data-prev>←</button>
          <button class="tour-btn" data-pause></button>
          <button class="tour-btn tour-main" data-next></button>
        </div>`;
      document.body.appendChild(el);
      this.bar = el.querySelector(".tour-bar i");
      el.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        if (b.hasAttribute("data-quit")) this.stop();
        else if (b.hasAttribute("data-prev")) this.go(this.i - 1);
        else if (b.hasAttribute("data-pause")) this.togglePause();
        else if (b.hasAttribute("data-next")) this.next();
        else if (b.hasAttribute("data-again")) this.go(0);
      });

      // Clavier (phase de capture : passe avant le pilotage, qui utilise aussi les flèches).
      addEventListener("keydown", (e) => {
        if (!this.active || /^(input|textarea)$/i.test(document.activeElement.tagName)) return;
        const k = e.key;
        if (k === "ArrowRight") this.next();
        else if (k === "ArrowLeft") this.go(this.i - 1);
        else if (k === "Escape") this.stop();
        else return;
        e.preventDefault(); e.stopImmediatePropagation();
      }, true);

      PF.onLang(() => { if (this.active) this._render(this.steps[this.i], this._flying); });
    }

    start() {
      if (this.active) return this.go(0);
      this.active = true;
      document.body.classList.add("touring");
      this.go(0);
    }

    stop() {
      if (!this.active) return;
      this.active = false;
      this._clear();
      document.body.classList.remove("touring");
      if (this.card.current) this.card.close();
    }

    next() { if (this.i >= this.steps.length - 1) this.stop(); else this.go(this.i + 1); }

    togglePause() {
      this.paused = !this.paused;
      this._renderButtons();
      if (!this.paused && this._dur) this._tick();
    }

    go(i) {
      if (!this.active) return;
      i = Math.max(0, Math.min(this.steps.length - 1, i));
      this._clear();
      this.i = i;
      this.paused = false;
      const st = this.steps[i];
      if (this.card.current) this.card.close();
      this._render(st, true);

      const arrived = () => {
        if (!this.active || this.i !== i) return;
        this._render(st, false);
        if (st.item != null) {
          const sys = this.app.activeSystem;
          const p = sys && sys.planets[st.item];
          if (p) this.open.planet(p);
        }
        if (!st.end) this._arm(st.item != null ? 12000 : 9000);
      };

      const app = this.app;
      if (st.system) {
        const sys = app.galaxy.systems.find((s) => s.id === st.system);
        if (app.mode === "system" && app.activeSystem === sys && !app.warping) setTimeout(arrived, 350);
        else { app.travelTo(sys); this._wait(() => app.mode === "system" && app.activeSystem === sys && !app.warping, arrived); }
      } else {
        if (app.mode === "system") app.exitSystem();
        this._wait(() => app.mode === "galaxy" && !app.warping, arrived);
      }
    }

    /* --- Interne ------------------------------------------------------ */
    _wait(cond, cb) {
      const t0 = performance.now();
      const check = () => {
        if (!this.active) return;
        if (cond() || performance.now() - t0 > 8000) cb();
        else this._poll = setTimeout(check, 120);
      };
      check();
    }

    /** Lance la minuterie de l'étape (barre de progression, pause possible). */
    _arm(ms) {
      this._dur = ms; this._elapsed = 0; this._last = performance.now();
      this._tick();
    }

    _tick() {
      cancelAnimationFrame(this._raf);
      this._last = performance.now();
      const loop = (now) => {
        if (!this.active || this.paused) return;
        this._elapsed += now - this._last; this._last = now;
        const k = Math.min(1, this._elapsed / this._dur);
        this.bar.style.transform = `scaleX(${k})`;
        if (k >= 1) { this.next(); return; }
        this._raf = requestAnimationFrame(loop);
      };
      this._raf = requestAnimationFrame(loop);
    }

    _clear() {
      cancelAnimationFrame(this._raf);
      clearTimeout(this._poll);
      this._dur = 0;
      this.bar.style.transform = "scaleX(0)";
    }

    _render(st, flying) {
      this._flying = flying;
      const el = this.el, n = this.steps.length;
      el.querySelector(".tour-step").textContent = `${this.i + 1} / ${n}`;
      el.querySelector(".tour-title").textContent = PF.tx(st.title);
      el.querySelector(".tour-text").innerHTML = flying
        ? `<span class="tour-fly">${esc(PF.t("tour.fly"))}</span>`
        : esc(PF.tx(st.text));
      el.querySelector("[data-quit]").setAttribute("aria-label", PF.t("tour.quit"));
      el.classList.toggle("is-end", !!st.end);
      this._renderButtons();
    }

    _renderButtons() {
      const el = this.el, st = this.steps[this.i];
      const prev = el.querySelector("[data-prev]"), pause = el.querySelector("[data-pause]"), next = el.querySelector("[data-next]");
      prev.disabled = this.i === 0;
      prev.setAttribute("aria-label", PF.t("tour.prev"));
      if (st.end) {
        pause.outerHTML = `<button class="tour-btn" data-again>↺ ${esc(PF.t("tour.again"))}</button>`;
        next.innerHTML = `${esc(PF.t("tour.free"))} →`;
      } else {
        const again = el.querySelector("[data-again]");
        if (again) again.outerHTML = `<button class="tour-btn" data-pause></button>`;
        const p = el.querySelector("[data-pause]");
        p.textContent = this.paused ? "▶" : "❚❚";
        p.setAttribute("aria-label", PF.t(this.paused ? "tour.play" : "tour.pause"));
        next.innerHTML = `${esc(PF.t("tour.next"))} →`;
      }
    }
  }

  PF.Tour = Tour;
})(window.PF = window.PF || {});
