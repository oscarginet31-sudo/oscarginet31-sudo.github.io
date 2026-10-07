/* =============================================================================
 * factory.js — Fabriques d'objets Three.js : labels, orbites à traînée,
 * étoiles (photosphère + couronne + aigrette), pulsar, cœur galactique,
 * planètes procédurales (surface, nuages, atmosphère, anneaux, lunes),
 * portail de retour, ceinture d'astéroïdes. Aucune logique de scène ici.
 *
 * Conventions de calques :
 *   calque 0 = scène "physique" (passe par le bloom) ;
 *   calque 1 = interface 3D (labels, marqueurs) rendue nette par-dessus.
 * ========================================================================== */
(function (PF) {
  "use strict";
  const G = PF.GLSL;
  const UI_LAYER = 1;

  /** Temps partagé par tous les matériaux animés (mis à jour 1×/frame). */
  const TIME = { value: 0 };
  /** Appareil modeste : moins d'octaves de bruit et de particules. */
  const LOW = PF.U.env.touch || Math.min(screen.width, screen.height) < 700;
  const MAX_OCT = LOW ? 6 : 8;
  const PR = Math.min(devicePixelRatio || 1, LOW ? 1.25 : 1.75);

  /* --- Pseudo-aléatoire déterministe ------------------------------------ */
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const range = (seed, a, b) => a + hash(seed) * (b - a);

  /* --- Textures procédurales (canvas, générées une seule fois) ---------- */
  const cache = {};
  function canvasTex(key, w, h, draw) {
    if (cache[key]) return cache[key];
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    draw(cv.getContext("2d"), w, h);
    const tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    return (cache[key] = tex);
  }

  const glowTex = () => canvasTex("glow", 128, 128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.18, "rgba(255,255,255,0.5)");
    g.addColorStop(0.45, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  });

  /** Aigrette anamorphique horizontale (look "objectif cinéma"). */
  const streakTex = () => canvasTex("streak", 512, 32, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "destination-in";
    const v = ctx.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(0.5, "rgba(0,0,0,1)");
    v.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
  });

  /** Marqueur de sélection : cercle fin + 4 graduations. */
  const selectTex = () => canvasTex("select", 256, 256, (ctx, s) => {
    const c = s / 2, r = s * 0.42;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
      const a0 = i * Math.PI / 2 + 0.22, a1 = (i + 1) * Math.PI / 2 - 0.22;
      ctx.beginPath(); ctx.arc(c, c, r, a0, a1); ctx.stroke();
    }
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * (r - 9), c + Math.sin(a) * (r - 9));
      ctx.lineTo(c + Math.cos(a) * (r + 7), c + Math.sin(a) * (r + 7));
      ctx.stroke();
    }
  });

  /* --- Catalogue de planètes ------------------------------------------- */
  const TYPES = {
    terran:   { def: "T_TERRAN", r: [8.5, 11], A: "#1d4f8c", B: "#4b7a3a", C: "#b9a27a", atmo: "#6fa8ff", k: 1.0, clouds: 0.0, moons: 1, bump: 0.07 },
    ocean:    { def: "T_OCEAN",  r: [9, 11.5], A: "#18598a", B: "#2f8f7c", C: "#d9e5e0", atmo: "#7cc6ff", k: 1.1, clouds: 0.06, moons: 1, bump: 0.06 },
    gas:      { def: "T_GAS",    r: [15, 19],  A: "#dcb58a", B: "#a3623a", C: "#f3e5c9", atmo: "#f0c89a", k: 0.55, rings: 0.65, bands: [9, 15], moons: 2, bump: 0 },
    icegiant: { def: "T_GAS",    r: [12.5, 15.5], A: "#5a8ed8", B: "#88b9ea", C: "#d6edff", atmo: "#8fd2ff", k: 0.8, rings: 0.4, bands: [4, 8], moons: 1, bump: 0 },
    desert:   { def: "T_DESERT", r: [7.5, 10], A: "#d29b5a", B: "#8a5430", C: "#f0d09b", atmo: "#ffb877", k: 0.5, bump: 0.06 },
    ice:      { def: "T_ICE",    r: [6.5, 9],  A: "#ddeaf4", B: "#8cb2cc", C: "#ffffff", atmo: "#bfe6ff", k: 0.4, bump: 0.05 },
    lava:     { def: "T_LAVA",   r: [6.5, 9],  A: "#151010", B: "#3c2722", C: "#ff5a1a", atmo: "#ff6a2a", k: 0.35, bump: 0.06 },
    rock:     { def: "T_ROCK",   r: [5, 7.5],  A: "#9b958c", B: "#58544e", C: "#c6c0b5", atmo: "#000000", k: 0.0, bump: 0.075 },
    toxic:    { def: "T_DESERT", r: [8.5, 10.5], A: "#d7c17b", B: "#a88945", C: "#f2e4ae", atmo: "#f2dc8c", k: 1.25, clouds: 0.2, bump: 0.02 },
  };
  /** Ordre de base : alterne volontairement les types pour la variété. */
  const TYPE_CYCLE = ["terran", "gas", "rock", "desert", "icegiant", "lava", "ocean", "ice", "toxic", "gas", "rock", "terran"];

  const col = (hex) => new THREE.Color(hex);
  const jitter = (hex, seed, amt = 0.06) => {
    const c = col(hex), hsl = {};
    c.getHSL(hsl);
    return c.setHSL(
      (hsl.h + (hash(seed) - 0.5) * amt + 1) % 1,
      THREE.MathUtils.clamp(hsl.s * (0.85 + hash(seed + 1) * 0.3), 0, 1),
      THREE.MathUtils.clamp(hsl.l * (0.9 + hash(seed + 2) * 0.2), 0, 1)
    );
  };

  const SPHERE = {};
  const sphereGeo = (seg) => SPHERE[seg] || (SPHERE[seg] = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.6)));

  const F = {
    TIME, UI_LAYER, TYPES, TYPE_CYCLE, hash, range,

    /** Halo lumineux additif (couleur HDR possible : >1 = bloom). */
    glow(color, size, intensity = 1) {
      const m = new THREE.SpriteMaterial({
        map: glowTex(), color: col(color).multiplyScalar(intensity),
        blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
      });
      const sp = new THREE.Sprite(m);
      sp.scale.set(size, size, 1);
      return sp;
    },

    /** Label texte net (calque UI, toujours face caméra). */
    label(text, color = "#ffffff", opts = {}) {
      const pad = 24, font = opts.font || 44;
      const cv = document.createElement("canvas");
      const ctx = cv.getContext("2d");
      const f = `${opts.weight || 500} ${font}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.font = f;
      if ("letterSpacing" in ctx) ctx.letterSpacing = (opts.spacing ?? 0.08) * font + "px";
      const w = Math.ceil(ctx.measureText(text).width + (opts.spacing ?? 0.08) * font * text.length) + pad * 2;
      const h = font + pad * 2;
      cv.width = w; cv.height = h;
      ctx.font = f;
      if ("letterSpacing" in ctx) ctx.letterSpacing = (opts.spacing ?? 0.08) * font + "px";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowBlur = 10;
      ctx.fillStyle = color;
      ctx.fillText(text, w / 2, h / 2);
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true, depthWrite: false, depthTest: false,
      }));
      const scale = opts.scale || 0.06;
      sp.scale.set(w * scale, h * scale, 1);
      sp.renderOrder = 10;
      sp.layers.set(UI_LAYER);
      return sp;
    },

    /** Marqueur de sélection autour d'une planète (calque UI). */
    selector(color) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: selectTex(), color: col(color), transparent: true,
        depthWrite: false, depthTest: false, opacity: 0,
      }));
      sp.layers.set(UI_LAYER);
      sp.renderOrder = 9;
      return sp;
    },

    /** Orbite avec traînée : brillante derrière la planète, presque invisible devant. */
    orbit(radius, color, segments = 192) {
      const pos = new Float32Array(segments * 3), ang = new Float32Array(segments);
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pos[i * 3] = Math.cos(a) * radius; pos[i * 3 + 2] = Math.sin(a) * radius;
        ang[i] = a;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aAngle", new THREE.BufferAttribute(ang, 1));
      const mat = G.mat({
        uniforms: {
          uColor: { value: col(color) }, uPlanet: { value: 0 },
          uDir: { value: 1 }, uOpacity: { value: 0 },
        },
        vertexShader: `attribute float aAngle; varying float vA;
          void main(){ vA = aAngle; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform vec3 uColor; uniform float uPlanet; uniform float uDir; uniform float uOpacity; varying float vA;
          void main(){
            float d = uDir > 0.0 ? mod(uPlanet - vA, 6.2831853) : mod(vA - uPlanet, 6.2831853);
            float k = 1.0 - d / 6.2831853;
            float a = (0.07 + 0.93 * pow(k, 2.5)) * uOpacity;
            gl_FragColor = vec4(uColor * (0.5 + 0.9 * pow(k, 8.0)), a);
          }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      return new THREE.LineLoop(geo, mat);
    },

    /** Étoile : photosphère animée + 2 couronnes contrarotatives + aigrette. */
    star(color, radius, opts = {}) {
      const grp = new THREE.Group();
      const c = col(color);
      const core = new THREE.Mesh(sphereGeo(48), G.mat({
        uniforms: {
          uColor: { value: c }, uTime: TIME,
          uIntensity: { value: opts.intensity || 1.7 }, uSpots: { value: opts.spots ?? 1 },
        },
        vertexShader: G.SPHERE_VERT, fragmentShader: G.STAR_FRAG,
      }));
      core.scale.setScalar(radius);
      grp.add(core);

      // Couronne animée (billboard calculé dans le shader) : jets, halo, protubérances.
      const size = radius * (opts.corona || 9);
      const corona = new THREE.Mesh(new THREE.PlaneGeometry(size, size), G.mat({
        uniforms: {
          uColor: { value: c.clone() }, uTime: TIME, uSize: { value: size },
          uCore: { value: (radius * 0.98) / (size / 2) }, uI: { value: opts.coronaI || 1.2 },
          uSeed: { value: hash(radius * 13.1) * 10 },
        },
        vertexShader: G.CORONA_VERT, fragmentShader: G.CORONA_FRAG,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      grp.add(corona);
      const halo = F.glow(color, radius * 26, 0.28);
      grp.add(halo);
      const streak = new THREE.Sprite(new THREE.SpriteMaterial({
        map: streakTex(), color: c.clone().lerp(new THREE.Color("#ffffff"), 0.4).multiplyScalar(0.45),
        blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
      }));
      streak.scale.set(radius * 18, radius * 0.7, 1);
      grp.add(streak);

      grp.userData.core = core;
      grp.userData.radius = radius;
      grp.userData.update = (dt) => { core.rotation.y += dt * 0.05; };
      return grp;
    },

    /** Pulsar : étoile à neutrons + deux faisceaux qui balaient l'espace. */
    pulsar(color, radius) {
      const grp = F.star(color, radius, { intensity: 3.2, spots: 0 });
      const axis = new THREE.Group();
      axis.rotation.z = 0.42;
      grp.add(axis);
      const beamMat = G.mat({
        uniforms: { uColor: { value: col(color).multiplyScalar(1.6) }, uTime: TIME },
        vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV;
          void main(){ vY = position.y; vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform vec3 uColor; uniform float uTime; varying float vY; varying vec3 vN; varying vec3 vV;
          void main(){
            float t = clamp(abs(vY) / 520.0, 0.0, 1.0);
            float edge = pow(abs(dot(vN, vV)), 1.5);
            float flicker = 0.85 + 0.15 * sin(uTime * 30.0 + vY * 0.05);
            float a = (1.0 - t) * (1.0 - t) * edge * flicker;
            gl_FragColor = vec4(uColor * a, a);
          }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      });
      [1, -1].forEach((dir) => {
        const geo = new THREE.ConeGeometry(radius * 3.2, 520, 40, 1, true);
        geo.translate(0, -260, 0);              // pointe au centre de l'étoile
        const beam = new THREE.Mesh(geo, beamMat);
        if (dir > 0) beam.rotation.z = Math.PI;
        axis.add(beam);
      });
      const base = grp.userData.update;
      grp.userData.update = (dt) => { base(dt); grp.rotation.y += dt * 1.1; };
      return grp;
    },

    /** Cœur galactique : point source aveuglant + bulbe chaud. */
    galacticCore() {
      const grp = F.star("#ffd9a0", 26, { intensity: 3.4, spots: 0 });
      grp.add(F.glow("#ffcf8a", 900, 0.55));
      grp.add(F.glow("#ff9f6a", 2200, 0.18));
      return grp;
    },

    /**
     * Planète procédurale complète.
     * @param type  clé de TYPES
     * @param seed  graine (détermine forme, couleurs, rotation)
     * @param light { star: {value:Vector3}, starColor: {value:Color} } partagés
     */
    planet(type, seed, light) {
      const T = TYPES[type] || TYPES.rock;
      const r = range(seed, T.r[0], T.r[1]);
      const grp = new THREE.Group();
      const tilt = new THREE.Group();                       // inclinaison de l'axe
      tilt.rotation.z = (hash(seed + 4) - 0.5) * 0.9;
      grp.add(tilt);

      const atmo = col(T.atmo);
      const oct = { value: 4 };                              // octaves de bruit (LOD)
      const surface = new THREE.Mesh(sphereGeo(64), G.mat({
        defines: { [T.def]: "" },
        uniforms: {
          uTime: TIME, uSeed: { value: hash(seed + 9) * 10 },
          uBands: { value: T.bands ? range(seed + 5, T.bands[0], T.bands[1]) : 10 },
          uHover: { value: 0 },
          uA: { value: jitter(T.A, seed) }, uB: { value: jitter(T.B, seed + 10) }, uC: { value: jitter(T.C, seed + 20) },
          uAtmo: { value: atmo }, uAtmoK: { value: T.k },
          uOct: oct, uBump: { value: r * (T.bump || 0) },
          uStar: light.star, uStarColor: light.starColor,
        },
        vertexShader: G.SPHERE_VERT, fragmentShader: G.PLANET_FRAG,
      }));
      surface.scale.setScalar(r);
      tilt.add(surface);

      let clouds = null;
      if (T.clouds != null) {
        clouds = new THREE.Mesh(sphereGeo(48), G.mat({
          uniforms: {
            uTime: TIME, uSeed: { value: hash(seed + 3) * 10 }, uCover: { value: T.clouds },
            uOct: oct, uStar: light.star, uStarColor: light.starColor,
          },
          vertexShader: G.SPHERE_VERT, fragmentShader: G.CLOUD_FRAG,
          transparent: true, depthWrite: false,
        }));
        clouds.scale.setScalar(r * 1.015);
        tilt.add(clouds);
      }

      if (T.k > 0) {
        const shell = new THREE.Mesh(sphereGeo(48), G.mat({
          uniforms: { uAtmo: { value: atmo }, uAtmoK: { value: T.k }, uStar: light.star },
          vertexShader: G.SPHERE_VERT, fragmentShader: G.ATMO_FRAG,
          side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        }));
        shell.scale.setScalar(r * 1.09);
        grp.add(shell);
      }

      let ring = null;
      const planetPos = { value: new THREE.Vector3() };
      if (T.rings && hash(seed + 6) < T.rings) {
        const rin = r * 1.35, rout = r * range(seed + 8, 2.0, 2.5);
        ring = new THREE.Mesh(new THREE.RingGeometry(rin, rout, 160, 1), G.mat({
          uniforms: {
            uIn: { value: rin }, uOut: { value: rout }, uSeed: { value: hash(seed + 2) * 10 },
            uA: { value: jitter(T.C, seed + 30) }, uB: { value: jitter(T.A, seed + 40).multiplyScalar(0.8) },
            uStar: light.star, uStarColor: light.starColor, uPlanetPos: planetPos, uPlanetR: { value: r },
          },
          vertexShader: G.RING_VERT, fragmentShader: G.RING_FRAG,
          side: THREE.DoubleSide, transparent: true, depthWrite: false,
        }));
        ring.rotation.x = Math.PI / 2 + 0.08;
        tilt.add(ring);
      }

      // Lunes décoratives.
      const moons = [];
      const nMoons = T.moons ? Math.round(hash(seed + 12) * T.moons + 0.3) : 0;
      for (let i = 0; i < nMoons; i++) {
        const m = new THREE.Mesh(sphereGeo(24), G.mat({
          defines: { T_ROCK: "" },
          uniforms: {
            uTime: TIME, uSeed: { value: hash(seed + 50 + i) * 10 }, uBands: { value: 0 }, uHover: { value: 0 },
            uA: { value: col("#a9a39a") }, uB: { value: col("#5f5b55") }, uC: { value: col("#cfc9be") },
            uAtmo: { value: col("#000000") }, uAtmoK: { value: 0 },
            uOct: { value: 5 }, uBump: { value: 0 },
            uStar: light.star, uStarColor: light.starColor,
          },
          vertexShader: G.SPHERE_VERT, fragmentShader: G.PLANET_FRAG,
        }));
        const mr = range(seed + 60 + i, 1.2, 2.2);
        m.scale.setScalar(mr);
        m.material.uniforms.uBump.value = mr * 0.14;
        const orbit = new THREE.Group();
        orbit.rotation.x = (hash(seed + 70 + i) - 0.5) * 0.6;
        orbit.add(m);
        m.position.x = r * range(seed + 80 + i, 2.4, 3.4);
        grp.add(orbit);
        moons.push({ orbit, speed: range(seed + 90 + i, 0.25, 0.6) * (i % 2 ? -1 : 1), angle: hash(seed + 95 + i) * 6.28 });
      }

      const spin = range(seed + 13, 0.08, 0.3) * (hash(seed + 14) < 0.15 ? -1 : 1);
      const LODS = [sphereGeo(24), sphereGeo(64), sphereGeo(128)];
      grp.userData = {
        mesh: surface, radius: r, type, ring, planetPos,
        uiColor: "#" + jitter(T.atmo === "#000000" ? T.C : T.atmo, seed).getHexString(),
        /** Niveau de détail selon le rayon apparent (pixels) : géométrie + octaves. */
        setLOD(px) {
          oct.value = THREE.MathUtils.clamp(2.5 + Math.log2(Math.max(px, 1) / 5), 3, MAX_OCT);
          const g = LODS[px > 200 ? 2 : px > 24 ? 1 : 0];
          if (surface.geometry !== g) { surface.geometry = g; if (clouds) clouds.geometry = g; }
        },
        update(dt) {
          surface.rotation.y += spin * dt;
          if (clouds) clouds.rotation.y += spin * 1.35 * dt;
          for (const m of moons) { m.angle += m.speed * dt; m.orbit.rotation.y = m.angle; }
          if (ring) surface.getWorldPosition(planetPos.value);
        },
      };
      return grp;
    },

    /**
     * Comète : noyau, chevelure, queue de poussière (large, courbée, jaunâtre)
     * et queue ionique (fine, droite, bleue). Les queues sont définies dans un
     * repère local où +X pointe à l'opposé de l'étoile (orienté par le système).
     */
    comet(light, seed) {
      const grp = new THREE.Group();
      const nucleus = new THREE.Mesh(sphereGeo(24), G.mat({
        defines: { T_ROCK: "" },
        uniforms: {
          uTime: TIME, uSeed: { value: hash(seed) * 10 }, uBands: { value: 0 }, uHover: { value: 0 },
          uA: { value: col("#6e6a64") }, uB: { value: col("#3a3734") }, uC: { value: col("#8d877e") },
          uAtmo: { value: col("#000000") }, uAtmoK: { value: 0 }, uOct: { value: 5 }, uBump: { value: 0.5 },
          uStar: light.star, uStarColor: light.starColor,
        },
        vertexShader: G.SPHERE_VERT, fragmentShader: G.PLANET_FRAG,
      }));
      nucleus.scale.set(1.1, 0.85, 0.95);                 // minuscule : noyé dans la chevelure
      grp.add(nucleus);
      const coma = F.glow("#d6ecff", 52, 1.1);
      grp.add(coma);

      const tail = new THREE.Group();
      grp.add(tail);
      const mk = (n, hex, k, width, curve, speed, sizeK) => {
        const pos = new Float32Array(n * 3), t = new Float32Array(n), off = new Float32Array(n * 2), sp = new Float32Array(n);
        const g = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.9;
        for (let i = 0; i < n; i++) { t[i] = Math.random(); off[i * 2] = g(); off[i * 2 + 1] = g(); sp[i] = speed * (0.6 + Math.random() * 0.8); }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("aT", new THREE.BufferAttribute(t, 1));
        geo.setAttribute("aOff", new THREE.BufferAttribute(off, 2));
        geo.setAttribute("aSpeed", new THREE.BufferAttribute(sp, 1));
        const m = G.mat({
          uniforms: {
            uTime: TIME, uLen: { value: 100 }, uCurve: { value: curve }, uWidth: { value: width },
            uPR: { value: PR }, uSizeK: { value: sizeK }, uBright: { value: 1 },
            uColor: { value: col(hex).multiplyScalar(k) },
          },
          vertexShader: `attribute float aT; attribute vec2 aOff; attribute float aSpeed;
            uniform float uTime; uniform float uLen; uniform float uCurve; uniform float uWidth; uniform float uPR; uniform float uSizeK;
            varying float vA;
            void main(){
              float t = fract(aT + uTime * aSpeed);
              float spread = uWidth * uLen * (0.06 + t);
              vec3 p = vec3(t * uLen, uCurve * t * t * uLen + aOff.x * spread, aOff.y * spread);
              vec4 mv = modelViewMatrix * vec4(p, 1.0);
              gl_Position = projectionMatrix * mv;
              gl_PointSize = clamp(uSizeK * uPR * 620.0 / max(-mv.z, 1.0) * (1.0 + 2.0 * (1.0 - t)), 1.5, 64.0);
              vA = (1.0 - t) * (1.0 - t) * smoothstep(0.0, 0.04, t);
            }`,
          fragmentShader: `uniform vec3 uColor; uniform float uBright; varying float vA;
            void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; gl_FragColor = vec4(uColor * exp(-d * d * 4.0) * vA * uBright, 1.0); }`,
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        });
        const pts = new THREE.Points(geo, m);
        pts.frustumCulled = false;
        tail.add(pts);
        return pts;
      };
      const dust = mk(LOW ? 700 : 1800, "#fff0d8", 0.2, 0.16, 0.22, 0.12, 1.0);
      const ion = mk(LOW ? 350 : 900, "#79acff", 0.32, 0.025, 0.0, 0.34, 0.6);

      grp.userData = {
        tail,
        /** Longueur et éclat des queues (maximaux près du périhélie). */
        setTail(len, bright) {
          dust.material.uniforms.uLen.value = len;
          ion.material.uniforms.uLen.value = len * 1.3;
          dust.material.uniforms.uBright.value = bright;
          ion.material.uniforms.uBright.value = bright;
          coma.material.opacity = 0.35 + 0.65 * Math.min(1, bright);
        },
        update(dt) { nucleus.rotation.y += dt * 0.25; },
      };
      return grp;
    },

    /** Portail de retour : anneau lumineux + vortex intérieur. */
    gate(color) {
      const grp = new THREE.Group();
      const c = col(color);
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(18, 1.1, 16, 96),
        new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(2.2) })
      );
      grp.add(torus);
      const swirl = new THREE.Mesh(new THREE.CircleGeometry(17, 64), G.mat({
        uniforms: { uTime: TIME, uColor: { value: c } },
        vertexShader: `varying vec2 vP; void main(){ vP = position.xy / 17.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec2 vP;
          ${G.NOISE}
          void main(){
            float r = length(vP); float a = atan(vP.y, vP.x);
            float s = snoise(vec3(a * 2.0 + r * 6.0 - uTime * 1.6, r * 3.0, uTime * 0.2)) * 0.5 + 0.5;
            float k = (1.0 - smoothstep(0.2, 1.0, r)) * (0.35 + 0.65 * s);
            gl_FragColor = vec4(uColor * k * 1.4, k);
          }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      }));
      grp.add(swirl);
      grp.add(F.glow(color, 120, 0.5));
      const pick = new THREE.Mesh(new THREE.SphereGeometry(26, 12, 12),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      grp.add(pick);
      grp.userData = {
        core: pick,
        update(dt, cam) {
          if (cam) { grp.lookAt(cam.position); }
          torus.rotation.z += dt * 0.4;
        },
      };
      return grp;
    },

    /** Ceinture d'astéroïdes (instanciée : un seul draw call). */
    asteroidBelt(inner, outer, count, seed) {
      const geo = new THREE.DodecahedronGeometry(1, 1);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const k = 0.7 + hash(i * 1.7 + seed) * 0.6;
        p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.8, p.getZ(i) * k);
      }
      geo.computeVertexNormals();
      const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({
        color: "#8a8076", roughness: 0.95, metalness: 0.05, flatShading: true,
      }), count);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      const v = new THREE.Vector3(), s = new THREE.Vector3();
      for (let i = 0; i < count; i++) {
        const a = hash(i + seed) * Math.PI * 2;
        const rr = inner + (outer - inner) * Math.pow(hash(i * 3.3 + seed), 0.8);
        v.set(Math.cos(a) * rr, (hash(i * 5.1 + seed) - 0.5) * 14, Math.sin(a) * rr);
        e.set(hash(i * 2.2) * 6, hash(i * 4.4) * 6, hash(i * 6.6) * 6);
        q.setFromEuler(e);
        const sc = 0.5 + Math.pow(hash(i * 9.9 + seed), 3) * 3.2;
        s.set(sc, sc, sc);
        m.compose(v, q, s);
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
      const grp = new THREE.Group();
      grp.add(mesh);
      grp.userData.update = (dt) => { grp.rotation.y += dt * 0.025; };
      return grp;
    },
  };

  PF.F = F;
})(window.PF = window.PF || {});
