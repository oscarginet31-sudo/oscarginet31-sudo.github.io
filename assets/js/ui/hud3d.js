/* =============================================================================
 * hud3d.js — Chrome 3D : viseur FPS qui suit la souris et se verrouille sur
 * les cibles (crochets, couleur de la cible, "tir" au clic), étiquette de cible, fil d'Ariane,
 * bouton retour, repères directionnels, dock de pilote automatique (1–5),
 * compteur de découvertes, barre d'actions (thème/langue/son/CV/classique).
 * ========================================================================== */
(function (PF) {
  "use strict";
  const { U } = PF;

  class Hud3D {
    constructor() {
      this.reticle = document.getElementById("reticle");
      this.targetEl = document.getElementById("target");
      this.crumbEl = document.getElementById("crumb");
      this.backBtn = document.getElementById("back");
      this.hintEl = document.getElementById("hud-hint");
      this.ptrLayer = document.getElementById("pointers");
      this.lockhint = document.getElementById("lockhint");
      this.dock = document.getElementById("dock");
      this.discoverEl = document.getElementById("discover");
      this.ptrPool = new Map();

      this.onBack = () => {};
      this.onTravel = () => {};
      this.onHome = () => {};
      this.onTour = () => {};
      this.backBtn.addEventListener("click", () => this.onBack());
      document.getElementById("btn-theme").addEventListener("click", () => PF.toggleTheme());
      document.getElementById("btn-lang").addEventListener("click", () =>
        PF.setLang(PF.lang === "fr" ? "en" : "fr"));

      this._buildDock();

      // Viseur : point + 4 graduations + anneau + crochets de verrouillage.
      this.reticle.innerHTML =
        `<i class="r-ring"></i><i class="r-dot"></i>` +
        `<i class="r-tick t"></i><i class="r-tick b"></i><i class="r-tick l"></i><i class="r-tick r"></i>` +
        `<span class="r-lock"><i class="r-br tl"></i><i class="r-br tr"></i><i class="r-br bl"></i><i class="r-br br"></i></span>`;
      if (U.env.touch) this.reticle.style.display = "none";
      document.body.classList.toggle("desk", !U.env.touch);
      this._locked = false;                      // souris capturée (pointer lock)
      this._mx = innerWidth / 2; this._my = innerHeight / 2;
      this._rx = this._mx; this._ry = this._my;
      addEventListener("pointermove", (e) => { this._ptr = true; this._mx = e.clientX; this._my = e.clientY; });

      PF.onLang(() => this.localize());
      this.localize();
      this.setMode("galaxy", null);
    }

    _buildDock() {
      const hubs = PF.CONTENT.hubs;
      this.dock.innerHTML =
        `<button class="dock-btn dock-tour" data-tour><span class="dock-glyph">▶</span><span class="dock-label"></span></button>` +
        `<button class="dock-btn dock-home" data-home><span class="dock-glyph">◎</span><span class="dock-label"></span></button>` +
        hubs.map((h, i) => `
          <button class="dock-btn" data-i="${i}" style="--hub:${h.color}">
            <kbd>${i + 1}</kbd><span class="dock-label"></span>
          </button>`).join("");
      this.dock.querySelectorAll("[data-i]").forEach((b) =>
        b.addEventListener("click", () => this.onTravel(+b.dataset.i)));
      this.dock.querySelector("[data-home]").addEventListener("click", () => this.onHome());
      this.dock.querySelector("[data-tour]").addEventListener("click", () => this.onTour());
    }

    /**
     * Appelé à chaque image. Le viseur suit la souris ; quand une cible est
     * verrouillée, il glisse et s'accroche dessus (aim-lock), puis revient.
     * @param aim position écran de la cible verrouillée, ou null
     */
    frame(dt, aim) {
      let gx, gy, snap = false;
      if (this._locked || (!this._ptr && !aim)) { gx = innerWidth / 2; gy = innerHeight / 2; }
      else if (aim) { gx = aim.x; gy = aim.y; snap = true; }
      else { gx = this._mx; gy = this._my; }
      // Suivi instantané de la souris ; glissement rapide vers / depuis une cible.
      const k = snap || this._snapBack > 0 ? 1 - Math.pow(0.00002, dt) : 1;
      this._snapBack = snap ? 0.18 : Math.max(0, (this._snapBack || 0) - dt);
      this._rx += (gx - this._rx) * k;
      this._ry += (gy - this._ry) * k;
      const x = Math.round(this._rx * 10) / 10, y = Math.round(this._ry * 10) / 10;
      this.reticle.style.transform = `translate(${x}px, ${y}px)`;
      this.targetEl.style.transform = `translate(${x}px, ${y + 34}px) translate(-50%, 0)`;
    }

    /** "Tir" : petite onde de choc du viseur au clic. */
    fire(hit) {
      const r = this.reticle;
      r.classList.remove("fire", "miss");
      void r.offsetWidth;                         // relance l'animation CSS
      r.classList.add(hit ? "fire" : "miss");
      clearTimeout(this._fireT);
      this._fireT = setTimeout(() => r.classList.remove("fire", "miss"), 460);
    }

    show(v) { document.body.classList.toggle("hud-on", v); }

    /** Souris capturée (pointer lock) ? Le viseur se fixe au centre de l'écran. */
    setLooking(locked) {
      const desktop = !U.env.touch;
      this._locked = locked && desktop;
      document.body.classList.toggle("looking", locked && desktop);
      this.lockhint.textContent = PF.t("hud.clickLook");
      // Indice affiché quelques secondes seulement, puis il s'efface.
      const show = !locked && desktop && document.body.classList.contains("hud-on") && !this._hinted;
      this.lockhint.classList.toggle("show", show);
      if (show) { this._hinted = true; setTimeout(() => this.lockhint.classList.remove("show"), 6000); }
    }

    localize() {
      document.querySelectorAll("[data-lang-pill]").forEach((el) =>
        el.classList.toggle("active", el.dataset.langPill === PF.lang));
      document.querySelector("#link-cv .chip-label").textContent = PF.t("hud.cv");
      document.getElementById("link-cv").setAttribute("href", PF.t("cv.file"));      // CV FR ou EN
      document.querySelector("#link-classic .chip-label").textContent = PF.t("hud.classic");
      this.backBtn.querySelector("span").textContent = PF.t("hud.back");
      const fr = PF.lang === "fr";
      this.hintEl.innerHTML = U.env.touch
        ? `<span>${PF.t("intro.controlsTouch")}</span><b>·</b><span>${fr ? "touchez pour ouvrir" : "tap to open"}</span>`
        : `<kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd><span>${PF.t("intro.controls")}</span>
           <b>·</b><kbd>${fr ? "souris" : "mouse"}</kbd><span>${PF.t("intro.look")}</span>
           <b>·</b><kbd>${fr ? "clic" : "click"}</kbd><span>${PF.t("intro.select")}</span>
           <b>·</b><kbd>1</kbd>–<kbd>5</kbd><span>${fr ? "pilote auto" : "autopilot"}</span>
           <b>·</b><kbd>T</kbd><span>${fr ? "visite" : "tour"}</span>
           <b>·</b><kbd>/</kbd><span>terminal</span>`;
      const hubs = PF.CONTENT.hubs;
      this.dock.querySelectorAll("[data-i]").forEach((b) =>
        (b.querySelector(".dock-label").textContent = PF.tx(hubs[+b.dataset.i].label)));
      this.dock.querySelector(".dock-home .dock-label").textContent = fr ? "Galaxie" : "Galaxy";
      this.dock.querySelector(".dock-tour .dock-label").textContent = fr ? "Visite" : "Tour";
      document.getElementById("btn-term").setAttribute("aria-label", PF.t("term.open"));
      document.getElementById("btn-term").title = PF.t("term.open") + " ( / )";
      this.discoverEl.title = fr ? "Planètes explorées" : "Planets explored";
      if (this._disc) this.setDiscovered(...this._disc);
      if (this._mode) this.setMode(this._mode, this._sys);
      if (this._target) this.setTarget(this._target);
    }

    setDiscovered(n, total) {
      this._disc = [n, total];
      const fr = PF.lang === "fr";
      this.discoverEl.innerHTML =
        `<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" class="ring-bg"/>` +
        `<circle cx="18" cy="18" r="15" class="ring-fg" style="stroke-dasharray:${(n / total) * 94.2} 94.2"/></svg>` +
        `<span><b>${n}</b>/${total}</span><span class="disc-label">${fr ? "explorées" : "explored"}</span>`;
      this.discoverEl.classList.toggle("done", n >= total);
    }

    setTarget(info) {
      this._target = info;
      document.body.classList.toggle("can-pick", !!info);
      if (!info) { this.targetEl.classList.remove("show"); this.reticle.classList.remove("locked"); return; }
      const fr = PF.lang === "fr";
      const verb = info.type === "system" ? PF.t("hud.enter")
        : info.type === "return" ? PF.t("hud.returnVerb")
        : info.type === "core" ? (fr ? "à propos" : "about")
        : PF.t("hud.dockPrompt");
      this.targetEl.querySelector(".target-name").textContent = info.label;
      this.targetEl.querySelector(".target-verb").textContent = verb;
      this.targetEl.style.setProperty("--hub", info.color);
      this.reticle.style.setProperty("--hub", info.color);
      this.targetEl.classList.add("show");
      this.reticle.classList.add("locked");
    }

    setMode(mode, sys) {
      this._mode = mode; this._sys = sys;
      const fr = PF.lang === "fr";
      const g = fr ? "Galaxie" : "Galaxy";
      document.body.classList.toggle("warping", mode === "warp");
      if (mode === "warp") {
        const dest = sys ? PF.tx(sys.def.label) : g;
        this.crumbEl.innerHTML = `<span class="crumb-warp">${fr ? "Saut hyperespace" : "Hyperspace jump"}</span> → <b>${dest}</b>`;
        this.backBtn.classList.remove("show");
      } else if (mode === "system" && sys) {
        this.crumbEl.innerHTML = `<span class="crumb-root">${g}</span> / <b>${PF.tx(sys.def.label)}</b>`;
        this.backBtn.classList.add("show");
      } else {
        this.crumbEl.innerHTML = `<b>${g}</b>`;
        this.backBtn.classList.remove("show");
      }
      const idx = sys && mode !== "galaxy" ? PF.CONTENT.hubs.findIndex((h) => h.id === sys.id) : -1;
      this.dock.querySelectorAll(".dock-btn").forEach((b) => {
        const on = b.dataset.i != null ? +b.dataset.i === idx : (idx < 0 && mode === "galaxy");
        b.classList.toggle("active", on);
      });
    }

    /* --- Flèches directionnelles ---------------------------------------- */
    updatePointers(list) {
      const seen = new Set();
      for (const it of list) {
        seen.add(it.key);
        let el = this.ptrPool.get(it.key);
        if (!el) {
          el = document.createElement("div");
          el.className = "ptr";
          el.innerHTML = `<span class="ptr-arrow">➤</span><span class="ptr-label"></span>`;
          this.ptrLayer.appendChild(el);
          this.ptrPool.set(it.key, el);
        }
        el.style.color = it.color;
        el.classList.toggle("on", it.onScreen);
        const lab = el.querySelector(".ptr-label");
        if (lab.textContent !== it.name) lab.textContent = it.name;
        el.querySelector(".ptr-arrow").style.transform = `rotate(${it.angle}rad)`;
        el.style.transform = `translate(${it.x}px, ${it.y}px) translate(-50%, -50%)`;
      }
      for (const [key, el] of this.ptrPool) {
        if (!seen.has(key)) { el.remove(); this.ptrPool.delete(key); }
      }
    }
  }

  PF.Hud3D = Hud3D;
})(window.PF = window.PF || {});
