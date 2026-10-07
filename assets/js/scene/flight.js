/* =============================================================================
 * flight.js — Pilotage première personne. Le regard suit la souris (drag),
 * le déplacement se fait au clavier (ZQSD/flèches + Espace/Maj). Gère aussi
 * les "warps" : tween de position + slerp d'orientation vers une cible.
 * Distingue clic (action) et glissé (regard).
 * ========================================================================== */
(function (PF) {
  "use strict";
  const { U } = PF;

  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  class Flight {
    constructor(camera, dom) {
      this.cam = camera;
      this.dom = dom;
      this.pos = camera.position.clone();
      this.yaw = 0; this.pitch = 0;
      this.vel = new THREE.Vector3();
      this.maxSpeed = 720;
      this.enabled = false;
      this.keys = new Set();
      this.tween = null;
      this.onClick = () => {};
      // Visée au centre (NDC (0,0) sur desktop ; position du tap sur tactile).
      this.cursor = new THREE.Vector2(0, 0);
      // Souris précise → vraie visée FPS via Pointer Lock (souris capturée).
      this.useLook = matchMedia("(hover: hover) and (pointer: fine)").matches;
      this.lookSens = 0.0022;              // sensibilité souris
      this.locked = false;                 // souris capturée ?
      this.onLock = () => {};              // callback (UI) : (locked) => {}
      // Visée à la souris : près des bords de l'écran, la vue tourne (comme un FPS).
      this.steerInput = { x: 0, y: 0, active: false };
      this._sway = 0;                      // flottement "caméra à l'épaule" (0..1)
      this._swayQ = new THREE.Quaternion();
      this._swayE = new THREE.Euler();

      this._euler = new THREE.Euler(0, 0, 0, "YXZ");
      // Caméra temporaire : son lookAt oriente l'axe -Z vers la cible
      // (convention caméra), contrairement à un Object3D simple (+Z).
      this._tmp = new THREE.PerspectiveCamera();
      this._bind();
      this.sync();
    }

    /** Oriente le joueur instantanément vers une cible (init). */
    placeLookingAt(pos, target) {
      this.pos.copy(pos);
      const a = this._anglesTo(pos, target);
      this.yaw = a.yaw; this.pitch = a.pitch;
      this.sync();
    }

    _anglesTo(from, to) {
      this._tmp.position.copy(from);
      this._tmp.lookAt(to);
      const e = new THREE.Euler().setFromQuaternion(this._tmp.quaternion, "YXZ");
      return { yaw: e.y, pitch: e.x };
    }

    /**
     * Tween de vol vers `pos` en regardant `target`.
     * `warp` (0..1) = intensité de l'effet hyperespace pendant le trajet.
     */
    flyTo(pos, target, dur, onDone, warp = 0) {
      const fromQuat = this.cam.quaternion.clone();
      this._tmp.position.copy(pos); this._tmp.lookAt(target);
      this.vel.set(0, 0, 0);
      this.tween = {
        t: 0, dur, warp,
        fromPos: this.pos.clone(), toPos: pos.clone(),
        fromQuat, toQuat: this._tmp.quaternion.clone(),
        onDone: onDone || (() => {}),
      };
    }

    /** Progression du vol en cours (0..1), ou null. */
    get tweenT() { return this.tween ? this.tween.t : null; }

    /** Intensité hyperespace courante : monte puis redescend pendant le saut. */
    get warp() {
      if (!this.tween || !this.tween.warp) return 0;
      return Math.pow(Math.sin(Math.PI * this.tween.t), 1.6) * this.tween.warp;
    }

    _bind() {
      addEventListener("keydown", (e) => {
        if (!this.enabled) return;
        const k = e.key.toLowerCase();
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
        this.keys.add(k);
        if (k === "e" || k === "enter") this.onClick();
      });
      addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));
      addEventListener("blur", () => this.keys.clear());

      if (this.useLook) {
        // --- Desktop : visée FPS (Pointer Lock) ---
        document.addEventListener("pointerlockchange", () => {
          this.locked = document.pointerLockElement === this.dom;
          this.onLock(this.locked);
        });
        // Souris capturée : visée FPS. Sinon : glisser pour regarder, clic = action.
        document.addEventListener("mousemove", (e) => {
          if (!this.enabled) return;
          let k = 0;
          if (this.locked) k = this.lookSens;
          else if (this._drag) { k = 0.0032; this._drag.moved += Math.abs(e.movementX) + Math.abs(e.movementY); }
          if (!k) return;
          this.yaw -= e.movementX * k;
          this.pitch = U.clamp(this.pitch - e.movementY * k, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
        });
        this.dom.addEventListener("pointerdown", (e) => {
          if (this.enabled && !this.locked && e.button === 0) this._drag = { moved: 0 };
        });
        addEventListener("pointerup", () => {
          const d = this._drag; this._drag = null;
          if (this.enabled && !this.locked && d && d.moved < 6) this.onClick();
        });
        this.dom.addEventListener("click", () => {
          if (this.enabled && this.locked) this.onClick();   // capturé → clic = sélection
        });
      } else {
        // --- Tactile : glissé = rotation, tap = sélection ---
        let down = false, moved = 0, lx = 0, ly = 0;
        const SENS = 0.0026;
        this.dom.addEventListener("pointerdown", (e) => {
          if (!this.enabled) return;
          down = true; moved = 0; lx = e.clientX; ly = e.clientY;
        });
        addEventListener("pointermove", (e) => {
          if (!down) return;
          const dx = e.clientX - lx, dy = e.clientY - ly;
          lx = e.clientX; ly = e.clientY;
          moved += Math.abs(dx) + Math.abs(dy);
          this.yaw -= dx * SENS;
          this.pitch = U.clamp(this.pitch - dy * SENS, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
        });
        addEventListener("pointerup", () => {
          if (!down) return; down = false;
          if (this.enabled && moved < 10) this.onClick();
        });
      }

      // Molette = poussée avant/arrière.
      this.dom.addEventListener("wheel", (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        const f = this._forward();
        this.vel.addScaledVector(f, -e.deltaY * 1.4);
      }, { passive: false });
    }

    _forward() {
      this._euler.set(this.pitch, this.yaw, 0);
      return new THREE.Vector3(0, 0, -1).applyEuler(this._euler);
    }
    _right() {
      this._euler.set(0, this.yaw, 0);
      return new THREE.Vector3(1, 0, 0).applyEuler(this._euler);
    }

    /** Capture la souris pour la visée FPS (doit venir d'un geste utilisateur). */
    requestLook() {
      if (!this.useLook) return;
      try {
        const p = this.dom.requestPointerLock();
        if (p && p.catch) p.catch(() => {});   // refusé (iframe, sandbox…) : la visée reste au clic
      } catch (e) { /* ignore */ }
    }
    exitLook() { if (document.pointerLockElement) document.exitPointerLock(); }

    update(dt) {
      if (this.tween) {
        const tw = this.tween;
        tw.t = Math.min(tw.t + dt / tw.dur, 1);
        const e = easeInOut(tw.t);
        this.pos.lerpVectors(tw.fromPos, tw.toPos, e);
        // On s'oriente vers la cible plus vite qu'on ne s'y déplace (vol plus naturel).
        this.cam.quaternion.slerpQuaternions(tw.fromQuat, tw.toQuat, easeInOut(Math.min(1, tw.t * 1.6)));
        this.cam.position.copy(this.pos);
        if (tw.t >= 1) {
          const eu = new THREE.Euler().setFromQuaternion(this.cam.quaternion, "YXZ");
          this.yaw = eu.y; this.pitch = eu.x;
          tw.onDone(); this.tween = null;
        }
        return;
      }

      // (La rotation FPS est appliquée directement dans le handler mousemove.)
      // Bords de l'écran → la vue pivote, d'autant plus vite qu'on s'en approche.
      const st = this.steerInput;
      if (this.enabled && !this.locked && !this._drag && st.active) {
        const dz = (v, d) => { const a = Math.abs(v); return a < d ? 0 : Math.sign(v) * Math.pow((a - d) / (1 - d), 2); };
        this.yaw -= dz(st.x, 0.62) * 0.95 * dt;
        this.pitch = U.clamp(this.pitch + dz(st.y, 0.7) * 0.5 * dt, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
      }

      // Déplacement clavier.
      const k = this.keys;
      const dir = new THREE.Vector3();
      const fwd = this._forward(), right = this._right();
      if (k.has("z") || k.has("w") || k.has("arrowup")) dir.add(fwd);
      if (k.has("s") || k.has("arrowdown")) dir.sub(fwd);
      if (k.has("d") || k.has("arrowright")) dir.add(right);
      if (k.has("q") || k.has("a") || k.has("arrowleft")) dir.sub(right);
      if (k.has(" ")) dir.y += 1;
      if (k.has("shift") || k.has("control")) dir.y -= 1;

      if (dir.lengthSq() > 0) {
        dir.normalize();
        this.vel.addScaledVector(dir, this.maxSpeed * 4 * dt);
      }
      // Friction + clamp.
      const keep = Math.pow(0.0009, dt);
      this.vel.multiplyScalar(keep);
      if (this.vel.length() > this.maxSpeed) this.vel.setLength(this.maxSpeed);
      this.pos.addScaledVector(this.vel, dt);

      // Flottement léger quand on ne pilote pas : la scène ne paraît jamais figée.
      const still = this.vel.lengthSq() < 400 && !this._drag;
      this._sway = U.damp(this._sway, still ? 1 : 0, 0.05, dt);
      this.sync();
    }

    sync() {
      this.cam.position.copy(this.pos);
      this._euler.set(this.pitch, this.yaw, 0);
      this.cam.quaternion.setFromEuler(this._euler);
      if (this._sway > 0.001) {
        const t = performance.now() / 1000, k = this._sway;
        this._swayE.set(Math.sin(t * 0.37) * 0.0045 * k, Math.sin(t * 0.23 + 1.3) * 0.006 * k, Math.sin(t * 0.17) * 0.0025 * k);
        this.cam.quaternion.multiply(this._swayQ.setFromEuler(this._swayE));
      }
    }

    get speed01() { return Math.min(this.vel.length() / this.maxSpeed, 1); }
  }

  PF.Flight = Flight;
})(window.PF = window.PF || {});
