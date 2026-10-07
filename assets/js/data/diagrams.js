/* =============================================================================
 * diagrams.js — Schémas d'architecture des projets (SVG en ligne, bilingues,
 * colorés par les variables CSS du thème). Volontairement simplifiés et
 * ANONYMISÉS : aucun nom de serveur, d'adresse IP ni de chemin interne.
 *   PF.diagram(id) → chaîne SVG (ad | edr | backup | monitoring)
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
    `<line class="d-l ${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#${id})"${both ? ` marker-start="url(#${id}-s)"` : ""}/>`;
  const path = (d, id, cls = "") => `<path class="d-l ${cls}" d="${d}" marker-end="url(#${id})"/>`;
  const text = (x, y, s, cls = "d-s", anchor = "middle") => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${esc(s)}</text>`;
  const svg = (id, w, h, label, body) =>
    `<svg class="diagram" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">` +
    `<title>${esc(label)}</title><defs>` +
    `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="d-m" d="M0 0L10 5L0 10z"/></marker>` +
    `<marker id="${id}-s" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="d-m" d="M10 0L0 5L10 10z"/></marker>` +
    `</defs>${body}</svg>`;

  /* --- Active Directory : avant / après ---------------------------------- */
  function ad() {
    const id = "arw-ad";
    const sites = Array.from({ length: 7 }, (_, i) => {
      const x = 346 + i * 42;
      return box(x, 214, 36, 36, "S" + (i + 1), [], "d-small") + line(x + 18, 214, x + 18, 186, id, "d-thin");
    }).join("");
    return svg(id, 640, 300, L("Schéma : Active Directory avant et après la migration", "Diagram: Active Directory before and after the migration"),
      text(18, 22, L("AVANT", "BEFORE"), "d-h", "start") + text(342, 22, L("APRÈS", "AFTER"), "d-h", "start") +
      `<line class="d-sep" x1="320" y1="10" x2="320" y2="290"/>` +
      // Avant
      box(60, 40, 180, 50, L("DC unique", "Single DC"), ["Windows Server 2016"], "d-warn") +
      text(150, 34, L("⚠ point de défaillance unique", "⚠ single point of failure"), "d-w") +
      [10, 106, 202].map((x, i) =>
        box(x, 196, 88, 56, [L("Site 1", "Site 1"), L("Site 2", "Site 2"), L("Sites 3–7", "Sites 3–7")][i], [L("DHCP local", "local DHCP"), "NAS / switch"]) +
        line(x + 44, 196, 150, 92, id, "d-dash")).join("") +
      text(150, 150, L("authentification AD", "AD authentication"), "d-s") +
      text(150, 282, L("DHCP éparpillé, un seul contrôleur", "Scattered DHCP, a single controller"), "d-n") +
      // Après
      box(345, 40, 120, 50, "DC-01", [L("WS 2025 · nouveau", "WS 2025 · new")], "d-key") +
      box(515, 40, 120, 50, "DC-02", [L("redondance", "redundancy")], "d-key") +
      line(469, 66, 511, 66, id, "", true) + text(490, 102, "", "d-xs") + text(490, 34, L("réplication AD · DNS", "AD · DNS replication"), "d-xs") +
      `<g class="d-band"><rect x="345" y="104" width="290" height="26" rx="13"/></g>` +
      text(490, 121, L("Failover DHCP 50/50 · 11 étendues", "DHCP failover 50/50 · 11 scopes"), "d-t d-acc-t") +
      `<line class="d-l" x1="490" y1="130" x2="490" y2="186"/><line class="d-l" x1="364" y1="186" x2="616" y2="186"/>` +
      sites + text(490, 270, L("7 sites · relais DHCP sur les routeurs", "7 sites · DHCP relay on the routers"), "d-s") +
      text(490, 288, L("Annuaire redondant, DHCP centralisé", "Redundant directory, centralized DHCP"), "d-n"));
  }

  /* --- EDR + SOC ---------------------------------------------------------- */
  function edr() {
    const id = "arw-edr";
    const chips = [L("GPO au démarrage", "GPO at startup"), L("Script PowerShell", "PowerShell script"),
      L("Contrôles", "Pre-checks"), L("Installation", "Silent install")];
    return svg(id, 640, 320, L("Schéma : déploiement de l'EDR et supervision par le SOC", "Diagram: EDR rollout and SOC monitoring"),
      text(16, 18, L("DÉPLOIEMENT DE L'AGENT", "AGENT ROLLOUT"), "d-h", "start") +
      chips.map((c, i) => box(16 + i * 156, 28, 140, 32, c, [], "d-chip") + (i < 3 ? line(156 + i * 156, 44, 170 + i * 156, 44, id) : "")).join("") +
      text(16, 92, L("SUPERVISION", "MONITORING"), "d-h", "start") +
      box(16, 102, 150, 66, L("≈ 450 endpoints", "≈ 450 endpoints"), [L("postes + serveurs", "workstations + servers"), L("agent Vision One", "Vision One agent")]) +
      line(166, 135, 232, 135, id) + text(199, 127, L("télémétrie", "telemetry"), "d-xs") +
      box(236, 102, 168, 66, "Trend Micro Vision One", [L("console SaaS (cloud)", "SaaS console (cloud)"), L("détection comportementale", "behavioural detection")], "d-key") +
      line(404, 135, 470, 135, id) + text(437, 127, L("alertes", "alerts"), "d-xs") +
      box(474, 102, 150, 66, L("SOC externe", "External SOC"), [L("analystes 24/7", "24/7 analysts"), L("qualification", "triage")], "d-key") +
      line(549, 168, 549, 216, id) + text(556, 196, L("escalade", "escalation"), "d-xs", "start") +
      box(474, 220, 150, 58, L("Équipe IT", "IT team"), [L("tickets · astreinte", "tickets · on-call")]) +
      box(16, 220, 388, 58, L("Postures de réponse (avenant au contrat)", "Response postures (service addendum)"),
        [L("Serveurs critiques : prudente en HO, active en HNO", "Critical servers: cautious in hours, active off-hours"),
         L("Postes utilisateurs : active en permanence", "Workstations: always active")], "d-wide") +
      text(320, 306, L("Prise en charge visée : moins de 15 min sur alerte critique", "Target response: under 15 min on a critical alert"), "d-n"));
  }

  /* --- Sauvegarde : VMware / Proxmox → Veeam → dépôt durci ----------------- */
  function backup() {
    const id = "arw-bk";
    return svg(id, 640, 280, L("Schéma : chaîne de sauvegarde Veeam avec VMware et Proxmox", "Diagram: Veeam backup chain with VMware and Proxmox"),
      box(16, 30, 176, 58, "VMware vSphere", [L("VM de production", "production VMs")]) +
      box(16, 140, 176, 76, "Proxmox VE", ["HPE ProLiant DL380 Gen10", L("ZFS : SSD (VM) · HDD (masse)", "ZFS: SSD (VMs) · HDD (bulk)")]) +
      line(104, 88, 104, 136, id, "d-dash") + text(112, 116, L("migration de VM", "VM migration"), "d-xs", "start") +
      box(250, 84, 170, 70, "Veeam B&R", ["12.2 → v13", L("travaux de sauvegarde", "backup jobs")], "d-key") +
      path("M192 59 C 222 59, 222 104, 246 104", id) + path("M192 178 C 222 178, 222 134, 246 134", id) +
      line(420, 119, 466, 119, id) +
      box(470, 84, 154, 70, L("Dépôt Linux durci", "Hardened Linux repo"), [L("isolé de la prod", "isolated from prod")], "d-lock") +
      `<g class="d-lockicon" transform="translate(611 76)"><rect x="0" y="7" width="14" height="11" rx="2"/><path d="M3 7V4a4 4 0 0 1 8 0v3" fill="none"/></g>` +
      text(320, 262, L("Montée de version, dépôt durci, nouvel hyperviseur pris en charge", "Version upgrade, hardened repository, new hypervisor supported"), "d-n"));
  }

  /* --- Supervision : Zabbix → Grafana / alertes ------------------------- */
  function monitoring() {
    const id = "arw-mon";
    const hosts = [
      [L("Serveurs Windows / Linux", "Windows / Linux servers"), L("agent", "agent")],
      [L("Hyperviseurs VMware", "VMware hypervisors"), "API"],
      [L("Switchs", "Switches"), "SNMP"],
      [L("Onduleurs", "UPS units"), "SNMP"],
      [L("Serveur de sauvegarde", "Backup server"), L("agent", "agent")],
    ];
    return svg(id, 640, 300, L("Schéma : supervision Zabbix et tableaux de bord Grafana", "Diagram: Zabbix monitoring and Grafana dashboards"),
      hosts.map(([h, p], i) => {
        const y = 20 + i * 48;
        return box(16, y, 186, 36, h, [], "d-row") + text(214, y + 22, p, "d-xs", "start") +
          path(`M202 ${y + 18} C 240 ${y + 18}, 232 147, 262 147`, id, "d-thin");
      }).join("") +
      box(266, 112, 150, 70, "Zabbix 7", ["Debian", L("modèles · déclencheurs", "templates · triggers")], "d-key") +
      path("M416 136 C 440 136, 440 92, 462 92", id) + path("M416 158 C 440 158, 440 202, 462 202", id) +
      box(466, 64, 158, 56, "Grafana", [L("tableaux de bord", "dashboards")]) +
      box(466, 174, 158, 56, L("Alertes", "Alerts"), [L("notifications · escalades", "notifications · escalations")]) +
      text(320, 288, L("Première supervision centralisée du groupe", "The group's first centralized monitoring"), "d-n"));
  }

  const DIAGRAMS = { ad, edr, backup, monitoring };
  PF.diagram = (id) => (DIAGRAMS[id] ? DIAGRAMS[id]() : "");
  PF.diagramCaption = () => L("Schéma simplifié et anonymisé", "Simplified, anonymized diagram");
})(window.PF = window.PF || {});
