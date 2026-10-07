/* =============================================================================
 * diagrams.js — Schémas d'architecture des projets (SVG en ligne, bilingues,
 * colorés par les variables CSS du thème). Volontairement simplifiés et
 * ANONYMISÉS : aucun nom de serveur, d'adresse IP ni de chemin interne.
 *   PF.diagram(id) → chaîne SVG (ad | edr | backup | monitoring)
 *
 * Chaque schéma existe en deux mises en page : « wide » (640 de large) et
 * « tall » (300 de large, en colonne, pour mobile). Le CSS affiche la bonne
 * selon la largeur réelle du cadre (requête de conteneur sur .diagram-fig).
 * Toutes les bulles sont dimensionnées pour leur texte le plus long (FR et EN).
 * ========================================================================== */
(function (PF) {
  "use strict";
  const L = (fr, en) => (PF.lang === "en" ? en : fr);
  const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));

  /* --- Primitives -------------------------------------------------------- */
  const box = (x, y, w, h, title, subs = [], cls = "") => {
    const cx = x + w / 2, lines = [].concat(subs).filter(Boolean);
    const top = y + h / 2 - (lines.length * 13) / 2 + 4;
    return `<g class="d-node ${cls}"><rect class="d-b" x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/>` +
      `<text class="d-t" x="${cx}" y="${top}" text-anchor="middle">${esc(title)}</text>` +
      lines.map((s, i) => `<text class="d-s" x="${cx}" y="${top + 15 + i * 13}" text-anchor="middle">${esc(s)}</text>`).join("") + `</g>`;
  };
  const line = (x1, y1, x2, y2, id, cls = "", both = false) =>
    `<line class="d-l ${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${id ? ` marker-end="url(#${id})"` : ""}${both ? ` marker-start="url(#${id}-s)"` : ""}/>`;
  const path = (d, id, cls = "") => `<path class="d-l ${cls}" d="${d}"${id ? ` marker-end="url(#${id})"` : ""}/>`;
  const text = (x, y, s, cls = "d-s", anchor = "middle") => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${esc(s)}</text>`;
  /** Note de bas de schéma, sur une ou plusieurs lignes. */
  const note = (x, y, lines) => [].concat(lines).map((s, i) => text(x, y + i * 14, s, "d-n")).join("");
  const lock = (x, y) => `<g class="d-lockicon" transform="translate(${x} ${y})"><rect x="0" y="7" width="14" height="11" rx="2"/><path d="M3 7V4a4 4 0 0 1 8 0v3" fill="none"/></g>`;
  const svg = (id, v, w, h, label, body) =>
    `<svg class="diagram d-${v}" data-v="${v}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">` +
    `<title>${esc(label)}</title><defs>` +
    `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="d-m" d="M0 0L10 5L0 10z"/></marker>` +
    `<marker id="${id}-s" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="d-m" d="M10 0L0 5L10 10z"/></marker>` +
    `</defs>${body}</svg>`;

  /* --- Active Directory : avant / après ---------------------------------- */
  const AD = () => ({
    label: L("Schéma : Active Directory avant et après la migration", "Diagram: Active Directory before and after the migration"),
    before: L("AVANT", "BEFORE"), after: L("APRÈS", "AFTER"),
    dc: L("DC unique", "Single DC"), spof: L("⚠ point de défaillance unique", "⚠ single point of failure"),
    sites: [L("Site 1", "Site 1"), L("Site 2", "Site 2"), L("Sites 3–7", "Sites 3–7")],
    siteSubs: [L("DHCP local", "local DHCP"), "NAS / switch"],
    auth: L("authentification AD", "AD authentication"),
    oldNote: L("DHCP éparpillé, un seul contrôleur", "Scattered DHCP, a single controller"),
    dc1: [L("WS 2025 · nouveau", "WS 2025 · new")], dc2: [L("redondance", "redundancy")],
    repl: L("réplication AD · DNS", "AD · DNS replication"),
    band: L("Failover DHCP 50/50 · 11 étendues", "DHCP failover 50/50 · 11 scopes"),
    relay: L("7 sites · relais DHCP sur les routeurs", "7 sites · DHCP relay on the routers"),
    newNote: L("Annuaire redondant, DHCP centralisé", "Redundant directory, centralized DHCP"),
  });

  function adWide() {
    const id = "arw-ad", c = AD();
    const sites = Array.from({ length: 7 }, (_, i) => {
      const x = 346 + i * 42;
      return box(x, 214, 36, 36, "S" + (i + 1), [], "d-small") + line(x + 18, 186, x + 18, 212, id, "d-thin");
    }).join("");
    return svg(id, "wide", 640, 300, c.label,
      text(18, 22, c.before, "d-h", "start") + text(342, 22, c.after, "d-h", "start") +
      `<line class="d-sep" x1="320" y1="10" x2="320" y2="290"/>` +
      // Avant : les sites remontent vers un DC unique (bus en pointillés)
      box(60, 40, 180, 50, c.dc, ["Windows Server 2016"], "d-warn") + text(150, 34, c.spof, "d-w") +
      [10, 106, 202].map((x, i) => box(x, 196, 88, 56, c.sites[i], c.siteSubs) + line(x + 44, 196, x + 44, 172, "", "d-dash")).join("") +
      line(54, 172, 246, 172, "", "d-dash") + line(150, 172, 150, 94, id, "d-dash") +
      text(158, 138, c.auth, "d-s", "start") +
      text(150, 282, c.oldNote, "d-n") +
      // Après : deux DC répliqués, DHCP en failover, relais sur les 7 sites
      box(345, 40, 120, 50, "DC-01", c.dc1, "d-key") + box(515, 40, 120, 50, "DC-02", c.dc2, "d-key") +
      line(469, 66, 511, 66, id, "", true) + text(490, 34, c.repl, "d-xs") +
      `<g class="d-band"><rect x="345" y="104" width="290" height="26" rx="13"/></g>` +
      text(490, 121, c.band, "d-t d-acc-t") +
      line(490, 130, 490, 186) + line(364, 186, 616, 186) +
      sites + text(490, 270, c.relay, "d-s") + text(490, 288, c.newNote, "d-n"));
  }

  function adTall() {
    const id = "arw-ad-t", c = AD();
    const sites = Array.from({ length: 7 }, (_, i) => {
      const x = 14 + i * 40;
      return box(x, 364, 32, 30, "S" + (i + 1), [], "d-small") + line(x + 16, 346, x + 16, 362, id, "d-thin");
    }).join("");
    return svg(id, "tall", 300, 444, c.label,
      text(12, 16, c.before, "d-h", "start") +
      text(150, 36, c.spof, "d-w") + box(60, 44, 180, 46, c.dc, ["Windows Server 2016"], "d-warn") +
      [12, 108, 204].map((x, i) => box(x, 128, 84, 54, c.sites[i], c.siteSubs) + line(x + 42, 128, x + 42, 112, "", "d-dash")).join("") +
      line(54, 112, 246, 112, "", "d-dash") + line(150, 112, 150, 92, id, "d-dash") +
      text(158, 106, c.auth, "d-xs", "start") +
      text(150, 200, c.oldNote, "d-n") +
      `<line class="d-sep" x1="12" y1="214" x2="288" y2="214"/>` +
      text(12, 236, c.after, "d-h", "start") + text(150, 236, c.repl, "d-xs") +
      box(12, 244, 120, 46, "DC-01", c.dc1, "d-key") + box(168, 244, 120, 46, "DC-02", c.dc2, "d-key") +
      line(136, 267, 164, 267, id, "", true) +
      `<g class="d-band"><rect x="12" y="302" width="276" height="26" rx="13"/></g>` +
      text(150, 319, c.band, "d-t d-acc-t") +
      line(150, 328, 150, 346) + line(30, 346, 270, 346) +
      sites + text(150, 414, c.relay, "d-s") + text(150, 432, c.newNote, "d-n"));
  }

  /* --- EDR + SOC ---------------------------------------------------------- */
  const EDR = () => ({
    label: L("Schéma : déploiement de l'EDR et supervision par le SOC", "Diagram: EDR rollout and SOC monitoring"),
    rollout: L("DÉPLOIEMENT DE L'AGENT", "AGENT ROLLOUT"), monitoring: L("SUPERVISION", "MONITORING"),
    chips: [L("GPO au démarrage", "GPO at startup"), L("Script PowerShell", "PowerShell script"),
      L("Contrôles", "Pre-checks"), L("Installation", "Silent install")],
    ep: L("≈ 450 endpoints", "≈ 450 endpoints"),
    epSubs: [L("postes + serveurs", "workstations + servers"), L("agent Vision One", "Vision One agent")],
    tm: "Trend Micro Vision One",
    tmSubs: [L("console SaaS (cloud)", "SaaS console (cloud)"), L("détection comportementale", "behavioural detection")],
    soc: L("SOC externe", "External SOC"), socSubs: [L("analystes 24/7", "24/7 analysts"), L("qualification", "triage")],
    it: L("Équipe IT", "IT team"), itSubs: [L("tickets · astreinte", "tickets · on-call")],
    telemetry: L("télémétrie", "telemetry"), alerts: L("alertes", "alerts"), escalation: L("escalade", "escalation"),
    note: [L("Prise en charge visée :", "Target response:"), L("moins de 15 min sur alerte critique", "under 15 min on a critical alert")],
  });

  function edrWide() {
    const id = "arw-edr", c = EDR();
    return svg(id, "wide", 640, 320, c.label,
      text(16, 18, c.rollout, "d-h", "start") +
      c.chips.map((s, i) => box(16 + i * 156, 28, 140, 32, s, [], "d-chip") + (i < 3 ? line(156 + i * 156, 44, 170 + i * 156, 44, id) : "")).join("") +
      text(16, 92, c.monitoring, "d-h", "start") +
      box(16, 102, 150, 66, c.ep, c.epSubs) +
      line(166, 135, 232, 135, id) + text(199, 127, c.telemetry, "d-xs") +
      box(236, 102, 168, 66, c.tm, c.tmSubs, "d-key") +
      line(404, 135, 470, 135, id) + text(437, 127, c.alerts, "d-xs") +
      box(474, 102, 150, 66, c.soc, c.socSubs, "d-key") +
      line(549, 168, 549, 216, id) + text(556, 196, c.escalation, "d-xs", "start") +
      box(474, 220, 150, 58, c.it, c.itSubs) +
      box(16, 220, 388, 58, L("Postures de réponse (avenant au contrat)", "Response postures (service addendum)"),
        [L("Serveurs critiques : prudente en HO, active en HNO", "Critical servers: cautious in hours, active off-hours"),
         L("Postes utilisateurs : active en permanence", "Workstations: always active")], "d-wide") +
      text(320, 306, c.note.join(" "), "d-n"));
  }

  function edrTall() {
    const id = "arw-edr-t", c = EDR();
    return svg(id, "tall", 300, 656, c.label,
      text(12, 16, c.rollout, "d-h", "start") +
      c.chips.map((s, i) => box(12, 26 + i * 40, 276, 26, s, [], "d-chip") + (i < 3 ? line(150, 52 + i * 40, 150, 65 + i * 40, id) : "")).join("") +
      text(12, 196, c.monitoring, "d-h", "start") +
      box(12, 206, 276, 46, c.ep, [c.epSubs.join(" · ")]) +
      line(150, 252, 150, 284, id) + text(158, 272, c.telemetry, "d-xs", "start") +
      box(12, 286, 276, 56, c.tm, c.tmSubs, "d-key") +
      line(150, 342, 150, 374, id) + text(158, 362, c.alerts, "d-xs", "start") +
      box(12, 376, 276, 46, c.soc, [c.socSubs.join(" · ")], "d-key") +
      line(150, 422, 150, 454, id) + text(158, 442, c.escalation, "d-xs", "start") +
      box(12, 456, 276, 46, c.it, c.itSubs) +
      box(12, 518, 276, 84, L("Postures de réponse", "Response postures"),
        [L("avenant au contrat de service", "service contract addendum"),
         L("Serveurs critiques : prudente en HO,", "Critical servers: cautious in hours,"),
         L("active en HNO", "active off-hours"),
         L("Postes : active en permanence", "Workstations: always active")], "d-wide") +
      note(150, 628, c.note));
  }

  /* --- Sauvegarde : VMware / Proxmox → Veeam → dépôt durci ----------------- */
  const BK = () => ({
    label: L("Schéma : chaîne de sauvegarde Veeam avec VMware et Proxmox", "Diagram: Veeam backup chain with VMware and Proxmox"),
    vm: [L("VM de production", "production VMs")],
    px: ["HPE ProLiant DL380 Gen10", L("ZFS : SSD (VM) · HDD (masse)", "ZFS: SSD (VMs) · HDD (bulk)")],
    migr: L("migration de VM", "VM migration"),
    veeam: ["12.2 → v13", L("travaux de sauvegarde", "backup jobs")],
    repo: L("Dépôt Linux durci", "Hardened Linux repo"), repoSubs: [L("isolé de la prod", "isolated from prod")],
    note: [L("Montée de version, dépôt durci,", "Version upgrade, hardened repository,"), L("nouvel hyperviseur pris en charge", "new hypervisor supported")],
  });

  function backupWide() {
    const id = "arw-bk", c = BK();
    return svg(id, "wide", 640, 280, c.label,
      box(16, 30, 176, 58, "VMware vSphere", c.vm) +
      box(16, 140, 176, 76, "Proxmox VE", c.px) +
      line(104, 88, 104, 136, id, "d-dash") + text(112, 116, c.migr, "d-xs", "start") +
      box(250, 84, 170, 70, "Veeam B&R", c.veeam, "d-key") +
      path("M192 59 C 222 59, 222 104, 246 104", id) + path("M192 178 C 222 178, 222 134, 246 134", id) +
      line(420, 119, 466, 119, id) +
      box(470, 84, 154, 70, c.repo, c.repoSubs, "d-lock") + lock(611, 76) +
      text(320, 262, c.note.join(" "), "d-n"));
  }

  function backupTall() {
    const id = "arw-bk-t", c = BK();
    return svg(id, "tall", 300, 362, c.label,
      box(12, 8, 250, 46, "VMware vSphere", c.vm) +
      line(60, 54, 60, 86, id, "d-dash") + text(68, 74, c.migr, "d-xs", "start") +
      box(12, 88, 250, 62, "Proxmox VE", c.px) +
      path("M262 31 H270 Q276 31 276 37 V178", id) +      // VMware → Veeam, par le côté
      line(137, 150, 137, 178, id) +
      box(12, 180, 276, 56, "Veeam B&R", c.veeam, "d-key") +
      line(150, 236, 150, 262, id) +
      box(12, 264, 276, 46, c.repo, c.repoSubs, "d-lock") + lock(268, 256) +
      note(150, 334, c.note));
  }

  /* --- Supervision : Zabbix → Grafana / alertes ------------------------- */
  const MON = () => ({
    label: L("Schéma : supervision Zabbix et tableaux de bord Grafana", "Diagram: Zabbix monitoring and Grafana dashboards"),
    hosts: [
      [L("Serveurs Windows / Linux", "Windows / Linux servers"), L("agent", "agent")],
      [L("Hyperviseurs VMware", "VMware hypervisors"), "API"],
      [L("Switchs", "Switches"), "SNMP"],
      [L("Onduleurs", "UPS units"), "SNMP"],
      [L("Serveur de sauvegarde", "Backup server"), L("agent", "agent")],
    ],
    zbx: ["Debian", L("modèles · déclencheurs", "templates · triggers")],
    dash: [L("tableaux de bord", "dashboards")],
    alerts: L("Alertes", "Alerts"), alertSubs: ["notifications", L("escalades", "escalations")],
    note: L("Première supervision centralisée du groupe", "The group's first centralized monitoring"),
  });

  function monitoringWide() {
    const id = "arw-mon", c = MON();
    return svg(id, "wide", 640, 300, c.label,
      c.hosts.map(([h, p], i) => {
        const y = 16 + i * 48;
        return box(16, y, 186, 40, h, [p], "d-row") + path(`M202 ${y + 20} C 240 ${y + 20}, 232 147, 262 147`, id, "d-thin");
      }).join("") +
      box(266, 112, 150, 70, "Zabbix 7", c.zbx, "d-key") +
      path("M416 136 C 440 136, 440 92, 462 92", id) + path("M416 158 C 440 158, 440 202, 462 202", id) +
      box(466, 64, 158, 56, "Grafana", c.dash) +
      box(466, 174, 158, 56, c.alerts, c.alertSubs) +
      text(320, 288, c.note, "d-n"));
  }

  function monitoringTall() {
    const id = "arw-mon-t", c = MON();
    return svg(id, "tall", 300, 440, c.label,
      c.hosts.map(([h, p], i) => {
        const y = 10 + i * 48;
        return box(12, y, 184, 40, h, [p], "d-row") + line(196, y + 20, 272, y + 20, "", "d-thin");
      }).join("") +
      line(272, 30, 272, 264, id, "d-thin") +
      box(12, 266, 276, 50, "Zabbix 7", [c.zbx.join(" · ")], "d-key") +
      line(78, 316, 78, 344, id) + line(222, 316, 222, 344, id) +
      box(12, 346, 132, 56, "Grafana", c.dash) +
      box(156, 346, 132, 56, c.alerts, c.alertSubs) +
      text(150, 428, c.note, "d-n"));
  }

  const DIAGRAMS = {
    ad: [adWide, adTall], edr: [edrWide, edrTall],
    backup: [backupWide, backupTall], monitoring: [monitoringWide, monitoringTall],
  };
  PF.diagram = (id) => (DIAGRAMS[id] ? DIAGRAMS[id].map((f) => f()).join("") : "");
  PF.diagramCaption = () => L("Schéma simplifié et anonymisé", "Simplified, anonymized diagram");
})(window.PF = window.PF || {});
