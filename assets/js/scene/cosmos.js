/* =============================================================================
 * cosmos.js — Tout ce qui n'est pas cliquable mais fait le "réalisme" :
 *   bakeSky()      ciel Voie lactée calculé une fois dans une cubemap
 *   Starfield      étoiles lointaines scintillantes, couleurs de corps noir
 *   SpiralGalaxy   ~70 000 étoiles en bras spiraux + bulbe + bandes de poussière
 *   Nebulae        nuages colorés (régions HII) le long des bras
 *   SpaceDust      poussière proche : donne la sensation de vitesse
 *   WarpField      traînées de l'hyperespace pendant les sauts
 * ========================================================================== */
(function (PF) {
  "use strict";
  const G = PF.GLSL;
  const { hash } = PF.F;
  const TIME = PF.F.TIME;

  const gauss = () => {   // Box-Muller
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  /** Profil de qualité selon l'appareil. */
  const LOW = PF.U.env.touch || Math.min(screen.width, screen.height) < 700;
  const Q = {
    low: LOW,
    galaxy: LOW ? 36000 : 90000,
    dust: LOW ? 5000 : 12000,
    stars: LOW ? 4000 : 7500,
    sky: LOW ? 512 : 1024,
  };

  /* -------------------------- Ciel (cubemap) --------------------------- */
  function bakeSky(renderer) {
    const rt = new THREE.WebGLCubeRenderTarget(Q.sky, { generateMipmaps: false });
    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(100, 64, 32), G.mat({
      uniforms: { uBandN: { value: new THREE.Vector3(0.32, 1, 0.28).normalize() } },
      vertexShader: G.SKY_VERT, fragmentShader: G.SKY_FRAG,
      side: THREE.BackSide, depthWrite: false,
    }));
    scene.add(mesh);
    const cam = new THREE.CubeCamera(1, 1000, rt);
    cam.update(renderer, scene);
    mesh.geometry.dispose(); mesh.material.dispose();
    return rt.texture;
  }

  /* ---------------------------- Étoiles -------------------------------- */
  const POINT_FRAG = /* glsl */ `
    varying vec3 vColor; varying float vA;
    void main(){
      vec2 c = gl_PointCoord - 0.5;
      float d = length(c) * 2.0;
      float k = exp(-d * d * 4.5);
      gl_FragColor = vec4(vColor * k * vA, 1.0);
    }`;

  class Starfield {
    constructor(scene, pr) {
      const n = Q.stars, R = 9000;
      const pos = new Float32Array(n * 3), colr = new Float32Array(n * 3);
      const size = new Float32Array(n), phase = new Float32Array(n), spike = new Float32Array(n);
      const palette = ["#9db4ff", "#c4d4ff", "#f8f7ff", "#fff4ea", "#ffe3bf", "#ffcf9a", "#ffad6b"];
      const weights = [0.08, 0.14, 0.26, 0.24, 0.14, 0.09, 0.05];
      const c = new THREE.Color();
      for (let i = 0; i < n; i++) {
        const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
        pos.set([Math.cos(th) * s * R, u * R, Math.sin(th) * s * R], i * 3);
        let r = Math.random(), k = 0;
        while (k < weights.length - 1 && r > weights[k]) { r -= weights[k]; k++; }
        const b = Math.pow(Math.random(), 7);
        size[i] = 1.2 + b * 6.5;
        // Les étoiles les plus brillantes reçoivent des aigrettes (optique de télescope).
        if (b > 0.42) { spike[i] = 1; size[i] *= 4.2; }
        c.set(palette[k]).multiplyScalar(0.35 + b * 1.6);
        colr.set([c.r, c.g, c.b], i * 3);
        phase[i] = Math.random();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aColor", new THREE.BufferAttribute(colr, 3));
      geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
      geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
      geo.setAttribute("aSpike", new THREE.BufferAttribute(spike, 1));
      this.material = G.mat({
        uniforms: { uTime: TIME, uPR: { value: pr } },
        vertexShader: `attribute vec3 aColor; attribute float aSize; attribute float aPhase; attribute float aSpike;
          uniform float uTime; uniform float uPR; varying vec3 vColor; varying float vA; varying float vSpike;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = aSize * uPR;
            vColor = aColor;
            vSpike = aSpike;
            vA = 0.7 + 0.3 * sin(uTime * (0.8 + aPhase * 2.6) + aPhase * 50.0);
          }`,
        fragmentShader: `varying vec3 vColor; varying float vA; varying float vSpike;
          void main(){
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c) * 2.0;
            float core = exp(-d * d * mix(4.5, 70.0, vSpike));
            float spikes = vSpike * (exp(-abs(c.x) * 90.0) + exp(-abs(c.y) * 90.0)) * pow(max(1.0 - d, 0.0), 2.2) * 0.7;
            gl_FragColor = vec4(vColor * (core + spikes) * vA, 1.0);
          }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      this.points = new THREE.Points(geo, this.material);
      this.points.frustumCulled = false;
      this.points.renderOrder = -2;
      scene.add(this.points);
    }
    /** Toujours centré sur la caméra : étoiles "à l'infini", sans parallaxe. */
    update(cam) { this.points.position.copy(cam.position); }
    setPR(pr) { this.material.uniforms.uPR.value = pr; }
  }

  /* ------------------------- Galaxie spirale --------------------------- */
  class SpiralGalaxy {
    constructor(scene, pr) {
      this.group = new THREE.Group();
      scene.add(this.group);
      const R = 3000, ARMS = 4, WIND = 2.35;
      const armAngle = (r, arm) => arm * (Math.PI * 2 / ARMS) + Math.log(Math.max(r, 90) / 90) * WIND;
      this.armAngle = armAngle;

      /* Étoiles brillantes (additif) */
      const n = Q.galaxy;
      const pos = new Float32Array(n * 3), colr = new Float32Array(n * 3), size = new Float32Array(n);
      const c = new THREE.Color();
      const CORE = ["#ffd7a0", "#ffe6c4", "#fff1dc"];
      const BAR = 0.5;
      const GLOBS = Array.from({ length: 16 }, (_, i) => {
        const r = 1300 + hash(i * 3.7) * 2000, th = hash(i * 5.3) * Math.PI * 2, ph = (hash(i * 7.9) - 0.5) * 2.4;
        return { x: Math.cos(th) * Math.cos(ph) * r, y: Math.sin(ph) * r * 0.6, z: Math.sin(th) * Math.cos(ph) * r };
      });
      const ARM = ["#9fc2ff", "#c9dcff", "#e9f0ff", "#fff3e0"];
      for (let i = 0; i < n; i++) {
        const t = Math.random();
        let x, y, z, k;
        if (t < 0.11) {                                 // bulbe
          const r = Math.abs(gauss()) * 260;
          const a = Math.random() * Math.PI * 2;
          x = Math.cos(a) * r; z = Math.sin(a) * r; y = gauss() * 70 * Math.exp(-r / 400);
          c.set(CORE[i % 3]).multiplyScalar(0.18 + Math.random() * 0.22);
          k = 1.5 + Math.random() * 3;
        } else if (t < 0.2) {                           // barre (galaxie spirale barrée)
          const u = gauss() * 330, v = gauss() * 85;
          x = Math.cos(BAR) * u - Math.sin(BAR) * v; z = Math.sin(BAR) * u + Math.cos(BAR) * v;
          y = gauss() * 40;
          c.set(CORE[i % 3]).multiplyScalar(0.14 + Math.random() * 0.18);
          k = 1.4 + Math.random() * 2.6;
        } else if (t < 0.215) {                         // amas globulaires (halo)
          const g = GLOBS[i % GLOBS.length];
          x = g.x + gauss() * 22; y = g.y + gauss() * 22; z = g.z + gauss() * 22;
          c.set("#ffdcb0").multiplyScalar(0.22 + Math.random() * 0.2);
          k = 1.2 + Math.random() * 2.2;
        } else {
          const r = 120 + Math.min(-Math.log(1 - Math.random() * 0.985) * 780, R);
          const inArm = Math.random() < 0.78;
          const arm = Math.floor(Math.random() * ARMS);
          const spread = inArm ? gauss() * (0.16 + 0.22 * r / R) : Math.random() * Math.PI * 2;
          const a = armAngle(r, arm) + spread;
          x = Math.cos(a) * r; z = Math.sin(a) * r;
          y = gauss() * (14 + 46 * Math.exp(-r / 900));
          const fall = Math.exp(-r / 2600);
          if (inArm && Math.random() < 0.03) {          // régions HII roses
            c.set("#ff6fa0").multiplyScalar(0.5 + Math.random() * 0.4);
            k = 3 + Math.random() * 4;
          } else {
            c.set(ARM[Math.floor(Math.random() * ARM.length)]).multiplyScalar((inArm ? 0.2 : 0.08) * (0.5 + fall) * (0.6 + Math.random() * 0.8));
            k = 1.2 + Math.pow(Math.random(), 4) * 5;
          }
        }
        pos.set([x, y, z], i * 3);
        colr.set([c.r, c.g, c.b], i * 3);
        size[i] = k;
      }
      this.stars = this._points(pos, colr, size, pr, THREE.AdditiveBlending, 1);

      /* Bandes de poussière (assombrissent : mélange normal) */
      const m = Q.dust;
      const dpos = new Float32Array(m * 3), dcol = new Float32Array(m * 3), dsize = new Float32Array(m);
      for (let i = 0; i < m; i++) {
        const r = 260 + Math.random() * 2300;
        const arm = Math.floor(Math.random() * ARMS);
        const a = armAngle(r, arm) - 0.16 + gauss() * 0.07;   // bord intérieur des bras
        dpos.set([Math.cos(a) * r, gauss() * 10, Math.sin(a) * r], i * 3);
        dcol.set([0.035, 0.025, 0.02], i * 3);
        dsize[i] = 14 + Math.random() * 22;
      }
      this.dust = this._points(dpos, dcol, dsize, pr, THREE.NormalBlending, 2, 0.32);
    }

    _points(pos, colr, size, pr, blending, order, alpha = 1) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aColor", new THREE.BufferAttribute(colr, 3));
      geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
      const additive = blending === THREE.AdditiveBlending;
      const mat = G.mat({
        uniforms: { uPR: { value: pr }, uAlpha: { value: alpha } },
        vertexShader: `attribute vec3 aColor; attribute float aSize; uniform float uPR;
          varying vec3 vColor; varying float vA;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            float d = -mv.z;
            gl_PointSize = clamp(aSize * uPR * 1400.0 / d, 0.0, 26.0 * uPR);
            vA = smoothstep(40.0, 420.0, d);
            vColor = aColor;
          }`,
        fragmentShader: additive ? POINT_FRAG : `uniform float uAlpha; varying vec3 vColor; varying float vA;
          void main(){
            float d = length(gl_PointCoord - 0.5) * 2.0;
            float k = exp(-d * d * 3.0) * uAlpha * vA;
            gl_FragColor = vec4(vColor, k);
          }`,
        transparent: true, depthWrite: false, blending,
      });
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      pts.renderOrder = order;
      this.group.add(pts);
      return pts;
    }

    setPR(pr) { [this.stars, this.dust].forEach((p) => (p.material.uniforms.uPR.value = pr)); }
  }

  /* ----------------------------- Nébuleuses ---------------------------- */
  function nebulaTexture(seed) {
    const s = 128, cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const ctx = cv.getContext("2d"), img = ctx.createImageData(s, s);
    const N = 16, grid = [];
    for (let i = 0; i < (N + 1) * (N + 1) * 4; i++) grid.push(hash(i * 1.37 + seed * 91.1));
    const vnoise = (x, y, o) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const g = (a, b) => grid[(((a % N) + N) % N + ((((b % N) + N) % N) * (N + 1)) + o * 289) % grid.length];
      const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
      return (g(xi, yi) * (1 - sx) + g(xi + 1, yi) * sx) * (1 - sy) + (g(xi, yi + 1) * (1 - sx) + g(xi + 1, yi + 1) * sx) * sy;
    };
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      let v = 0, a = 0.5, f = 4 / s;
      for (let o = 0; o < 4; o++) { v += a * vnoise(x * f, y * f, o); f *= 2; a *= 0.5; }
      const dx = x / s - 0.5, dy = y / s - 0.5;
      const fall = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 2);
      const k = Math.max(0, v - 0.35) * 1.9 * fall * fall;
      const i = (y * s + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.min(255, k * 255);
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  const _w = new THREE.Vector3();
  class Nebulae {
    constructor(scene, galaxy) {
      const texs = [0, 1, 2].map(nebulaTexture);
      const tints = ["#ff4f86", "#3fb7cf", "#8a6cff", "#ff8a4c", "#ff4f86", "#5fd0b0"];
      this.items = [];
      for (let i = 0; i < 18; i++) {
        const r = 500 + hash(i * 3.3) * 2200;
        const a = galaxy.armAngle(r, i % 4) + (hash(i * 7.1) - 0.5) * 0.3;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({
          map: texs[i % 3], color: new THREE.Color(tints[i % tints.length]),
          blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
          opacity: 0, rotation: hash(i) * 6.28,
        }));
        const size = 520 + hash(i * 5.5) * 900;
        sp.scale.set(size, size * (0.6 + hash(i * 2.2) * 0.5), 1);
        sp.position.set(Math.cos(a) * r, (hash(i * 9.1) - 0.5) * 60, Math.sin(a) * r);
        sp.userData.base = 0.16 + hash(i * 4.4) * 0.18;
        sp.renderOrder = 1;
        galaxy.group.add(sp);                       // tournent avec le disque
        this.items.push(sp);
      }
    }
    /** Estompe les nébuleuses trop proches (évite l'effet "panneau"). */
    update(cam) {
      for (const sp of this.items) {
        const d = sp.getWorldPosition(_w).distanceTo(cam.position);
        sp.material.opacity = sp.userData.base * THREE.MathUtils.smoothstep(d, sp.scale.x * 0.35, sp.scale.x * 1.2);
      }
    }
  }

  /* --------------------- Poussière proche (parallaxe) ------------------ */
  class SpaceDust {
    constructor(scene, pr) {
      const n = Q.low ? 500 : 1100, S = 900;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n * 3; i++) pos[i] = (Math.random() - 0.5) * S;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.material = G.mat({
        uniforms: { uCam: { value: new THREE.Vector3() }, uSize: { value: S }, uPR: { value: pr }, uSpeed: { value: 0 } },
        vertexShader: `uniform vec3 uCam; uniform float uSize; uniform float uPR; uniform float uSpeed; varying float vA;
          void main(){
            vec3 p = mod(position - uCam + uSize * 0.5, uSize) - uSize * 0.5 + uCam;
            vec4 mv = viewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float d = length(p - uCam);
            gl_PointSize = clamp(1.6 * uPR * 120.0 / max(-mv.z, 1.0), 0.0, 3.0 * uPR);
            vA = (1.0 - smoothstep(uSize * 0.18, uSize * 0.5, d)) * smoothstep(6.0, 40.0, d) * (0.25 + uSpeed * 0.75);
          }`,
        fragmentShader: `varying float vA;
          void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; gl_FragColor = vec4(vec3(0.75, 0.82, 1.0) * (1.0 - d) * vA, 1.0); }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      this.points = new THREE.Points(geo, this.material);
      this.points.frustumCulled = false;
      scene.add(this.points);
    }
    update(cam, speed01) {
      this.material.uniforms.uCam.value.copy(cam.position);
      this.material.uniforms.uSpeed.value = speed01;
    }
    setPR(pr) { this.material.uniforms.uPR.value = pr; }
  }

  /* ---------------------- Traînées d'hyperespace ----------------------- */
  class WarpField {
    constructor(camera) {
      const n = Q.low ? 260 : 520, RANGE = 1800;
      const pos = new Float32Array(n * 6), end = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r = 50 + Math.pow(Math.random(), 0.7) * 420;
        const x = Math.cos(a) * r, y = Math.sin(a) * r, z = Math.random() * RANGE;
        pos.set([x, y, z, x, y, z], i * 6);
        end[i * 2] = 0; end[i * 2 + 1] = 1;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
      this.material = G.mat({
        uniforms: { uTime: TIME, uWarp: { value: 0 }, uRange: { value: RANGE }, uTint: { value: new THREE.Color("#bcd4ff") } },
        vertexShader: `attribute float aEnd; uniform float uTime; uniform float uWarp; uniform float uRange; varying float vA;
          void main(){
            float z = -uRange + mod(position.z + uTime * 2600.0, uRange);
            z -= aEnd * (40.0 + 520.0 * uWarp);
            vA = smoothstep(-uRange, -uRange * 0.55, z) * (1.0 - smoothstep(-160.0, -8.0, z)) * uWarp;
            gl_Position = projectionMatrix * vec4(position.xy, z, 1.0);
          }`,
        fragmentShader: `uniform vec3 uTint; varying float vA; void main(){ gl_FragColor = vec4(uTint * 2.2 * vA, 1.0); }`,
        transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      });
      this.lines = new THREE.LineSegments(geo, this.material);
      this.lines.frustumCulled = false;
      this.lines.renderOrder = 20;
      this.lines.visible = false;
      camera.add(this.lines);
    }
    set(w, tint) {
      this.material.uniforms.uWarp.value = w;
      if (tint) this.material.uniforms.uTint.value.set(tint);
      this.lines.visible = w > 0.01;
    }
  }

  PF.Cosmos = { Q, bakeSky, Starfield, SpiralGalaxy, Nebulae, SpaceDust, WarpField };
})(window.PF = window.PF || {});
