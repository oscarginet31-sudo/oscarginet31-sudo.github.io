/* =============================================================================
 * main3d.js — Point d'entrée de l'expérience galaxie 3D. Assemblage uniquement.
 * ========================================================================== */
(function (PF) {
  "use strict";
  const FOUND_KEY = "pf-found";

  function boot() {
    const fail = (msg) => {
      document.getElementById("intro").innerHTML =
        '<p style="font-family:monospace;max-width:420px;text-align:center;line-height:1.6">' + msg +
        ' <a href="classic.html" style="color:#d08651">→ Mode classique</a></p>';
    };
    if (typeof THREE === "undefined") { fail("Three.js n'a pas pu se charger (connexion requise)."); return; }

    let app;
    try { app = new PF.SpaceApp(document.getElementById("scene")); }
    catch (e) { console.error(e); fail("La galaxie 3D n'a pas pu démarrer sur cet appareil (WebGL indisponible ou chargement incomplet)."); return; }

    const hud = new PF.Hud3D();
    const card = new PF.InfoCard(document.getElementById("card"));
    const audio = new PF.SpaceAudio(document.getElementById("btn-sound"));

    // --- Découvertes (mémorisées entre les visites) ---
    let found = new Set();
    try { found = new Set(JSON.parse(localStorage.getItem(FOUND_KEY) || "[]")); } catch (e) { /* ignore */ }
    const total = app.galaxy.planetCount;
    const refreshFound = () => hud.setDiscovered(found.size, total);
    const discover = (planet) => {
      const k = planet.system.id + ":" + planet.index;
      if (found.has(k)) return;
      found.add(k);
      try { localStorage.setItem(FOUND_KEY, JSON.stringify([...found])); } catch (e) { /* ignore */ }
      refreshFound();
    };
    refreshFound();

    // --- Monde ↔ UI ---
    app.onTarget = (info) => { hud.setTarget(info); if (info) PF.sfx("blip"); };
    app.onMode = (mode, sys) => hud.setMode(mode, sys);
    app.onPointers = (list) => hud.updatePointers(list);
    app.onFrame = (dt, aim) => hud.frame(dt, aim);       // le viseur suit la souris / la cible
    app.onFire = (hit) => hud.fire(hit);
    app.flight.onLock = (locked) => hud.setLooking(locked);

    // Ouvrir une fiche → on relâche la souris pour pouvoir interagir avec.
    let wasLocked = false;
    const openCard = (fn) => {
      wasLocked = app.flight.locked;
      app.enableFlight(false); app.flight.exitLook(); fn(); PF.sfx("open");
    };
    app.onOpenPlanet = (planet) => openCard(() => { card.open(planet); discover(planet); });
    app.onOpenCore = () => openCard(() => card.openCore());
    card.onClose = () => { app.enableFlight(true); if (wasLocked) app.flight.requestLook(); };

    hud.onBack = () => app.exitSystem();
    hud.onHome = () => app.exitSystem();
    hud.onTravel = (i) => app.travelTo(app.galaxy.systems[i]);

    PF.onTheme((dark) => app.setTheme(dark));
    PF.onLang(() => { app.relabel(); hud.setMode(app.mode, app.activeSystem); });

    // Visite guidée + terminal caché.
    const tour = new PF.Tour(app, card, { planet: (p) => app.onOpenPlanet(p), core: () => app.onOpenCore() });
    const term = new PF.Terminal({ app, tour, card, audio, openPlanet: (p) => app.onOpenPlanet(p), openCore: () => app.onOpenCore() });
    hud.onTour = () => tour.start();
    document.getElementById("btn-term").addEventListener("click", () => term.toggle());
    addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "t" && !e.metaKey && !e.ctrlKey && !term.isOpen && !tour.active &&
          document.body.classList.contains("hud-on") && !card.current) tour.start();
    });

    // Intro → démarrage (ou visite guidée directe).
    const intro = new PF.Intro3D(() => {
      audio.resume();
      hud.show(true);
      app.enableFlight(true);
      hud.setLooking(false);
    }, () => tour.start());
    app.start();   // la galaxie tourne déjà derrière l'intro

    PF.app3d = { app, hud, card, intro, audio, tour, term };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window.PF = window.PF || {});
