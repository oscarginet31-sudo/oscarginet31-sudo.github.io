/* =============================================================================
 * app.js — SpaceApp : rendu, cosmos, machine d'états (galaxie ⇄ système),
 * pilotage, pilote automatique et sauts hyperespace.
 *
 * Callbacks (branchés par main3d.js) :
 *   onTarget(info|null)        → cible visée (HUD)
 *   onMode(mode, system|null)  → fil d'Ariane / retour / dock
 *   onOpenPlanet(planet)       → ouvrir la fiche d'une planète
 *   onOpenCore()               → ouvrir la fiche "à propos" (cœur galactique)
 *   onPointers(list)           → repères directionnels
 * ========================================================================== */
(function (PF) {
  "use strict";
  const { U, Cosmos } = PF;

  const OVERVIEW = new THREE.Vector3(0, 1150, 2550);
  const ORIGIN = new THREE.Vector3(0, 0, 0);
  const IDLE_LOOK = new THREE.Vector3(0, 820, 0);
  const AUTO_ENTER = 150;          // distance d'auto-entrée (volontairement faible)
  const BASE_FOV = 58;
  const CORE_COLOR = new THREE.Color("#ffd9a0");

  class SpaceApp {
    constructor(canvas) {
      this.canvas = canvas;
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
      this.maxPR = Math.min(devicePixelRatio || 1, Cosmos.Q.low ? 1.25 : 1.75);
      this.pr = this.maxPR;
      this.renderer.setPixelRatio(this.pr);
      this.renderer.setClearColor("#020308");

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.5, 40000);
      this.scene.add(this.camera);                       // pour les traînées d'hyperespace

      this.scene.add(new THREE.AmbientLight(0xffffff, 0.12));
      this.keyLight = new THREE.PointLight(0xfff1dd, 1.3, 0, 2);
      this.scene.add(this.keyLight);

      // --- Cosmos ---
      try { this.scene.background = Cosmos.bakeSky(this.renderer); } catch (e) { /* ciel uni */ }
      this.starfield = new Cosmos.Starfield(this.scene, this.pr);
      this.spiral = new Cosmos.SpiralGalaxy(this.scene, this.pr);
      this.nebulae = new Cosmos.Nebulae(this.scene, this.spiral);
      this.dust = new Cosmos.SpaceDust(this.scene, this.pr);
      this.warpField = new Cosmos.WarpField(this.camera);
      this.galaxy = new PF.Galaxy(this.scene, this.spiral);
      this.post = new PF.Post(this.renderer, this.scene, this.camera);
      this.flare = new PF.LensFlare();
      this.flareRay = new THREE.Raycaster();
      this._glare = 0; this._exposure = 1;
      this._ndc = new THREE.Vector3(); this._tmp = new THREE.Vector3(); this._fwd = new THREE.Vector3();
      this._renderFlare = (r) => this.flare.render(r);

      this._warmUp();

      // --- Pilotage ---
      this.flight = new PF.Flight(this.camera, canvas);
      this.flight.placeLookingAt(OVERVIEW.clone(), ORIGIN);
      // Clic = "tir" : ouvre la cible verrouillée par le viseur.
      this.flight.onClick = () => { this.onFire(!!this.target); if (this.target) this._action(); };

      this.mode = "galaxy";
      this.activeSystem = null;
      this.pendingSystem = null;
      this.target = null;
      this.warping = false;
      this.idle = true;                                  // orbite cinématique derrière l'intro
      this._idleA = 0;

      // Visée : souris capturée = centre de l'écran (réticule) ; sinon = sous le curseur / le doigt.
      this.cursor = new THREE.Vector2(0, 0);
      this._center = new THREE.Vector2(0, 0);
      // La souris pilote aussi la visée "bords d'écran" (seulement au-dessus de la scène).
      const steer = this.flight.steerInput;
      addEventListener("pointermove", (e) => {
        this._setCursor(e.clientX, e.clientY);
        steer.x = this.cursor.x; steer.y = this.cursor.y;
        // Pas de rotation dans les bandes du HUD (boutons en haut, dock en bas) : on peut les atteindre.
        steer.active = e.pointerType === "mouse" && e.target === canvas && e.clientY > 76 && e.clientY < innerHeight - 100;
      });
      addEventListener("pointerdown", (e) => this._setCursor(e.clientX, e.clientY));
      document.documentElement.addEventListener("mouseleave", () => { steer.active = false; });
      addEventListener("blur", () => { steer.active = false; });

      this.raycaster = new THREE.Raycaster();
      this.galaxyPicks = this.galaxy.systems.map((sys) => {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(200, 12, 12),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
        );
        m.position.copy(sys.center);
        m.userData.system = sys;
        this.scene.add(m);
        return m;
      }).concat(this.galaxy.corePick);

      // Raccourcis : 1–5 = pilote automatique, 0 = retour galaxie.
      addEventListener("keydown", (e) => {
        if (!this.flight.enabled || e.metaKey || e.ctrlKey || e.altKey) return;
        if (/^[1-9]$/.test(e.key)) {
          const sys = this.galaxy.systems[+e.key - 1];
          if (sys) this.travelTo(sys);
        } else if (e.key === "0") this.exitSystem();
      });

      this.onTarget = this.onMode = this.onOpenPlanet = this.onPointers = this.onOpenCore = () => {};
      this.onFrame = this.onFire = () => {};
      this.running = false; this._last = 0;
      this._perf = { t: 0, frames: 0, acc: 0 };
      this._loop = this._loop.bind(this);
      addEventListener("resize", () => this.resize());
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) this.running = false;
        else if (this._wanted) this.start();
      });
      this.resize();
    }

    _setCursor(px, py) {
      this.cursor.x = (px / innerWidth) * 2 - 1;
      this.cursor.y = -(py / innerHeight) * 2 + 1;
    }

    /** L'espace reste sombre quel que soit le thème : seul le chrome HTML change. */
    setTheme() {}

    start() { this._wanted = true; if (this.running) return; this.running = true; this._last = performance.now(); requestAnimationFrame(this._loop); }

    enableFlight(v) {
      this.flight.enabled = v;
      if (v && this.idle) {
        // Sortie de l'intro : la caméra se recadre en douceur sur le cœur galactique.
        this.idle = false;
        this.warping = true;
        this._recenter = true;
        this.flight.flyTo(this.flight.pos.clone(), ORIGIN, 1.4, () => { this.warping = false; this._recenter = false; }, 0);
      }
    }

    _loop(now) {
      if (!this.running) return;
      let dt = (now - this._last) / 1000; this._last = now;
      if (dt > 0.05) dt = 0.05;
      PF.F.TIME.value += dt;

      if (this.idle) this._idleOrbit(dt);
      else this.flight.update(dt);

      // Le système d'arrivée commence à se déplier en fin de saut.
      const t = this.flight.tweenT;
      const focus = this.activeSystem || (this.pendingSystem && t != null && t > 0.55 ? this.pendingSystem : null);
      const spinning = this.mode === "galaxy" && !this.pendingSystem;
      this.galaxy.update(dt, focus, this.camera, this.idle, spinning);
      if (spinning) for (const m of this.galaxyPicks) if (m.userData.system) m.position.copy(m.userData.system.center);
      this.keyLight.position.copy(focus ? focus.center : ORIGIN);

      const warp = this.flight.warp;
      const fov = BASE_FOV + warp * 24 + this.flight.speed01 * 4;
      if (Math.abs(this.camera.fov - fov) > 0.01) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
      // Facteur pixels / unité à distance 1 (niveau de détail des planètes).
      PF.viewK = innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)));
      this.warpField.set(warp);

      this.starfield.update(this.camera);
      this.nebulae.update(this.camera);
      this.dust.update(this.camera, Math.max(this.flight.speed01, warp));

      this.camera.updateMatrixWorld();
      this.scene.updateMatrixWorld();

      if (!this.warping && !this.idle) {
        if (this.mode === "galaxy") this._autoEnter();
        this._pick();
      }
      this._pointers();
      this._updateGlare(dt, warp);

      this.post.render(dt, warp, this._exposure, this._renderFlare);
      this.onFrame(dt, this.targetScreen());
      this._adapt(dt);
      requestAnimationFrame(this._loop);
    }

    /**
     * Préchauffage GPU pendant l'intro : on rend TOUT visible (planètes de tous
     * les systèmes, portails, traînées d'hyperespace…), on compile chaque shader
     * et on fait un rendu hors écran pour envoyer géométries et textures au GPU.
     * Résultat : aucun à-coup au premier saut.
     */
    _warmUp() {
      const R = this.renderer, hidden = [];
      this.camera.position.copy(OVERVIEW);
      this.camera.lookAt(ORIGIN);
      this.camera.updateMatrixWorld();
      this.galaxy.systems.forEach((s) => s.forceVisible(true));
      this.scene.traverse((o) => { if (!o.visible) { hidden.push(o); o.visible = true; } });
      try {
        R.compile(this.scene, this.camera);
        R.compile(this.flare.scene, this.flare.cam);
        const rt = new THREE.WebGLRenderTarget(16, 16);
        R.setRenderTarget(rt);
        this.camera.layers.enableAll();
        R.render(this.scene, this.camera);
        this.camera.layers.set(0);
        R.setRenderTarget(null);
        rt.dispose();
      } catch (e) { /* repli : compilation paresseuse */ }
      hidden.forEach((o) => { o.visible = false; });
      this.galaxy.systems.forEach((s) => s.forceVisible(false));
    }

    /**
     * Éblouissement : lens flare quand l'étoile du système (ou le cœur
     * galactique) est dans le champ et non masquée par une planète, et
     * exposition qui baisse quand on la regarde en face — comme un œil ou
     * une caméra qui s'adapte.
     */
    _updateGlare(dt, warp) {
      const sys = this.mode === "system" ? this.activeSystem : null;
      const src = sys ? sys.center : (this.mode === "galaxy" ? ORIGIN : null);
      let target = 0, size = 0;
      const ndc = this._ndc;
      if (src && !this.warping) {
        const cam = this.camera.position;
        const toSrc = this._tmp.subVectors(src, cam);
        const dist = toSrc.length();
        this.camera.getWorldDirection(this._fwd);
        if (toSrc.dot(this._fwd) > 0) {
          ndc.copy(src).project(this.camera);
          const edge = Math.max(Math.abs(ndc.x), Math.abs(ndc.y));
          target = (1 - THREE.MathUtils.smoothstep(edge, 0.75, 1.25)) * (sys ? 1 : 0.65);
          // Taille apparente de l'étoile (0 = point, 1 = disque qui remplit le champ).
          if (sys) size = THREE.MathUtils.clamp((sys.style.radius / dist) * (PF.viewK || 800) / 140, 0, 1);
          if (target > 0 && sys) {
            this.flareRay.set(cam, toSrc.divideScalar(dist));
            const hit = this.flareRay.intersectObjects(sys.planetMeshes(), false)[0];
            if (hit && hit.distance < dist - sys.style.radius) target = 0;   // éclipse
          }
        }
      }
      if (this.idle) target *= 0.35;
      target *= 1 - warp;
      this._glare = U.damp(this._glare, target, 0.0004, dt);
      const color = sys ? sys.light.starColor.value : CORE_COLOR;
      this.flare.update(ndc, this._glare, color, this.camera.aspect);
      const center = 1 - Math.min(1, Math.hypot(ndc.x, ndc.y));
      // Plus l'étoile est grande et centrée, plus on "ferme le diaphragme".
      const expo = 1 - (sys ? 0.3 : 0.1) * this._glare * (0.35 + 0.65 * center) - 0.5 * size * Math.min(1, this._glare * 1.5);
      this._exposure = U.damp(this._exposure, Math.max(0.35, expo), 0.02, dt);
    }

    /** Orbite lente autour de la galaxie pendant l'écran d'intro. */
    _idleOrbit(dt) {
      this._idleA = PF.OG ? 0.55 : this._idleA + dt * 0.03;
      const R = Math.hypot(OVERVIEW.x, OVERVIEW.z);
      const p = new THREE.Vector3(Math.sin(this._idleA) * R, OVERVIEW.y, Math.cos(this._idleA) * R);
      // On vise au-dessus du cœur : la galaxie se place sous le titre de l'intro.
      this.flight.placeLookingAt(p, IDLE_LOOK);
    }

    /** Qualité adaptative : baisse la résolution si l'appareil peine. */
    _adapt(dt) {
      const P = this._perf;
      P.acc += dt; P.frames++;
      if (P.acc < 2.5) return;
      const avg = P.acc / P.frames;
      P.acc = 0; P.frames = 0;
      if (avg > 1 / 40 && this.pr > 0.75) {
        this.pr = Math.max(0.75, this.pr - 0.25);
        this.resize();
      }
    }

    /* ---------------------- Auto-entrée / ciblage ---------------------- */
    _autoEnter() {
      let near = null, nd = Infinity;
      for (const s of this.galaxy.systems) {
        const d = this.flight.pos.distanceTo(s.center);
        if (d < nd) { nd = d; near = s; }
      }
      if (near && nd < AUTO_ENTER) this.enterSystem(near);
    }

    _pick() {
      this.raycaster.setFromCamera(this.flight.locked ? this._center : this.cursor, this.camera);
      let hit = null;
      if (this.mode === "galaxy") {
        const xs = this.raycaster.intersectObjects(this.galaxyPicks, false);
        if (xs.length) {
          const o = xs[0].object;
          hit = o.userData.isCore ? { type: "core", ref: this.galaxy } : { type: "system", ref: o.userData.system };
        }
      } else if (this.activeSystem) {
        const xs = this.raycaster.intersectObjects(this.activeSystem.pickMeshes(), false);
        if (xs.length) {
          const o = xs[0].object;
          hit = o.userData.isReturn
            ? { type: "return", ref: this.activeSystem }
            : { type: "planet", ref: o.userData.planet };
        }
      }
      if (!hit) hit = this._magnet();
      const key = (h) => h ? h.type + "|" + (h.ref.id || "") + "|" + (h.ref.body ? h.ref.system.id + h.ref.index : "") : "";
      if (key(hit) !== key(this.target)) {
        if (this.target && this.target.type === "planet") this.target.ref.hovered = false;
        if (hit && hit.type === "planet") hit.ref.hovered = true;
        this.target = hit;
        this.onTarget(hit ? this._targetInfo(hit) : null);
      }
    }

    /**
     * Aide à la visée (comme dans un FPS) : si le rayon ne touche rien, on
     * verrouille la cible dont la projection à l'écran est la plus proche du
     * viseur, dans un rayon d'environ 60 px. Les petites planètes deviennent
     * faciles à attraper.
     */
    _magnet() {
      const c = this.flight.locked ? this._center : this.cursor;
      const cx = (c.x * 0.5 + 0.5) * innerWidth, cy = (-c.y * 0.5 + 0.5) * innerHeight;
      const cands = [];
      if (this.mode === "galaxy") {
        this.galaxy.systems.forEach((s) => cands.push([{ type: "system", ref: s }, s.center]));
        cands.push([{ type: "core", ref: this.galaxy }, ORIGIN]);
      } else if (this.activeSystem) {
        const sys = this.activeSystem;
        sys.planets.forEach((p) => cands.push([{ type: "planet", ref: p }, p.worldPos(new THREE.Vector3())]));
        cands.push([{ type: "return", ref: sys }, sys.returnWorldPos(new THREE.Vector3())]);
      }
      let best = null, bd = 60;
      const v = this._tmp;
      for (const [hit, w] of cands) {
        v.copy(w).applyMatrix4(this.camera.matrixWorldInverse);
        if (v.z > 0) continue;                                   // derrière la caméra
        v.copy(w).project(this.camera);
        const d = Math.hypot((v.x * 0.5 + 0.5) * innerWidth - cx, (-v.y * 0.5 + 0.5) * innerHeight - cy);
        if (d < bd) { bd = d; best = hit; }
      }
      return best;
    }

    /** Position écran (px) de la cible verrouillée, pour y accrocher le viseur. */
    targetScreen() {
      const t = this.target;
      if (!t) return null;
      const w = this._aim || (this._aim = new THREE.Vector3());
      if (t.type === "system") w.copy(t.ref.center);
      else if (t.type === "core") w.set(0, 0, 0);
      else if (t.type === "planet") t.ref.worldPos(w);
      else t.ref.returnWorldPos(w);
      const cs = w.clone().applyMatrix4(this.camera.matrixWorldInverse);
      if (cs.z > 0) return null;
      w.project(this.camera);
      return { x: (w.x * 0.5 + 0.5) * innerWidth, y: (-w.y * 0.5 + 0.5) * innerHeight };
    }

    _targetInfo(hit) {
      if (hit.type === "system") return { type: "system", label: PF.tx(hit.ref.def.label), color: hit.ref.def.color };
      if (hit.type === "core") return { type: "core", label: PF.CONTENT.identity.name, color: "#ffd9a0" };
      if (hit.type === "return") return { type: "return", label: PF.t("hud.returnNode"), color: "#e8dcc8" };
      return { type: "planet", label: PF.tx(hit.ref.body.name), color: hit.ref.color };
    }

    _action() {
      if (this.warping || !this.target) return;
      const t = this.target;
      if (t.type === "system") this.enterSystem(t.ref);
      else if (t.type === "core") this.onOpenCore();
      else if (t.type === "return") this.exitSystem();
      else this.onOpenPlanet(t.ref);
    }

    _clearTarget() {
      if (this.target && this.target.type === "planet") this.target.ref.hovered = false;
      this.target = null; this.onTarget(null);
    }

    /* --------------------- Repères directionnels ----------------------- */
    _pointers() {
      const list = [];
      if (this.idle) { this.onPointers(list); return; }
      const W = innerWidth, H = innerHeight, tmp = new THREE.Vector3();
      const add = (key, wpos, name, color, kind) => {
        const p = this._project(wpos, W, H);
        if (kind === "planet" && p.onScreen) return;     // déjà visibles : pas de repère
        list.push({ key, name, color, kind, ...p });
      };
      if (this.mode === "galaxy" && !this.warping) {
        // Le système verrouillé par le viseur n'a pas besoin de repère (son nom est déjà affiché).
        this.galaxy.systems.forEach((s, i) => {
          if (!(this.target && this.target.ref === s)) add("s" + i, s.center, (i + 1) + " · " + PF.tx(s.def.label), s.def.color, "system");
        });
      } else if (this.activeSystem && !this.warping) {
        // Repères vers les 4 planètes hors champ les plus proches (évite l'empilement).
        const cam = this.camera.position;
        this.activeSystem.planets
          .map((p, i) => ({ p, i, w: p.worldPos(new THREE.Vector3()) }))
          .filter((o) => !this._project(o.w, W, H).onScreen)
          .sort((a, b) => a.w.distanceTo(cam) - b.w.distanceTo(cam))
          .slice(0, 4)
          .forEach((o) => add("p" + o.i, o.w, PF.tx(o.p.body.short || o.p.body.name), o.p.color, "planet"));
        add("ret", this.activeSystem.returnWorldPos(tmp).clone(), PF.t("hud.returnNode"), "#e8dcc8", "planet");
      }
      this.onPointers(list);
    }

    _project(world, W, H) {
      const ndc = world.clone().project(this.camera);
      const cs = world.clone().applyMatrix4(this.camera.matrixWorldInverse);
      const behind = cs.z > 0;
      const onScreen = !behind && Math.abs(ndc.x) <= 1 && Math.abs(ndc.y) <= 1;
      if (onScreen) return { onScreen: true, x: (ndc.x * 0.5 + 0.5) * W, y: (-ndc.y * 0.5 + 0.5) * H, angle: 0 };
      let dx = ndc.x, dy = ndc.y;
      if (behind) { dx = -dx; dy = -dy; }
      const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
      // Marges : on évite la barre du haut (fil d'Ariane) et le dock du bas.
      const mx = 0.92, my = dy > 0 ? 0.76 : 0.72;
      const s = Math.min(mx / Math.max(Math.abs(dx), 1e-4), my / Math.max(Math.abs(dy), 1e-4));
      const bx = dx * s, by = dy * s;
      return {
        onScreen: false,
        x: (bx * 0.5 + 0.5) * W, y: (-by * 0.5 + 0.5) * H,
        angle: Math.atan2(-by, bx),
      };
    }

    /* --------------------------- Transitions --------------------------- */
    /** Point d'arrivée devant un système, en surplomb, côté caméra. */
    _arrival(sys) {
      const dir = new THREE.Vector3().subVectors(this.flight.pos, sys.center).setY(0);
      if (dir.lengthSq() < 1) dir.set(0, 0, 1);
      dir.normalize();
      const d = sys.viewDistance(this.camera);
      return new THREE.Vector3().copy(sys.center).addScaledVector(dir, d * 0.9).add(new THREE.Vector3(0, d * 0.4, 0));
    }

    enterSystem(sys) {
      // Le recadrage de sortie d'intro peut être interrompu par un saut.
      if (this.warping && this._recenter) { this.flight.tween = null; this.warping = false; this._recenter = false; }
      if (this.warping) return;
      this.warping = true;
      this.pendingSystem = sys;
      this._clearTarget();
      const dest = this._arrival(sys);
      const dist = this.flight.pos.distanceTo(dest);
      const dur = U.clamp(dist / 1500, 1.3, 2.8);
      this.onMode("warp", sys);
      PF.sfx && PF.sfx("warp", dur);
      this.flight.flyTo(dest, sys.center, dur, () => {
        this.warping = false; this.mode = "system"; this.activeSystem = sys; this.pendingSystem = null;
        this.onMode("system", sys);
      }, U.clamp(dist / 2600, 0.35, 1));
    }

    /** Pilote automatique vers un système, d'où qu'on soit. */
    travelTo(sys) {
      if ((this.warping && !this._recenter) || (this.mode === "system" && this.activeSystem === sys)) return;
      if (this.mode === "system") { this.activeSystem = null; this.mode = "galaxy"; }
      this.enterSystem(sys);
    }

    exitSystem() {
      if (this.warping || this.mode !== "system") return;
      this.warping = true;
      this.activeSystem = null;
      this._clearTarget();
      this.onMode("warp", null);
      PF.sfx && PF.sfx("warp", 2);
      this.flight.flyTo(OVERVIEW.clone(), ORIGIN, 2, () => {
        this.warping = false; this.mode = "galaxy"; this.onMode("galaxy", null);
      }, 0.8);
    }

    resize() {
      const w = innerWidth, h = innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setPixelRatio(this.pr);
      this.renderer.setSize(w, h, false);
      this.post.setSize(w, h, this.pr);
      [this.starfield, this.spiral, this.dust].forEach((o) => o.setPR(this.pr));
    }

    relabel() { this.galaxy.relabel(); }
  }

  PF.SpaceApp = SpaceApp;
})(window.PF = window.PF || {});
