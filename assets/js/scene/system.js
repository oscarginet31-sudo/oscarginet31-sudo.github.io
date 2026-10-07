/* =============================================================================
 * system.js — Planet, StarSystem, Galaxy.
 * Chaque section du portfolio = un système stellaire posé sur un bras de la
 * galaxie ; chaque item = une planète. Réalisme :
 *   - type de planète selon la distance à l'étoile (lave/roche près de
 *     l'étoile, telluriques au milieu, géantes au-delà de la ligne des glaces) ;
 *   - orbites quasi coplanaires, vitesses képlériennes (ω ∝ r^-1.5) ;
 *   - éclairage par l'étoile du système (terminateur, atmosphère, anneaux).
 * Un système est compact dans la galaxie et se déplie quand on y entre.
 * ========================================================================== */
(function (PF) {
  "use strict";
  const { U, F } = PF;
  const { hash } = F;
  const LABEL = "#efe6d6";
  /** Nom court affiché en 3D (le nom complet reste dans la fiche et le HUD). */
  const shortName = (b) => {
    const s = PF.tx(b.short || b.name);
    return s.length > 26 ? s.slice(0, 25).trimEnd() + "…" : s;
  };
  const PLANET_LABEL = { scale: 0.21, font: 36 };
  const _v = new THREE.Vector3();
  const _Y = new THREE.Vector3(0, 1, 0);

  /** Identité visuelle de chaque système (classe spectrale réaliste). */
  const STYLE = {
    skills:     { kind: "star",   color: "#a9c4ff", radius: 17, intensity: 1.85 },            // type B, bleu-blanc
    experience: { kind: "star",   color: "#ffe2a8", radius: 16, comet: true },               // type G, comme le Soleil
    projects:   { kind: "star",   color: "#ffae66", radius: 18, belt: true },                // type K, orange
    engagement: { kind: "star",   color: "#ff7550", radius: 25, intensity: 1.5, spots: 1.4 },// géante rouge
    contact:    { kind: "pulsar", color: "#c3b5ff", radius: 6 },                             // pulsar : il émet !
  };

  /** Type de planète selon sa position relative (0 = près de l'étoile). */
  function pickType(u, seed, prev) {
    const zones = u < 0.15 ? ["lava", "rock", "lava"]
      : u < 0.45 ? ["terran", "desert", "ocean", "toxic", "rock"]
      : u < 0.8 ? ["gas", "icegiant", "gas", "toxic", "ocean"]
      : ["icegiant", "ice", "rock", "ice"];
    let k = Math.floor(hash(seed) * zones.length);
    if (zones[k] === prev) k = (k + 1) % zones.length;
    return zones[k];
  }

  /* ----------------------------- Planète ------------------------------- */
  class Planet {
    constructor(body, system, index, total, type) {
      this.body = body;
      this.system = system;
      this.index = index;
      const seed = system.seed * 100 + index * 7.31;

      this.obj = F.planet(type, seed, system.light);
      this.radius = this.obj.userData.radius;
      this.color = this.obj.userData.uiColor;
      this.obj.userData.mesh.userData.planet = this;            // raycast

      this.orbitR = system.orbitOf(index);
      this.angle = hash(seed + 3) * Math.PI * 2;
      this.speed = 0.24 * Math.pow(110 / this.orbitR, 1.5);     // Kepler

      this.plane = new THREE.Group();
      this.plane.rotation.order = "YXZ";
      this.plane.rotation.set((hash(seed + 1) - 0.5) * 0.2, hash(seed + 2) * Math.PI * 2, 0);
      this.ring = F.orbit(this.orbitR, this.color);
      this.plane.add(this.ring);
      this.plane.add(this.obj);

      this.label = F.label(shortName(body), LABEL, PLANET_LABEL);
      this.label.userData.base = this.label.scale.clone();
      this.label.position.set(0, this.radius + 9, 0);
      this.label.material.opacity = 0;
      this.obj.add(this.label);

      this.selector = F.selector(this.color);
      this.selector.scale.setScalar(this.radius * 3.6);
      this.obj.add(this.selector);

      this.hovered = false;
      this._place();
    }

    _place() {
      this.obj.position.set(Math.cos(this.angle) * this.orbitR, 0, Math.sin(this.angle) * this.orbitR);
    }

    update(dt, focused, cam) {
      this.angle += this.speed * dt;
      this._place();
      this.obj.userData.update(dt);
      this.ring.material.uniforms.uPlanet.value = this.angle;

      // Rayon apparent en pixels → niveau de détail (géométrie + octaves de bruit).
      const dist = cam ? this.worldPos(_v).distanceTo(cam.position) : 1e6;
      const rw = this.radius * this.system.group.scale.x;
      this.obj.userData.setLOD((rw / Math.max(dist, 1e-3)) * (PF.viewK || 800));

      // De près, le label 3D s'efface (le HUD affiche déjà le nom) : pas de texte géant.
      const near = THREE.MathUtils.smoothstep(dist, this.radius * 12, this.radius * 30);
      // Hauteur à l'écran plafonnée (texte ≈ 19 px) : lisible de loin, jamais énorme de près.
      const base = this.label.userData.base;
      const px = (base.y * this.system.group.scale.x / Math.max(dist, 1e-3)) * (PF.viewK || 800);
      const f = Math.min(1, 44 / Math.max(px, 1e-3));
      this.label.scale.set(base.x * f, base.y * f, 1);
      const lo = this.label.material;
      lo.opacity = U.damp(lo.opacity, focused ? (this.hovered ? 1 : 0.62) * near : 0, 0.001, dt);
      this.label.visible = lo.opacity > 0.02;

      const so = this.selector.material;
      so.opacity = U.damp(so.opacity, this.hovered ? 0.95 * (0.25 + 0.75 * near) : 0, 0.0005, dt);
      so.rotation += dt * 0.5;
      this.selector.visible = so.opacity > 0.02;
      const s = this.radius * (3.4 + 0.25 * Math.sin(performance.now() * 0.004));
      this.selector.scale.set(s, s, 1);
      const hu = this.obj.userData.mesh.material.uniforms.uHover;
      hu.value = U.damp(hu.value, this.hovered ? 1 : 0, 0.001, dt);
    }

    setExpand(t) { this.ring.material.uniforms.uOpacity.value = t * 0.6; }

    worldPos(out) { return this.obj.userData.mesh.getWorldPosition(out); }

    relabel() {
      const sp = F.label(shortName(this.body), LABEL, PLANET_LABEL);
      this.label.material.map.dispose();
      this.label.material.map = sp.material.map;
      this.label.scale.copy(sp.scale);
      this.label.userData.base = sp.scale.clone();
      this.label.material.needsUpdate = true;
    }
  }

  /* ------------------------------ Comète ------------------------------- */
  /** Orbite képlérienne excentrique (équation de Kepler résolue par Newton). */
  class Comet {
    constructor(system) {
      const R = system.maxR;
      this.a = R * 0.8; this.e = 0.72;
      this.b = this.a * Math.sqrt(1 - this.e * this.e);
      this.q = this.a * (1 - this.e);                         // périhélie
      this.n = (Math.PI * 2) / 80;                            // une orbite ≈ 80 s
      this.M = 2.4;
      this.obj = F.comet(system.light, system.seed * 7);
      this.plane = new THREE.Group();
      this.plane.rotation.set(0.38, 2.2, 0.12);
      this.plane.add(this.obj);
      this._p = new THREE.Vector3(); this._v = new THREE.Vector3();
      this._x = new THREE.Vector3(); this._y = new THREE.Vector3(); this._z = new THREE.Vector3();
      this._m = new THREE.Matrix4();
    }
    _pos(M, out) {
      let E = M;
      for (let k = 0; k < 6; k++) E -= (E - this.e * Math.sin(E) - M) / (1 - this.e * Math.cos(E));
      return out.set(this.a * (Math.cos(E) - this.e), 0, this.b * Math.sin(E));   // étoile au foyer (origine)
    }
    update(dt) {
      this.M += this.n * dt;
      const p = this._pos(this.M, this.obj.position);
      this._pos(this.M + 0.004, this._v).sub(p);               // direction du mouvement
      // Repère des queues : +X à l'opposé de l'étoile, +Y en retrait du mouvement.
      const X = this._x.copy(p).normalize();
      const Y = this._y.copy(this._v).addScaledVector(X, -this._v.dot(X)).multiplyScalar(-1).normalize();
      const Z = this._z.crossVectors(X, Y);
      this.obj.userData.tail.quaternion.setFromRotationMatrix(this._m.makeBasis(X, Y, Z));
      const k = this.q / p.length();
      this.obj.userData.setTail(26 + 230 * Math.pow(k, 1.3), THREE.MathUtils.clamp(k * 1.4, 0.2, 1.3));
      this.obj.userData.update(dt);
    }
  }

  /* --------------------------- Système stellaire ----------------------- */
  class StarSystem {
    constructor(def, center, index) {
      this.def = def;
      this.id = def.id;
      this.seed = index + 1;
      this.style = STYLE[def.id] || STYLE.experience;
      this.center = center.clone();
      this.group = new THREE.Group();
      this.group.position.copy(center);
      this.compactScale = 0.16;
      this.expandT = 0;

      const sc = new THREE.Color(this.style.color);
      this.light = {
        star: { value: this.center.clone() },
        starColor: { value: sc.clone().lerp(new THREE.Color("#ffffff"), 0.5).multiplyScalar(0.92) },
      };

      this.star = this.style.kind === "pulsar"
        ? F.pulsar(this.style.color, this.style.radius)
        : F.star(this.style.color, this.style.radius, this.style);
      this.group.add(this.star);

      this.title = F.label(PF.tx(def.label).toUpperCase(), LABEL, { scale: 0.95, font: 46, spacing: 0.18 });
      this.title.position.set(0, 110, 0);
      this.group.add(this.title);

      // Orbites : départ hors de la couronne, espacement selon le nombre de corps.
      const total = def.bodies.length;
      this.innerR = Math.max(95, this.style.radius * 5 + 30);
      this.spacing = total > 10 ? 25 : total > 6 ? 34 : 44;
      let prev = null;
      this.planets = def.bodies.map((b, i) => {
        const type = pickType(total > 1 ? i / (total - 1) : 0.4, this.seed * 13 + i * 3.7, prev);
        prev = type;
        const p = new Planet(b, this, i, total, type);
        this.group.add(p.plane);
        return p;
      });
      this.maxR = this.orbitOf(total - 1);

      if (this.style.belt && total > 3) {
        const k = Math.floor(total * 0.45);
        const r = (this.orbitOf(k - 1) + this.orbitOf(k)) / 2;
        this.belt = F.asteroidBelt(r - this.spacing * 0.32, r + this.spacing * 0.32, PF.Cosmos.Q.low ? 350 : 800, this.seed);
        this.group.add(this.belt);
      }

      if (this.style.comet) {
        this.comet = new Comet(this);
        this.group.add(this.comet.plane);
      }

      // Portail "Retour" hors des orbites : le viser/cliquer ramène à la galaxie.
      this.returnPos = new THREE.Vector3(-0.72, 0.3, -0.62).normalize().multiplyScalar(this.maxR + 140);
      this.gate = F.gate("#e8dcc8");
      this.gate.position.copy(this.returnPos);
      this.gate.userData.core.userData.isReturn = true;
      this.gate.userData.core.userData.system = this;
      this.group.add(this.gate);
      this.returnLabel = F.label(PF.t("system.returnShort"), LABEL, { scale: 0.3, font: 40 });
      this.returnLabel.position.copy(this.returnPos).add(new THREE.Vector3(0, 32, 0));
      this.returnLabel.material.opacity = 0;
      this.group.add(this.returnLabel);

      this._applyExpand();
    }

    orbitOf(i) { return this.innerR + i * this.spacing + (hash(this.seed * 31 + i) - 0.5) * this.spacing * 0.3; }

    /** Distance de caméra pour cadrer tout le système déplié (selon le format d'écran). */
    viewDistance(cam) {
      const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      const tanH = tanV * cam.aspect;
      const fit = (this.maxR + 30) / Math.min(tanH * 1.05, tanV * 1.6);
      return U.clamp(fit, this.maxR * 0.9, this.maxR * 2.6) + 40;
    }

    _applyExpand() {
      const t = this.expandT;
      this.group.scale.setScalar(U.lerp(this.compactScale, 1, t));
      this.title.material.opacity = U.lerp(1, 0.0, Math.min(1, t * 1.6));
      this.title.visible = this.title.material.opacity > 0.02;
      this.returnLabel.material.opacity = t;
      this.returnLabel.visible = t > 0.05;
      this.gate.visible = t > 0.05;
      // Replié, le système n'est qu'un point lumineux : on ne dessine plus ses
      // planètes, lunes, anneaux ni astéroïdes (≈ -60 % de draw calls en galaxie).
      const shown = t > 0.02 || this._forceVisible;
      if (this.belt) this.belt.visible = t > 0.05 || !!this._forceVisible;
      if (this.comet) this.comet.plane.visible = shown;
      for (const p of this.planets) { p.plane.visible = shown; p.setExpand(t); }
    }

    setExpand(target, dt) {
      this.expandT = U.damp(this.expandT, target, 0.004, dt);
      if (Math.abs(this.expandT - target) < 0.001) this.expandT = target;
      this._applyExpand();
    }

    update(dt, active, cam) {
      this.star.userData.update(dt);
      const focused = active && this.expandT > 0.6;
      // Les planètes d'un système replié n'ont pas besoin d'être animées finement.
      if (this.expandT > 0.01 || active) for (const p of this.planets) p.update(dt, focused, cam);
      if (this.belt && this.belt.visible) this.belt.userData.update(dt);
      if (this.comet && this.comet.plane.visible) this.comet.update(dt);
      if (this.gate.visible) this.gate.userData.update(dt, cam);
    }

    /** Rend tout visible le temps de précompiler les shaders (évite les saccades). */
    forceVisible(v) {
      this._forceVisible = v;
      this._applyExpand();
    }

    planetMeshes() { return this.planets.map((p) => p.obj.userData.mesh); }
    pickMeshes() { return this.planetMeshes().concat(this.gate.userData.core); }
    returnWorldPos(out) { return this.gate.userData.core.getWorldPosition(out); }

    _swapLabel(sprite, text, opts) {
      const sp = F.label(text, LABEL, opts);
      sprite.material.map.dispose();
      sprite.material.map = sp.material.map;
      sprite.scale.copy(sp.scale);
      sprite.material.needsUpdate = true;
    }

    relabel() {
      this._swapLabel(this.title, PF.tx(this.def.label).toUpperCase(), { scale: 0.95, font: 46, spacing: 0.18 });
      this._swapLabel(this.returnLabel, PF.t("system.returnShort"), { scale: 0.3, font: 40 });
      this.planets.forEach((p) => p.relabel());
    }
  }

  /* ------------------------ Réseau galactique ------------------------- */
  /**
   * Liaisons lumineuses (arcs de Bézier) entre le cœur et chaque système, et
   * entre systèmes voisins : une topologie réseau à l'échelle galactique, où
   * des "paquets" de lumière circulent en permanence.
   */
  class NetworkLinks {
    constructor(parent) {
      this.group = new THREE.Group();
      parent.add(this.group);
      this.opacity = { value: 0 };
    }

    link(a, b, color, lift, speed, phase, base) {
      const N = 140, pos = new Float32Array(N * 3), at = new Float32Array(N);
      const c = a.clone().add(b).multiplyScalar(0.5);
      c.y += lift;
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1), v = 1 - u;
        pos[i * 3] = v * v * a.x + 2 * v * u * c.x + u * u * b.x;
        pos[i * 3 + 1] = v * v * a.y + 2 * v * u * c.y + u * u * b.y;
        pos[i * 3 + 2] = v * v * a.z + 2 * v * u * c.z + u * u * b.z;
        at[i] = u;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aT", new THREE.BufferAttribute(at, 1));
      const line = new THREE.Line(geo, PF.GLSL.mat({
        uniforms: {
          uTime: F.TIME, uOpacity: this.opacity, uColor: { value: new THREE.Color(color).multiplyScalar(1.3) },
          uSpeed: { value: speed }, uPhase: { value: phase }, uBase: { value: base },
        },
        vertexShader: `attribute float aT; varying float vT;
          void main(){ vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float uTime; uniform float uOpacity; uniform vec3 uColor; uniform float uSpeed; uniform float uPhase; uniform float uBase;
          varying float vT;
          void main(){
            float head = uTime * uSpeed + uPhase;
            float p = exp(-fract(head - vT) * 26.0) + 0.6 * exp(-fract(head + 0.5 - vT) * 26.0);
            float ends = smoothstep(0.0, 0.05, vT) * (1.0 - smoothstep(0.95, 1.0, vT));
            gl_FragColor = vec4(uColor * (uBase + p * 1.5) * ends * uOpacity, 1.0);
          }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      line.frustumCulled = false;
      this.group.add(line);
    }

    update(dt, target) {
      this.opacity.value = U.damp(this.opacity.value, target, 0.01, dt);
      this.group.visible = this.opacity.value > 0.01;
    }
  }

  /* ------------------------------ Galaxie ------------------------------ */
  const SPIN = 0.014;                   // rotation du disque (rad/s) : un tour ≈ 7 min

  class Galaxy {
    /** @param spiral galaxie spirale (disque de particules + fonction des bras) */
    constructor(scene, spiral) {
      const armAngle = spiral.armAngle;
      this.scene = scene;
      this.spiral = spiral;
      this.spin = 0;
      this.systems = [];

      this.core = F.galacticCore();
      scene.add(this.core);
      this.coreLabel = F.label(PF.CONTENT.identity.name.toUpperCase(), LABEL, { scale: 1.2, font: 54, spacing: 0.22 });
      this.coreLabel.position.set(0, 190, 0);
      scene.add(this.coreLabel);
      this.corePick = new THREE.Mesh(new THREE.SphereGeometry(170, 12, 12),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      this.corePick.userData.isCore = true;
      scene.add(this.corePick);

      const ids = PF.systemIds();
      const RADII = [1150, 1550, 1300, 1800, 1450];
      ids.forEach((id, i) => {
        const r = RADII[i % RADII.length];
        const a = armAngle(r, i % 4) + 0.05;
        const center = new THREE.Vector3(Math.cos(a) * r, (i % 2 ? 1 : -1) * 40, Math.sin(a) * r);
        const sys = new StarSystem(PF.getSystem(id), center, i);
        sys.base = center.clone();
        scene.add(sys.group);
        this.systems.push(sys);
      });

      // Réseau : cœur → chaque système, puis anneau entre systèmes voisins.
      this.links = new NetworkLinks(spiral.group);
      const O = new THREE.Vector3(0, 0, 0);
      this.systems.forEach((s, i) => this.links.link(O, s.base, s.def.color, 260 + i * 40, 0.22 + i * 0.03, i * 0.37, 0.08));
      const ring = [...this.systems].sort((a, b) => Math.atan2(a.base.z, a.base.x) - Math.atan2(b.base.z, b.base.x));
      ring.forEach((s, i) => {
        const n = ring[(i + 1) % ring.length];
        this.links.link(s.base, n.base, "#cfd8ee", 140, 0.12, i * 0.21, 0.035);
      });
    }

    /** Fait tourner le disque, les nébuleuses, le réseau ET les systèmes ensemble. */
    _rotate(dt) {
      this.spin -= SPIN * dt;
      this.spiral.group.rotation.y = this.spin;
      const axis = _Y;
      for (const s of this.systems) {
        s.center.copy(s.base).applyAxisAngle(axis, this.spin);
        s.group.position.copy(s.center);
        s.light.star.value.copy(s.center);
      }
    }

    /**
     * @param spinning la galaxie tourne (vue d'ensemble) ; figée dès qu'on
     *                 s'approche d'un système pour ne pas le "perdre".
     */
    update(dt, focusSystem, cam, hideCore, spinning) {
      if (spinning) this._rotate(dt);
      this.links.update(dt, focusSystem ? 0 : 1);
      this.core.userData.update(dt);
      for (const s of this.systems) {
        s.update(dt, s === focusSystem, cam);
        s.setExpand(s === focusSystem ? 1 : 0, dt);
      }
      const coreTarget = focusSystem || hideCore ? 0 : 1;
      this.coreLabel.material.opacity = U.damp(this.coreLabel.material.opacity, coreTarget, 0.002, dt);
      this.coreLabel.visible = this.coreLabel.material.opacity > 0.02;
    }

    relabel() { this.systems.forEach((s) => s.relabel()); }

    get planetCount() { return this.systems.reduce((n, s) => n + s.planets.length, 0); }
  }

  PF.Planet = Planet;
  PF.StarSystem = StarSystem;
  PF.Galaxy = Galaxy;
  PF.SYSTEM_STYLE = STYLE;
})(window.PF = window.PF || {});
