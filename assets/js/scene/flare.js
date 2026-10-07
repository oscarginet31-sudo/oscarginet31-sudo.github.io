/* =============================================================================
 * flare.js — Lens flare "objectif photo" en surimpression écran :
 *   - aigrette de diffraction à 6 branches (diaphragme hexagonal) sur la source ;
 *   - reflets internes (fantômes hexagonaux, anneaux) alignés entre la source
 *     et le centre de l'image, légèrement teintés comme des traitements anti-reflet.
 * L'intensité (visibilité, occultation par les planètes) est calculée par
 * l'application ; ce module ne fait que dessiner.
 * ========================================================================== */
(function (PF) {
  "use strict";

  const cache = {};
  function tex(key, size, draw) {
    if (cache[key]) return cache[key];
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    draw(cv.getContext("2d"), size);
    const t = new THREE.CanvasTexture(cv);
    t.minFilter = THREE.LinearFilter;
    return (cache[key] = t);
  }

  const soft = () => tex("soft", 128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  });

  const ring = () => tex("ring", 256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.72, "rgba(255,255,255,0.02)");
    g.addColorStop(0.86, "rgba(255,255,255,0.55)");
    g.addColorStop(0.93, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  });

  const hex = () => tex("hex", 128, (ctx, s) => {
    const c = s / 2, r = s * 0.44;
    const g = ctx.createRadialGradient(c, c, 0, c, c, r);
    g.addColorStop(0, "rgba(255,255,255,0.35)");
    g.addColorStop(0.8, "rgba(255,255,255,0.6)");
    g.addColorStop(1, "rgba(255,255,255,0.9)");
    ctx.fillStyle = g;
    ctx.shadowColor = "rgba(255,255,255,0.8)"; ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (i * Math.PI) / 3;
      ctx[i ? "lineTo" : "moveTo"](c + Math.cos(a) * r, c + Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
  });

  /** Aigrette : 6 branches fines (diffraction d'un diaphragme hexagonal). */
  const burst = () => tex("burst", 512, (ctx, s) => {
    const c = s / 2;
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.save();
      ctx.translate(c, c); ctx.rotate(a);
      const g = ctx.createLinearGradient(0, 0, c, 0);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(0.25, "rgba(255,255,255,0.25)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, -2.2); ctx.lineTo(c, 0); ctx.lineTo(0, 2.2); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    const g = ctx.createRadialGradient(c, c, 0, c, c, c * 0.22);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  });

  const WHITE = new THREE.Color("#ffffff");

  class LensFlare {
    constructor() {
      this.scene = new THREE.Scene();
      this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
      this.items = [];
      this.intensity = 0;
      const add = (map, t, size, alpha, tint) => {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({
          map, color: new THREE.Color(tint), transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
        }));
        sp.userData = { t, size, alpha, tint: new THREE.Color(tint) };
        this.scene.add(sp);
        this.items.push(sp);
      };
      // t = position le long de l'axe source → centre (0 = sur la source, 1 = centre, >1 = au-delà).
      add(burst(), 0, 0.62, 0.5, "#ffffff");
      add(soft(), 0, 0.2, 0.3, "#ffffff");
      add(hex(), 0.3, 0.045, 0.22, "#ffb070");
      add(ring(), 0.52, 0.19, 0.1, "#7fd0ff");
      add(hex(), 0.74, 0.032, 0.3, "#9cffb8");
      add(soft(), 1.0, 0.08, 0.12, "#c89bff");
      add(hex(), 1.24, 0.1, 0.13, "#7fb0ff");
      add(ring(), 1.58, 0.44, 0.06, "#ffd2a0");
      add(hex(), 1.92, 0.055, 0.16, "#ff9aa8");
    }

    /**
     * @param ndc    position écran de la source (-1..1)
     * @param k      intensité 0..1 (visibilité × occultation)
     * @param color  teinte de l'étoile
     * @param aspect largeur / hauteur de l'écran
     */
    update(ndc, k, color, aspect) {
      this.intensity = k;
      if (k < 0.005) return;
      if (this.cam.right !== aspect) {
        this.cam.left = -aspect; this.cam.right = aspect; this.cam.updateProjectionMatrix();
      }
      for (const sp of this.items) {
        const { t, size, alpha, tint } = sp.userData;
        sp.position.set(ndc.x * (1 - t) * aspect, ndc.y * (1 - t), 0);
        sp.scale.set(size * 2, size * 2, 1);
        sp.material.opacity = alpha * k;
        if (t === 0) sp.material.color.copy(color).lerp(WHITE, 0.55);
        else sp.material.color.copy(tint);
      }
      // L'aigrette tourne légèrement quand la source se déplace dans le cadre.
      this.items[0].material.rotation = ndc.x * 0.25;
    }

    render(renderer) {
      if (this.intensity < 0.005) return;
      const ac = renderer.autoClear;
      renderer.autoClear = false;
      renderer.render(this.scene, this.cam);
      renderer.autoClear = ac;
    }
  }

  PF.LensFlare = LensFlare;
})(window.PF = window.PF || {});
