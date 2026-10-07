/* =============================================================================
 * audio.js — Ambiance sonore 100 % générative (WebAudio, aucun fichier) :
 *   - nappe spatiale : quinte grave + vent cosmique filtré, qui respire ;
 *   - "whoosh" de l'hyperespace pendant les sauts ;
 *   - bips discrets au ciblage et à l'ouverture d'une fiche.
 * Coupé par défaut (on ne surprend pas un recruteur en open space) ;
 * le choix est mémorisé. PF.sfx(nom, durée) est un no-op si le son est coupé.
 * ========================================================================== */
(function (PF) {
  "use strict";
  const KEY = "pf-sound";

  class SpaceAudio {
    constructor(button) {
      this.btn = button;
      this.on = false;
      try { this.on = localStorage.getItem(KEY) === "on"; } catch (e) { /* stockage indisponible */ }
      this.ctx = null;
      button.addEventListener("click", () => this.toggle());
      this._render();
      PF.onLang(() => this._render());
      PF.sfx = (name, dur) => this.sfx(name, dur);
    }

    _render() {
      const fr = PF.lang === "fr";
      this.btn.innerHTML = `<span class="snd-bars${this.on ? " on" : ""}"><i></i><i></i><i></i></span><span class="chip-label">${fr ? "Son" : "Sound"}</span>`;
      this.btn.setAttribute("aria-pressed", String(this.on));
      this.btn.setAttribute("aria-label", fr ? "Activer / couper le son" : "Toggle sound");
    }

    /** À appeler depuis un geste utilisateur (clic "Entrer"). */
    resume() { if (this.on) this._ensure(); }

    toggle() {
      this.on = !this.on;
      try { localStorage.setItem(KEY, this.on ? "on" : "off"); } catch (e) { /* ignore */ }
      if (this.on) this._ensure();
      if (this.ctx) {
        const t = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.setTargetAtTime(this.on ? 0.9 : 0, t, 0.4);
      }
      this._render();
    }

    _ensure() {
      if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.gain.setTargetAtTime(0.9, ctx.currentTime, 1.2);
      const comp = ctx.createDynamicsCompressor();
      this.master.connect(comp).connect(ctx.destination);

      // Bruit blanc réutilisable.
      const len = ctx.sampleRate * 2;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

      // --- Nappe : quinte grave filtrée, cutoff qui respire ---
      const pad = ctx.createGain(); pad.gain.value = 0.05;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 380; lp.Q.value = 2;
      [[55, "sine", 0], [82.4, "sine", 3], [110.2, "triangle", -4], [164.8, "sine", 6]].forEach(([f, type, det], i) => {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det;
        const g = ctx.createGain(); g.gain.value = [1, 0.55, 0.35, 0.18][i];
        o.connect(g).connect(lp); o.start();
      });
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.045;
      const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 220;
      lfo.connect(lfoAmt).connect(lp.frequency); lfo.start();
      lp.connect(pad).connect(this.master);

      // --- Vent cosmique : bruit passe-bande, amplitude lente ---
      const wind = ctx.createBufferSource(); wind.buffer = this.noise; wind.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 420; bp.Q.value = 0.6;
      const wg = ctx.createGain(); wg.gain.value = 0.012;
      const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.07;
      const lfo2Amt = ctx.createGain(); lfo2Amt.gain.value = 0.008;
      lfo2.connect(lfo2Amt).connect(wg.gain); lfo2.start();
      wind.connect(bp).connect(wg).connect(this.master); wind.start();
    }

    sfx(name, dur = 1.5) {
      if (!this.on || !this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime;
      if (name === "warp") {
        const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
        const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4;
        bp.frequency.setValueAtTime(180, t);
        bp.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.5);
        bp.frequency.exponentialRampToValueAtTime(240, t + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.16, t + dur * 0.45);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(bp).connect(g).connect(this.master);
        src.start(t); src.stop(t + dur + 0.1);
        const sub = ctx.createOscillator(); sub.type = "sine";
        sub.frequency.setValueAtTime(70, t); sub.frequency.exponentialRampToValueAtTime(34, t + dur);
        const sg = ctx.createGain();
        sg.gain.setValueAtTime(0.0001, t);
        sg.gain.exponentialRampToValueAtTime(0.12, t + dur * 0.4);
        sg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        sub.connect(sg).connect(this.master); sub.start(t); sub.stop(t + dur + 0.1);
      } else {
        const notes = name === "open" ? [660, 990] : [1320];
        notes.forEach((f, i) => {
          const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
          const g = ctx.createGain(), t0 = t + i * 0.07;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(name === "open" ? 0.05 : 0.02, t0 + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
          o.connect(g).connect(this.master); o.start(t0); o.stop(t0 + 0.3);
        });
      }
    }
  }

  PF.SpaceAudio = SpaceAudio;
})(window.PF = window.PF || {});
