/* =============================================================================
 * shaders.js — Bibliothèque GLSL : bruit procédural + matériaux du cosmos.
 * Tout est généré sur le GPU (aucune texture à télécharger) :
 *   - surfaces de planètes (tellurique, océan, gazeuse, désert, glace, lave,
 *     roche) avec relief calculé au pixel, reflets océaniques, diffusion
 *     atmosphérique (limbe bleu, terminateur orangé), nuages, anneaux ;
 *   - photosphère animée + couronne à jets et protubérances ;
 *   - ciel "Voie lactée" pré-calculé une seule fois dans une cubemap.
 * Niveau de détail : `uOct` (octaves de bruit) est piloté par la taille de la
 * planète à l'écran — plus de détail de près, presque rien de loin.
 * Les couleurs dépassent volontairement 1.0 (HDR) : le bloom les fait briller.
 * ========================================================================== */
(function (PF) {
  "use strict";

  /* --- Bruit simplex 3D (Ashima Arts / Stefan Gustavson, licence MIT) ---- */
  const NOISE = /* glsl */ `
    vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v){
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }
    float fbm(vec3 p){
      float s = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++){ s += a * snoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
      return s;
    }
    float fbm3(vec3 p){
      float s = 0.0, a = 0.5;
      for (int i = 0; i < 3; i++){ s += a * snoise(p); p = p * 2.07 + vec3(4.1, 1.3, 7.7); a *= 0.5; }
      return s;
    }
  `;

  /** fbm à niveau de détail variable (uOct octaves, de 3 à 8). */
  const NOISE_LOD = /* glsl */ `
    uniform float uOct;
    float fbmL(vec3 p){
      float s = 0.0, a = 0.5;
      for (int i = 0; i < 8; i++){
        if (float(i) >= uOct) break;
        s += a * snoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5;
      }
      return s;
    }
  `;

  /* --- Vertex commun aux sphères : position objet + monde ---------------- */
  const SPHERE_VERT = /* glsl */ `
    varying vec3 vObj;
    varying vec3 vWPos;
    varying vec3 vWNorm;
    void main(){
      vObj = normalize(position);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWPos = wp.xyz;
      vWNorm = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `;

  /* --- Surface de planète : un shader, plusieurs "types" via #define ----- */
  const PLANET_FRAG = /* glsl */ `
    uniform float uTime;
    uniform float uSeed;
    uniform float uBands;
    uniform float uHover;
    uniform float uBump;
    uniform vec3 uA;
    uniform vec3 uB;
    uniform vec3 uC;
    uniform vec3 uAtmo;
    uniform float uAtmoK;
    uniform vec3 uStar;
    uniform vec3 uStarColor;
    varying vec3 vObj;
    varying vec3 vWPos;
    varying vec3 vWNorm;
    ${NOISE}
    ${NOISE_LOD}

    /* Relief au pixel (bump mapping sans UV, Mikkelsen) : la hauteur procédurale
       perturbe la normale ; montagnes et cratères accrochent la lumière rasante. */
    vec3 bumpNormal(vec3 N, float h){
      vec3 dpdx = dFdx(vWPos), dpdy = dFdy(vWPos);
      vec3 r1 = cross(dpdy, N), r2 = cross(N, dpdx);
      float det = dot(dpdx, r1);
      vec2 dh = vec2(dFdx(h), dFdy(h)) * uBump;
      vec3 grad = sign(det) * (dh.x * r1 + dh.y * r2);
      return normalize(abs(det) * N - grad);
    }

    /* Cratères d'impact (bruit cellulaire) : cuvette, rempart surélevé, éjectas. */
    vec3 hash3(vec3 p){
      p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
      return fract(sin(p) * 43758.5453123);
    }
    float craters(vec3 p){
      vec3 i = floor(p), f = fract(p);
      float h = 0.0;
      for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++){
        vec3 g = vec3(float(x), float(y), float(z));
        vec3 o = hash3(i + g);
        if (o.y < 0.4) continue;                       // toutes les cellules n'ont pas de cratère
        float k = length(g + o - f) / (0.22 + 0.3 * o.x);
        if (k > 1.6) continue;
        float bowl = k < 1.0 ? (k * k - 1.0) * 0.7 : 0.0;
        float rim = exp(-(k - 1.0) * (k - 1.0) * 30.0) * 0.32;
        float ejecta = k > 1.0 ? exp(-(k - 1.0) * 4.0) * 0.06 : 0.0;
        h = min(h, bowl) + rim + ejecta;
      }
      return h;
    }

    void main(){
      vec3 p = vObj * 1.6 + vec3(uSeed * 7.13, uSeed * 3.71, uSeed * 1.93);
      vec3 col; float spec = 0.0; float gloss = 48.0; vec3 emis = vec3(0.0); float city = 0.0; float relief = 0.0;

    #if defined(T_TERRAN) || defined(T_OCEAN)
      #ifdef T_OCEAN
        float sea = 0.22;
      #else
        float sea = 0.0;
      #endif
      float h = fbmL(p) + 0.25 * fbm3(p * 3.3);
      float land = smoothstep(sea, sea + 0.03, h);
      vec3 water = mix(uA * 0.4, uA * 1.2, smoothstep(sea - 0.45, sea, h));
      float m = smoothstep(0.02, 0.5, h - sea + 0.15 * fbm3(p * 6.0));
      vec3 ground = mix(uB, uC, m);
      ground = mix(ground, ground * vec3(1.15, 1.0, 0.8), smoothstep(0.0, 0.4, 0.4 - abs(vObj.y)) * 0.25);   // tropiques plus secs
      float lat = abs(vObj.y) + 0.12 * fbm3(p * 2.3);
      float ice = smoothstep(0.76, 0.84, lat);
      col = mix(mix(water, ground, land), vec3(0.93, 0.96, 1.0), ice);
      spec = (1.0 - land) * (1.0 - ice);
      gloss = 220.0;
      relief = land * (h - sea) * (1.0 - ice * 0.7);
      city = land * (1.0 - ice) * smoothstep(0.7, 0.86, snoise(p * 16.0) * 0.5 + 0.5) * smoothstep(0.35, 0.7, snoise(p * 3.0) * 0.5 + 0.5) * (1.0 - smoothstep(0.0, 0.2, h - sea));
    #elif defined(T_GAS)
      float lat = vObj.y;
      vec3 q = vec3(p.x * 0.55, lat * 2.4, p.z * 0.55);
      float warp = fbm3(q * 1.4 + vec3(uTime * 0.008, 0.0, 0.0));
      float w = fbmL(q + vec3(warp * 1.1, 0.0, warp * 0.7) + vec3(uTime * 0.012, 0.0, 0.0));
      float b = sin(lat * uBands + w * 3.4 + uSeed * 10.0);
      float b2 = sin(lat * uBands * 2.7 + w * 5.0);
      col = mix(uA, uB, b * 0.5 + 0.5);
      col = mix(col, uC, (b2 * 0.5 + 0.5) * 0.28);
      col *= 0.93 + 0.14 * snoise(vec3(lat * 70.0, w * 4.0, uSeed));
      col = mix(col, uB * 0.65 + vec3(0.02, 0.03, 0.06), smoothstep(0.7, 0.97, abs(lat)) * 0.55);
      vec3 spot = normalize(vec3(0.8, -0.32, 0.5));
      float ds = distance(vObj, spot);
      float swirl = snoise(vec3(atan(vObj.z - spot.z, vObj.x - spot.x) * 2.0 + ds * 30.0, ds * 8.0, uTime * 0.05));
      col = mix(col, uB * 1.3, (1.0 - smoothstep(0.08, 0.2, ds + 0.04 * swirl)) * 0.85);
      spec = 0.06;
    #elif defined(T_DESERT)
      float h = fbmL(p * 1.2);
      float dunes = sin((vObj.y + h * 0.45) * 46.0) * 0.5 + 0.5;
      col = mix(uB, uA, smoothstep(-0.45, 0.5, h));
      col = mix(col, uC, dunes * 0.16 + smoothstep(0.25, 0.7, fbm3(p * 4.0)) * 0.3);
      relief = h + dunes * 0.04;
    #elif defined(T_ICE)
      float h = fbmL(p * 1.4);
      col = mix(uB, uA, smoothstep(-0.5, 0.4, h));
      float cr = 1.0 - smoothstep(0.0, 0.05, abs(snoise(p * 5.0)));
      col = mix(col, uB * 0.55, cr * 0.75);
      col = mix(col, uC, smoothstep(0.72, 0.9, abs(vObj.y)));
      spec = 0.45; gloss = 90.0;
      relief = h * 0.5 - cr * 0.25;
    #elif defined(T_LAVA)
      float h = fbmL(p * 1.3);
      float h2 = fbm3(p * 4.0 + 7.0);
      col = mix(uA, uB, smoothstep(-0.3, 0.5, h + 0.3 * h2));
      float hot = smoothstep(-0.2, 0.45, fbm3(p * 0.9 + 3.0));
      float wd = 0.015 + 0.07 * hot;
      float cr = 1.0 - smoothstep(0.0, wd, abs(snoise(p * 2.2 + 0.35 * vec3(h2) + vec3(0.0, uTime * 0.02, 0.0))));
      float pools = smoothstep(0.42, 0.68, h) * hot;
      float glow = max(cr * (0.35 + 0.65 * hot), pools) * (0.75 + 0.25 * sin(uTime * 1.3 + h * 12.0));
      emis = mix(uC, vec3(1.0, 0.85, 0.4), pools * 0.5) * glow * 2.4;
      relief = h - cr * 0.4 - pools * 0.3;
    #else
      float h = fbmL(p * 1.5);
      float cr = craters(vObj * 4.0 + uSeed) + 0.55 * craters(vObj * 11.0 + uSeed * 2.0) + 0.3 * craters(vObj * 27.0 + uSeed * 3.0);
      col = mix(uB, uA, smoothstep(-0.5, 0.5, h));
      col = mix(col, uB * 0.7, smoothstep(0.1, 0.45, fbm3(p * 0.8 + 5.0)) * 0.5);   // "mers" sombres
      col = mix(col, uC, smoothstep(0.08, 0.3, cr) * 0.45);                     // remparts et éjectas clairs
      col *= 0.82 + 0.18 * smoothstep(-0.6, 0.0, cr);                           // fonds de cratère plus sombres
      relief = h * 0.3 + cr * 0.55;
    #endif

      vec3 N0 = normalize(vWNorm);
      vec3 N = bumpNormal(N0, relief);
      vec3 L = normalize(uStar - vWPos);
      vec3 V = normalize(cameraPosition - vWPos);
      float ndl0 = dot(N0, L);                       // terminateur géométrique
      float ndl = dot(N, L);                         // ombrage du relief
      float diff = smoothstep(-0.05, 0.6, ndl) * smoothstep(-0.22, 0.06, ndl0);
      vec3 H = normalize(L + V);
      float fres = 0.04 + 0.96 * pow(1.0 - max(dot(N0, V), 0.0), 5.0);
      float nh = max(dot(N, H), 0.0);
      float glint = (pow(nh, gloss) * 2.6 + pow(nh, gloss * 0.15) * 0.12) * spec * (0.35 + fres) * step(0.0, ndl0);
      vec3 lit = col * (0.022 + diff * uStarColor) + glint * uStarColor;

      // Lumières des villes côté nuit (planètes habitées).
      lit += vec3(1.0, 0.7, 0.36) * city * (1.0 - smoothstep(-0.3, 0.02, ndl0)) * 0.9;

      // Diffusion atmosphérique : limbe bleuté, anneau orangé au terminateur.
      float rim = pow(1.0 - max(dot(N0, V), 0.0), 2.6);
      float sunset = smoothstep(-0.3, 0.05, ndl0) * (1.0 - smoothstep(0.05, 0.4, ndl0));
      vec3 sc = mix(uAtmo, vec3(1.0, 0.5, 0.22), sunset * 0.75);
      lit += sc * rim * uAtmoK * (0.1 + 0.9 * smoothstep(-0.35, 0.5, ndl0));
      lit = mix(lit, uAtmo * uStarColor * smoothstep(-0.1, 0.6, ndl0), 0.05 * uAtmoK);
      lit += emis;
      lit += uAtmo * uHover * 0.1;
      gl_FragColor = vec4(lit, 1.0);
    }
  `;

  /* --- Couche nuageuse (sphère légèrement plus grande) -------------------- */
  const CLOUD_FRAG = /* glsl */ `
    uniform float uTime;
    uniform float uSeed;
    uniform float uCover;
    uniform vec3 uStar;
    uniform vec3 uStarColor;
    varying vec3 vObj;
    varying vec3 vWPos;
    varying vec3 vWNorm;
    ${NOISE}
    ${NOISE_LOD}
    void main(){
      vec3 p = vObj * 2.1 + vec3(uSeed * 5.0, 0.0, uTime * 0.008);
      float c = fbmL(p + 0.6 * fbm3(p * 1.7));
      c = smoothstep(0.08 - uCover, 0.55 - uCover, c);
      vec3 N = normalize(vWNorm);
      vec3 L = normalize(uStar - vWPos);
      float ndl = dot(N, L);
      float diff = smoothstep(-0.12, 0.5, ndl);
      float sunset = smoothstep(-0.25, 0.05, ndl) * (1.0 - smoothstep(0.05, 0.35, ndl));
      vec3 tint = mix(vec3(1.0), vec3(1.0, 0.62, 0.38), sunset * 0.8);
      gl_FragColor = vec4(tint * (0.02 + diff * uStarColor), c * 0.92);
    }
  `;

  /* --- Atmosphère : coquille arrière, diffusion + halo de contre-jour ---- */
  const ATMO_FRAG = /* glsl */ `
    uniform vec3 uAtmo;
    uniform float uAtmoK;
    uniform vec3 uStar;
    varying vec3 vObj;
    varying vec3 vWPos;
    varying vec3 vWNorm;
    void main(){
      vec3 N = normalize(vWNorm);
      vec3 V = normalize(cameraPosition - vWPos);
      vec3 L = normalize(uStar - vWPos);
      float rim = clamp(-dot(N, V) / 0.42, 0.0, 1.0);
      float k = pow(rim, 1.6);
      float nl = dot(N, L);
      float sun = smoothstep(-0.45, 0.4, nl);
      float sunset = smoothstep(-0.45, -0.05, nl) * (1.0 - smoothstep(-0.05, 0.35, nl));
      vec3 a = mix(uAtmo, vec3(1.0, 0.45, 0.2), sunset * 0.8);
      float forward = pow(max(dot(-V, L), 0.0), 5.0);   // anneau lumineux à contre-jour
      gl_FragColor = vec4(a * k * (sun * 1.3 + forward * 2.4) * uAtmoK, 1.0);
    }
  `;

  /* --- Anneaux planétaires : bandes, Cassini, ombre, diffusion avant ------ */
  const RING_VERT = /* glsl */ `
    varying vec3 vLocal;
    varying vec3 vWPos;
    varying vec3 vWN;
    void main(){
      vLocal = position;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWPos = wp.xyz;
      vWN = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0));
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `;
  const RING_FRAG = /* glsl */ `
    uniform float uIn;
    uniform float uOut;
    uniform float uSeed;
    uniform vec3 uA;
    uniform vec3 uB;
    uniform vec3 uStar;
    uniform vec3 uStarColor;
    uniform vec3 uPlanetPos;
    uniform float uPlanetR;
    varying vec3 vLocal;
    varying vec3 vWPos;
    varying vec3 vWN;
    ${NOISE}
    void main(){
      float r = length(vLocal.xy);
      float t = (r - uIn) / (uOut - uIn);
      if (t < 0.0 || t > 1.0) discard;
      float bands = snoise(vec3(t * 26.0, uSeed, 0.0)) * 0.5 + 0.5;
      float fine = snoise(vec3(t * 140.0, uSeed * 2.0, 1.0)) * 0.5 + 0.5;
      float a = smoothstep(0.0, 0.07, t) * (1.0 - smoothstep(0.86, 1.0, t)) * (0.25 + 0.75 * bands) * (0.55 + 0.45 * fine);
      a *= 1.0 - (1.0 - smoothstep(0.0, 0.018, abs(t - 0.63))) * 0.92;
      vec3 col = mix(uA, uB, bands);
      vec3 L = normalize(uStar - vWPos);
      vec3 V = normalize(cameraPosition - vWPos);
      vec3 toP = uPlanetPos - vWPos;
      float proj = dot(toP, L);
      float dperp = length(toP - L * proj);
      float shadow = proj > 0.0 ? smoothstep(uPlanetR * 0.92, uPlanetR * 1.04, dperp) : 1.0;
      // Face non éclairée vue par transparence + diffusion avant à contre-jour.
      float lit = sign(dot(vWN, L)) == sign(dot(vWN, V)) ? 1.0 : 0.35;
      float forward = pow(max(dot(-V, L), 0.0), 8.0) * 1.6;
      gl_FragColor = vec4(col * uStarColor * (0.04 + (lit + forward) * shadow), a * 0.9);
    }
  `;

  /* --- Photosphère d'étoile --------------------------------------------- */
  const STAR_FRAG = /* glsl */ `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uIntensity;
    uniform float uSpots;
    varying vec3 vObj;
    varying vec3 vWPos;
    varying vec3 vWNorm;
    ${NOISE}
    void main(){
      vec3 p = vObj * 2.4;
      float n = fbm(p + vec3(uTime * 0.035, uTime * 0.02, 0.0));
      float g = snoise(p * 7.0 + uTime * 0.22) * 0.5 + 0.5;
      float spots = smoothstep(0.5, 0.72, fbm3(p * 0.9 + 11.0 + uTime * 0.008)) * uSpots;
      vec3 N = normalize(vWNorm);
      vec3 V = normalize(cameraPosition - vWPos);
      float mu = clamp(dot(N, V), 0.0, 1.0);
      float limb = 0.42 + 0.58 * pow(mu, 0.5);
      vec3 hot = mix(uColor, vec3(1.0), 0.6);
      vec3 col = mix(uColor * 0.7, hot, n * 0.5 + 0.5) * (0.82 + 0.32 * g);
      col *= 1.0 - spots * 0.6;
      col *= limb;
      col += uColor * pow(1.0 - mu, 3.0) * 0.9;
      gl_FragColor = vec4(col * uIntensity, 1.0);
    }
  `;

  /* --- Couronne : billboard animé (jets, halo, protubérances au limbe) --- */
  const CORONA_VERT = /* glsl */ `
    uniform float uSize;
    varying vec2 vUv;
    void main(){
      vUv = position.xy / (uSize * 0.5);
      vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      mv.xy += position.xy * length(modelMatrix[0].xyz);
      gl_Position = projectionMatrix * mv;
    }
  `;
  const CORONA_FRAG = /* glsl */ `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uCore;
    uniform float uI;
    uniform float uSeed;
    varying vec2 vUv;
    ${NOISE}
    void main(){
      float r = length(vUv);
      if (r > 1.0) discard;
      vec2 dir = vUv / max(r, 1e-4);
      float x = max(r - uCore, 0.0) / (1.0 - uCore);              // 0 au limbe → 1 au bord
      float n1 = fbm3(vec3(dir * 2.2 + uSeed, uTime * 0.035) + vec3(0.0, 0.0, x * 1.3));
      float n2 = snoise(vec3(dir * 9.0 + uSeed, uTime * 0.1 + x * 3.0));
      float streamers = pow(clamp(n1 * 0.55 + 0.5 + n2 * 0.12, 0.0, 1.0), 3.0) * exp(-x * 5.0);
      float halo = exp(-x * 2.4) * 0.22 + exp(-x * 14.0) * 0.6;
      float prom = smoothstep(0.55, 0.85, snoise(vec3(dir * 4.0 + uSeed * 3.0, uTime * 0.06))) * exp(-x * 16.0);
      float edge = 1.0 - smoothstep(0.8, 1.0, r);
      vec3 c = uColor * (streamers * 1.7 + halo) + mix(uColor, vec3(1.0, 0.35, 0.2), 0.6) * prom * 1.6;
      gl_FragColor = vec4(c * edge * uI, 1.0);
    }
  `;

  /* --- Ciel lointain (cuit une fois dans une cubemap) --------------------- */
  const SKY_VERT = /* glsl */ `
    varying vec3 vDir;
    void main(){
      vDir = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const SKY_FRAG = /* glsl */ `
    uniform vec3 uBandN;
    varying vec3 vDir;
    ${NOISE}
    /* Galaxie lointaine floue (ellipse) dans la direction g. */
    float farGalaxy(vec3 d, vec3 g, vec3 up, float size){
      vec3 x = normalize(cross(g, up)), y = cross(x, g);
      vec2 q = vec2(dot(d, x), dot(d, y)) / size;
      return dot(d, g) > 0.0 ? exp(-dot(q * vec2(1.0, 2.6), q * vec2(1.0, 2.6)) * 3.0) : 0.0;
    }
    void main(){
      vec3 d = normalize(vDir);
      float lat = dot(d, uBandN);
      float band = exp(-lat * lat * 12.0);
      float core = exp(-lat * lat * 40.0);
      float n = fbm(d * 3.0);
      float n2 = fbm(d * 7.0 + 5.0);
      float clouds = smoothstep(0.1, 0.6, fbm(d * 11.0 + 2.0));        // nuages d'étoiles
      float dust = smoothstep(-0.05, 0.55, fbm(d * 5.5 + 2.0)) * exp(-lat * lat * 70.0);
      vec3 c = vec3(0.012, 0.014, 0.024);
      c += vec3(0.11, 0.12, 0.18) * band * (0.55 + 0.45 * n);
      c += vec3(0.2, 0.15, 0.11) * core * (0.5 + 0.5 * n2);
      c += vec3(0.16, 0.15, 0.17) * core * clouds * 0.6;
      c *= 1.0 - dust * 0.82;
      c += vec3(0.16, 0.03, 0.10) * smoothstep(0.3, 0.85, fbm(d * 1.8 + 9.0)) * 0.55;
      c += vec3(0.02, 0.09, 0.13) * smoothstep(0.35, 0.9, fbm(d * 2.2 + 21.0)) * 0.5;
      c += vec3(0.55, 0.5, 0.42) * farGalaxy(d, normalize(vec3(0.62, 0.55, -0.56)), vec3(0.0, 1.0, 0.2), 0.035) * 0.35;
      c += vec3(0.45, 0.48, 0.6) * farGalaxy(d, normalize(vec3(-0.7, -0.35, 0.62)), vec3(0.3, 1.0, 0.0), 0.025) * 0.3;
      c += vec3(0.55, 0.45, 0.4) * farGalaxy(d, normalize(vec3(0.1, -0.8, -0.58)), vec3(1.0, 0.2, 0.0), 0.02) * 0.25;
      gl_FragColor = vec4(c, 1.0);
    }
  `;

  /** ShaderMaterial (dérivées activées : nécessaires au relief au pixel en WebGL1). */
  function mat(opts) {
    return new THREE.ShaderMaterial(Object.assign({ extensions: { derivatives: true } }, opts));
  }

  PF.GLSL = {
    NOISE, SPHERE_VERT, PLANET_FRAG, CLOUD_FRAG, ATMO_FRAG,
    RING_VERT, RING_FRAG, STAR_FRAG, CORONA_VERT, CORONA_FRAG, SKY_VERT, SKY_FRAG, mat,
  };
})(window.PF = window.PF || {});
