/* =============================================================================
 * post.js — Pipeline de rendu "cinéma" :
 *   scène HDR (half-float, MSAA) → bloom → passe finale (exposition
 *   automatique, compression des hautes lumières, aberration chromatique,
 *   flou radial en hyperespace, vignette, grain) → interface 3D nette
 *   (labels) → lens flare, par-dessus, sans bloom.
 * Repli automatique sur un rendu direct si les modules de post-traitement
 * n'ont pas pu être chargés (hors ligne, CDN bloqué…).
 * ========================================================================== */
(function (PF) {
  "use strict";

  const FINAL = {
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uWarp: { value: 0 },
      uExposure: { value: 1 },
      uRes: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse; uniform float uTime; uniform float uWarp; uniform float uExposure; uniform vec2 uRes;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      vec3 softClip(vec3 c){
        vec3 k = vec3(0.8);
        vec3 over = max(c - k, 0.0);
        return min(c, k) + (1.0 - k) * (1.0 - exp(-over / (1.0 - k)));
      }
      void main(){
        vec2 c = vUv - 0.5;
        float ca = 0.0014 + uWarp * 0.014;
        vec3 col;
        col.r = texture2D(tDiffuse, vUv - c * ca).r;
        col.g = texture2D(tDiffuse, vUv).g;
        col.b = texture2D(tDiffuse, vUv + c * ca).b;
        if (uWarp > 0.02) {
          vec3 acc = col;
          for (int i = 1; i < 7; i++) acc += texture2D(tDiffuse, vUv - c * float(i) * 0.016 * uWarp).rgb;
          col = acc / 7.0;
        }
        col = softClip(col * uExposure);
        float v = 1.0 - smoothstep(0.28, 0.9, length(c * vec2(1.0, 0.82)));
        col *= mix(0.5, 1.0, v);
        col += (hash(vUv * uRes + fract(uTime * 7.0)) - 0.5) * 0.02;
        gl_FragColor = vec4(col, 1.0);
      }`,
  };

  class Post {
    constructor(renderer, scene, camera) {
      this.renderer = renderer; this.scene = scene; this.camera = camera;
      this.ok = !!(THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass && THREE.ShaderPass);
      if (!this.ok) { camera.layers.enable(PF.F.UI_LAYER); return; }

      const gl2 = renderer.capabilities.isWebGL2;
      const hdr = gl2 && !!renderer.extensions.get("EXT_color_buffer_float");
      const params = {
        minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat,
        type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType,
      };
      const size = renderer.getDrawingBufferSize(new THREE.Vector2());
      let rt;
      if (gl2 && THREE.WebGLMultisampleRenderTarget) {
        rt = new THREE.WebGLMultisampleRenderTarget(size.x, size.y, params);
        rt.samples = PF.Cosmos.Q.low ? 2 : 4;
      } else {
        rt = new THREE.WebGLRenderTarget(size.x, size.y, params);
      }
      this.composer = new THREE.EffectComposer(renderer, rt);
      this.composer.addPass(new THREE.RenderPass(scene, camera));
      this.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), 1.0, 0.62, 0.88);
      this.composer.addPass(this.bloom);
      this.final = new THREE.ShaderPass(FINAL);
      this.composer.addPass(this.final);
    }

    setSize(w, h, pr) {
      if (!this.ok) return;
      this.composer.setPixelRatio(pr);
      this.composer.setSize(w, h);
      this.final.uniforms.uRes.value.set(w * pr, h * pr);
    }

    /**
     * @param exposure exposition (1 = neutre, <1 quand on regarde une étoile)
     * @param overlay  rendu final par-dessus tout (lens flare)
     */
    render(dt, warp, exposure = 1, overlay = null) {
      const { renderer, scene, camera } = this;
      if (!this.ok) { renderer.render(scene, camera); if (overlay) overlay(renderer); return; }
      this.final.uniforms.uTime.value += dt;
      this.final.uniforms.uWarp.value = warp;
      this.final.uniforms.uExposure.value = exposure;
      this.bloom.strength = (1.0 + warp * 0.8) * Math.pow(exposure, 1.5);
      this.composer.render(dt);

      // Interface 3D (labels, marqueurs) : nette, sans bloom, sans fond.
      const bg = scene.background;
      scene.background = null;
      renderer.autoClear = false;
      camera.layers.set(PF.F.UI_LAYER);
      renderer.render(scene, camera);
      camera.layers.set(0);
      renderer.autoClear = true;
      scene.background = bg;
      if (overlay) overlay(renderer);
    }
  }

  PF.Post = Post;
})(window.PF = window.PF || {});
