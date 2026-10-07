/* =============================================================================
 * terminal.js — Console cachée façon Quake (touche « / » ou bouton >_) :
 * on pilote la galaxie en ligne de commande. Clin d'œil cyber assumé :
 * nmap, ping, neofetch, sudo… Historique (↑ ↓) et complétion (Tab).
 * ========================================================================== */
(function (PF) {
  "use strict";
  const C = PF.CONTENT;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const L = (fr, en) => (PF.lang === "fr" ? fr : en);

  /** Alias acceptés pour chaque système (index, id, libellés FR/EN). */
  const SYS_ALIASES = {
    skills: ["skills", "competences", "competence", "comp"],
    experience: ["experience", "parcours", "path", "xp", "formation"],
    projects: ["projects", "projets", "projet", "proj"],
    engagement: ["engagement", "engagements", "beyond", "reserve"],
    contact: ["contact", "mail"],
  };

  class Terminal {
    /** @param api { app, tour, audio, openPlanet(p), openCore() } */
    constructor(api) {
      this.api = api;
      this.isOpen = false;
      this.hist = []; this.hi = 0;
      const el = this.el = document.createElement("section");
      el.id = "term";
      el.className = "term";
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = `
        <div class="term-out" role="log" aria-live="polite"></div>
        <label class="term-line">
          <span class="term-ps">oscar@galaxie:~$</span>
          <input class="term-in" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Terminal">
        </label>`;
      document.body.appendChild(el);
      this.out = el.querySelector(".term-out");
      this.input = el.querySelector(".term-in");
      el.addEventListener("pointerdown", (e) => { if (e.target === el || e.target === this.out) setTimeout(() => this.input.focus()); });

      // Ouverture « / » ; à l'intérieur : Entrée, Échap, ↑ ↓, Tab (capture : avant le pilotage).
      addEventListener("keydown", (e) => {
        const typing = /^(input|textarea)$/i.test(document.activeElement.tagName) && document.activeElement !== this.input;
        if (!this.isOpen) {
          if ((e.key === "/" || e.key === "²") && !typing && document.body.classList.contains("hud-on")) {
            e.preventDefault(); e.stopImmediatePropagation(); this.toggle(true);
          }
          return;
        }
        if (e.key === "Escape") { this.toggle(false); }
        else if (e.key === "Enter") { const v = this.input.value; this.input.value = ""; this.run(v); }
        else if (e.key === "ArrowUp") { this._histMove(-1); }
        else if (e.key === "ArrowDown") { this._histMove(1); }
        else if (e.key === "Tab") { this._complete(); }
        else { e.stopImmediatePropagation(); return; }     // frappe normale : ne pilote pas le vaisseau
        e.preventDefault(); e.stopImmediatePropagation();
      }, true);

      this._greeted = false;
    }

    toggle(v = !this.isOpen) {
      if (v === this.isOpen) return;
      this.isOpen = v;
      this.el.classList.toggle("open", v);
      this.el.setAttribute("aria-hidden", String(!v));
      const app = this.api.app;
      if (v) {
        this._flight = app.flight.enabled;
        app.enableFlight(false); app.flight.exitLook();
        if (!this._greeted) { this._greeted = true; this._banner(); }
        setTimeout(() => this.input.focus(), 50);
        PF.sfx && PF.sfx("blip");
      } else {
        this.input.blur();
        if (this._flight && !this.api.card.current) app.enableFlight(true);
      }
    }

    print(html, cls = "") {
      const line = document.createElement("div");
      line.className = "tl " + cls;
      line.innerHTML = html;
      this.out.appendChild(line);
      this.out.scrollTop = this.out.scrollHeight;
    }

    _banner() {
      this.print(`<span class="t-acc">Galaxie OS 1.0</span> — ${esc(L("terminal du portfolio d’Oscar Ginet", "Oscar Ginet’s portfolio terminal"))}`);
      this.print(esc(L("Tapez help pour la liste des commandes. Échap pour fermer.", "Type help for the list of commands. Esc to close.")), "t-dim");
    }

    /* --- Exécution ------------------------------------------------------ */
    run(raw) {
      const line = raw.trim();
      this.print(`<span class="t-ps">oscar@galaxie:~$</span> ${esc(line)}`, "t-echo");
      if (!line) return;
      this.hist.push(line); this.hi = this.hist.length;
      const [cmd0, ...args] = line.split(/\s+/);
      const cmd = norm(cmd0), arg = args.join(" ");
      const fn = this.cmds()[cmd];
      if (fn) fn.call(this, arg, args);
      else this.print(esc(L(`commande introuvable : ${cmd0}. Tapez help.`, `command not found: ${cmd0}. Type help.`)), "t-err");
    }

    cmds() {
      const help = () => {
        const rows = [
          ["help", L("cette aide", "this help")],
          ["whoami", L("qui suis-je", "who am I")],
          ["ls", L("lister les systèmes", "list star systems")],
          ["goto <n|nom>", L("sauter vers un système (ex. goto projets)", "jump to a system (e.g. goto projects)")],
          ["open <texte>", L("ouvrir une fiche (ex. open veeam)", "open a card (e.g. open veeam)")],
          ["home", L("retour à la vue galaxie", "back to galaxy view")],
          ["tour", L("lancer la visite guidée", "start the guided tour")],
          ["cv", L("télécharger le CV", "download the resume")],
          ["contact", L("afficher et copier mon email", "show and copy my email")],
          ["linkedin", L("ouvrir mon profil LinkedIn", "open my LinkedIn profile")],
          ["classic", L("passer au mode classique", "switch to classic mode")],
          ["lang fr|en · theme · sound", L("réglages", "settings")],
          ["nmap · ping · neofetch", L("à vous de voir…", "try them…")],
          ["clear · exit", L("effacer · fermer", "clear · close")],
        ];
        this.print(rows.map(([c, d]) => `<span class="t-cmd">${esc(c)}</span><span class="t-dim">${esc(d)}</span>`).join("<br>"), "t-help");
      };
      const goto = (arg) => {
        const sys = this._findSystem(arg);
        if (!sys) return this.print(esc(L(`système inconnu : ${arg || "?"} — essayez ls`, `unknown system: ${arg || "?"} — try ls`)), "t-err");
        this.print(esc(L(`Saut hyperespace vers ${PF.tx(sys.def.label)}…`, `Hyperspace jump to ${PF.tx(sys.def.label)}…`)), "t-ok");
        this.api.app.travelTo(sys);
        this.toggle(false);
      };
      const open = (arg) => {
        if (!arg) return this.print(esc(L("usage : open <texte>", "usage: open <text>")), "t-err");
        if (/^(oscar|moi|me|about|a propos|apropos)$/.test(norm(arg))) { this.toggle(false); return this.api.openCore(); }
        const hits = this._findPlanets(arg);
        if (!hits.length) return this.print(esc(L(`aucune fiche ne correspond à « ${arg} »`, `no card matches “${arg}”`)), "t-err");
        if (hits.length > 1 && norm(PF.tx(hits[0].body.short || hits[0].body.name)) !== norm(arg)) {
          this.print(esc(L("Plusieurs résultats, je prends le premier :", "Several matches, opening the first one:")), "t-dim");
          this.print(hits.slice(0, 5).map((p) => `· ${esc(PF.tx(p.body.name))} <span class="t-dim">(${esc(PF.tx(p.system.def.label))})</span>`).join("<br>"));
        }
        this._openPlanet(hits[0]);
      };
      const sudo = (arg) => {
        if (/^(hire|embaucher|recruter)\s+oscar/.test(norm(arg))) {
          this.print(esc(L("[sudo] mot de passe pour recruteur : ********", "[sudo] password for recruiter: ********")), "t-dim");
          setTimeout(() => {
            this.print(esc(L("✔ Accès accordé. Ouverture du canal de contact…", "✔ Access granted. Opening the contact channel…")), "t-ok");
            const sys = this.api.app.galaxy.systems.find((s) => s.id === "contact");
            setTimeout(() => this._openPlanet(sys.planets[0]), 700);
          }, 650);
        } else {
          this.print(esc(L("oscar n’est pas dans le fichier sudoers. Cet incident sera signalé.", "oscar is not in the sudoers file. This incident will be reported.")), "t-err");
          this.print(esc(L("Astuce : sudo hire oscar", "Hint: sudo hire oscar")), "t-dim");
        }
      };
      return {
        help, aide: help, "?": help,
        whoami: () => {
          const id = C.identity;
          this.print(`<span class="t-acc">${esc(id.name)}</span> — ${esc(PF.tx(id.role))}`);
          this.print(esc(PF.tx(id.headline)), "t-dim");
        },
        ls: () => this.api.app.galaxy.systems.forEach((s, i) =>
          this.print(`<span class="t-cmd">${i + 1}</span> ${esc(PF.tx(s.def.label))} <span class="t-dim">· ${s.planets.length} ${L("planètes", "planets")}</span>`)),
        goto, cd: (arg) => (/^(~|\.\.|\/)$/.test(arg) ? this._home() : goto(arg)),
        open, cat: open,
        home: () => this._home(),
        tour: () => { this.toggle(false); this.api.tour.start(); },
        visite: () => { this.toggle(false); this.api.tour.start(); },
        cv: () => {
          const a = document.createElement("a");
          a.href = PF.t("cv.file"); a.download = ""; document.body.appendChild(a); a.click(); a.remove();
          this.print(esc(L(`Téléchargement de ${PF.t("cv.file")}…`, `Downloading ${PF.t("cv.file")}…`)), "t-ok");
        },
        contact: () => this._contact(), mail: () => this._contact(), email: () => this._contact(),
        linkedin: () => {
          window.open(C.contact.links[2].href, "_blank", "noopener");
          this.print(esc(L("Ouverture de LinkedIn…", "Opening LinkedIn…")), "t-ok");
        },
        classic: () => { location.href = "classic.html"; },
        lang: (arg) => {
          const l = norm(arg) === "en" ? "en" : norm(arg) === "fr" ? "fr" : (PF.lang === "fr" ? "en" : "fr");
          PF.setLang(l); this.print(l === "fr" ? "Langue : français" : "Language: English", "t-ok");
        },
        theme: () => { PF.toggleTheme(); this.print(esc(L("Thème basculé.", "Theme toggled.")), "t-ok"); },
        sound: () => { this.api.audio.toggle(); this.print(esc(this.api.audio.on ? L("Son activé.", "Sound on.") : L("Son coupé.", "Sound off.")), "t-ok"); },
        son: () => this.cmds().sound(),
        history: () => this.print(this.hist.map((h, i) => `<span class="t-dim">${i + 1}</span> ${esc(h)}`).join("<br>")),
        date: () => this.print(esc(new Date().toLocaleString(PF.lang === "fr" ? "fr-FR" : "en-GB"))),
        ping: (arg) => {
          const host = arg || "oscar";
          const lines = [0, 1, 2].map((i) => `64 bytes from ${esc(host)} (10.0.0.42): icmp_seq=${i + 1} ttl=64 time=${(0.3 + Math.random() * 0.3).toFixed(2)} ms`);
          this.print(`PING ${esc(host)} (10.0.0.42) 56(84) bytes of data.<br>${lines.join("<br>")}`);
          this.print(esc(L("--- oscar répond en moins de 48 h ---", "--- oscar replies within 48 h ---")), "t-ok");
        },
        nmap: (arg) => {
          const ports = [["22/tcp", "ssh", "skills"], ["80/tcp", "http", "experience"], ["443/tcp", "https", "projects"], ["8080/tcp", "http-alt", "engagement"], ["25/tcp", "smtp", "contact"]];
          const sys = (id) => PF.tx(this.api.app.galaxy.systems.find((s) => s.id === id).def.label);
          this.print(`Starting Nmap 7.95 ( https://nmap.org )<br>Nmap scan report for ${esc(arg || "galaxie.oscar")}`);
          this.print(`<span class="t-dim">PORT       STATE  SERVICE    →</span><br>` + ports.map(([p, s, id]) =>
            `${p.padEnd(10, " ")} <span class="t-ok">open</span>   ${s.padEnd(10, " ")} ${esc(sys(id))}`).join("<br>"));
          this.print(esc(L("Nmap terminé : 5 ports ouverts. Essayez goto <port>… ou plutôt goto projets.", "Nmap done: 5 open ports. Try goto projects.")), "t-dim");
        },
        neofetch: () => {
          const id = C.identity;
          const art = ["   .  *  .", " *  ◉══◯  ", "  ◯   ◉ * ", " .  ◉══◯ .", "   *  .   "];
          const info = [
            `<span class="t-acc">oscar</span>@<span class="t-acc">galaxie</span>`,
            `OS: Galaxie 3D (Three.js r128)`,
            `${L("Poste", "Role")}: ${esc(PF.tx(id.role))}`,
            `${L("Entreprise", "Company")}: Lamberet SAS`,
            `${L("Formation", "Studies")}: BUT R&T ${L("Cybersécurité", "Cybersecurity")} · IUT ${L("d’Annecy", "Annecy")}`,
            `Stack: AD · Proxmox · VMware · Veeam · Zabbix · Vision One`,
            `Uptime: ${L("2 ans d’alternance", "2 years of apprenticeship")}`,
          ];
          this.print(`<div class="t-neo"><pre>${art.join("\n")}</pre><div>${info.join("<br>")}</div></div>`);
        },
        sudo,
        rm: (arg) => this.print(esc(/-rf/.test(arg) ? L("Bien essayé. Le SOC a été notifié.", "Nice try. The SOC has been notified.") : L("rm : opération refusée.", "rm: operation not permitted.")), "t-err"),
        clear: () => { this.out.innerHTML = ""; }, cls: () => { this.out.innerHTML = ""; },
        exit: () => this.toggle(false), quit: () => this.toggle(false), q: () => this.toggle(false),
      };
    }

    /* --- Outils ----------------------------------------------------------- */
    _home() { this.print(esc(L("Retour à la vue galaxie…", "Back to galaxy view…")), "t-ok"); this.api.app.exitSystem(); this.toggle(false); }

    _contact() {
      const mail = C.contact.email;
      this.print(`EMAIL   <a href="mailto:${esc(mail)}">${esc(mail)}</a><br>${L("TÉL", "PHONE")}     ${esc(C.contact.links[1].value)}<br>LINKEDIN <a href="${esc(C.contact.links[2].href)}" target="_blank" rel="noopener">/in/oscar-ginet</a>`);
      if (navigator.clipboard) navigator.clipboard.writeText(mail).then(() => this.print(esc(L("✔ Email copié dans le presse-papiers.", "✔ Email copied to clipboard.")), "t-ok"), () => {});
    }

    _findSystem(arg) {
      const a = norm(arg), systems = this.api.app.galaxy.systems;
      if (/^[1-9]$/.test(a)) return systems[+a - 1];
      return systems.find((s) => (SYS_ALIASES[s.id] || []).some((x) => x === a || (a.length > 2 && x.startsWith(a))));
    }

    _findPlanets(arg) {
      const a = norm(arg), hits = [];
      for (const s of this.api.app.galaxy.systems) for (const p of s.planets) {
        const hay = norm(PF.tx(p.body.name) + " " + PF.tx(p.body.short || "") + " " + (p.body.tags || []).map(PF.tx).join(" "));
        if (hay.includes(a)) hits.push(p);
      }
      return hits;
    }

    /** Saute vers le système de la planète si besoin, puis ouvre sa fiche. */
    _openPlanet(p) {
      const app = this.api.app;
      this.toggle(false);
      if (app.mode === "system" && app.activeSystem === p.system) { this.api.openPlanet(p); return; }
      app.travelTo(p.system);
      const t0 = performance.now();
      const wait = () => {
        if (app.mode === "system" && app.activeSystem === p.system && !app.warping) this.api.openPlanet(p);
        else if (performance.now() - t0 < 8000) setTimeout(wait, 120);
      };
      wait();
    }

    _histMove(d) {
      if (!this.hist.length) return;
      this.hi = Math.max(0, Math.min(this.hist.length, this.hi + d));
      this.input.value = this.hist[this.hi] || "";
    }

    _complete() {
      const v = this.input.value, parts = v.split(/\s+/);
      if (parts.length === 1) {
        const names = Object.keys(this.cmds()).filter((c) => c.startsWith(norm(v)));
        if (names.length === 1) this.input.value = names[0] + " ";
        else if (names.length > 1) this.print(names.join("  "), "t-dim");
      } else if (/^(goto|cd)$/.test(norm(parts[0]))) {
        const a = norm(parts.slice(1).join(" "));
        const opts = this.api.app.galaxy.systems.map((s) => norm(PF.tx(s.def.label))).filter((x) => x.startsWith(a));
        if (opts.length === 1) this.input.value = parts[0] + " " + opts[0];
        else if (opts.length > 1) this.print(opts.join("  "), "t-dim");
      }
    }
  }

  PF.Terminal = Terminal;
})(window.PF = window.PF || {});
