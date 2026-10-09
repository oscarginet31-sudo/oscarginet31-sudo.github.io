/* =============================================================================
 * content.js — Source unique de vérité du portfolio.
 * Tout le contenu (texte, compétences, projets…) vit ici, séparé du rendu.
 * Il alimente les DEUX versions du site : la galaxie 3D (index.html) et le
 * mode classique (classic.html). Pour mettre à jour le portfolio, on édite CE
 * fichier, jamais le moteur.
 *
 * Conventions :
 *   - chaque chaîne traduisible est un objet { fr, en } (raccourci t()) ;
 *   - dans les titres, *texte* = partie en italique (mise en avant) ;
 *   - ctx d'une compétence / d'un projet : "pro" (Lamberet), "iut", "perso".
 * ========================================================================== */
(function (PF) {
  "use strict";

  /** Raccourci pour déclarer une chaîne bilingue. */
  const t = (fr, en) => ({ fr, en });

  PF.CONTENT = {
    /* --- Identité ------------------------------------------------------- */
    identity: {
      name: "Oscar Ginet",
      role: t(
        "Alternant Systèmes, Réseaux & Cybersécurité",
        "Systems, Networks & Security apprentice"
      ),
      headline: t(
        "Alternant chez Lamberet SAS · BUT R&T Cybersécurité, 3ᵉ année · IUT d’Annecy",
        "Apprentice at Lamberet SAS · BUT Networks & Telecom, Cybersecurity, 3rd year · IUT Annecy"
      ),
      // Ce que je cherche : la première chose qu'un recruteur doit lire (accueil du mode classique).
      seeking: t("Disponible dès septembre 2027 pour un master ou une école d’ingénieurs en cybersécurité, en alternance.",
                 "Available from September 2027 for a cybersecurity master’s or engineering school, as an apprentice."),
      location: t("Annecy (74) · Ain (01)", "Annecy & Ain, France"),
      availability: t("Alternance jusqu’en juillet 2027", "Apprenticeship until July 2027"),
      goal: t(
        "Je recherche une poursuite d’études en cybersécurité (master ou école d’ingénieurs), idéalement en alternance, à partir de septembre 2027.",
        "I’m looking for further studies in cybersecurity (master’s or engineering school), ideally as an apprenticeship, from September 2027."
      ),
      focus: t("AD · Virtualisation · EDR · Supervision", "AD · Virtualization · EDR · Monitoring"),
      taglines: {
        fr: [
          "Je sécurise les réseaux la semaine, je roule sur les routes le week‑end.",
          "Annuaire redondant, sauvegardes vérifiées, alertes triées.",
          "Du paquet réseau au sommet alpin — toujours en mouvement.",
        ],
        en: [
          "I secure networks during the week and ride the roads on weekends.",
          "Redundant directory, verified backups, triaged alerts.",
          "From network packet to alpine summit — always on the move.",
        ],
      },
      motto: t(
        "Déterminé, curieux, et une *réelle volonté d’apprendre.*",
        "Determined, curious, and *genuinely eager to learn.*"
      ),
      bio: [
        t("Alternant chez Lamberet SAS, constructeur français de carrosseries frigorifiques, et étudiant en BUT Réseaux & Télécommunications parcours Cybersécurité à l’IUT d’Annecy.",
          "Apprentice at Lamberet SAS, a French manufacturer of refrigerated truck bodies, and student in the Networks & Telecommunications BUT (Cybersecurity track) at IUT Annecy."),
        t("Au sein d’une petite équipe informatique, je fais vivre l’infrastructure d’un groupe industriel multi-sites : annuaire, virtualisation, sauvegardes, supervision et sécurité des postes et des serveurs.",
          "Within a small IT team, I run and evolve the infrastructure of a multi-site industrial group: directory services, virtualization, backups, monitoring, and endpoint and server security."),
        t("Depuis juillet 2026, je sers aussi dans la réserve opérationnelle au 27ᵉ Bataillon de Chasseurs Alpins. Le reste du temps, on me trouve sur mon vélo de route.",
          "Since July 2026, I have also been serving in the operational reserve with the 27th Alpine Chasseurs Battalion. The rest of the time, you’ll find me on my road bike."),
      ],
      facts: [
        { label: t("Basé", "Based"), value: t("Annecy (74) · Ain (01)", "Annecy & Ain, France") },
        { label: t("Statut", "Status"), value: t("Alternance jusqu’en juillet 2027", "Apprenticeship until July 2027") },
        { label: t("Ensuite", "Next"), value: t("Poursuite d’études en cyber dès sept. 2027, en alternance", "Further cyber studies from Sept 2027, as an apprentice") },
        { label: t("Langues", "Languages"), value: t("Français · Anglais (TOEIC 550) · Espagnol", "French · English (TOEIC 550) · Spanish") },
        { label: t("Mobilité", "Mobility"), value: t("Permis B · véhicule personnel", "Driving licence · own car") },
      ],
      stats: [
        { value: "7",   label: t("sites migrés vers un Active Directory redondant", "sites moved to a redundant Active Directory") },
        { value: "11",  label: t("étendues DHCP en failover 50/50", "DHCP scopes in 50/50 failover") },
        { value: "2",   label: t("ans d’alternance sur une infrastructure multi-sites", "years of apprenticeship on a multi-site infrastructure") },
        { value: "6",   label: t("certifications : Stormshield CSNA, Cisco CCNA 1 & 2, ANSSI, TOEIC, Pix", "certifications: Stormshield CSNA, Cisco CCNA 1 & 2, ANSSI, TOEIC, Pix") },
      ],
      terminal: [
        { cmd: "whoami",               out: t("Oscar Ginet — alternant SysAdmin & Cyber", "Oscar Ginet — SysAdmin & Cyber apprentice") },
        { cmd: "cat ./poste",          out: t("Lamberet SAS · groupe industriel multi-sites", "Lamberet SAS · multi-site industrial group") },
        { cmd: "cat ./formation",      out: t("BUT R&T Cybersécurité · IUT d’Annecy", "BUT Networks & Telecom, Cyber · IUT Annecy") },
        { cmd: "ls ./stack",           out: "AD  Proxmox  VMware  Veeam  Zabbix  Vision One" },
        { cmd: "systemctl status reserve", out: t("● active (running) — 27ᵉ BCA", "● active (running) — 27th BCA"), ok: true },
      ],
    },

    /* --- CV (PDF généré depuis cv.html, voir README) -------------------- */
    cv: {
      // Le CV doit se lire en quelques secondes : l'essentiel en **gras**, le détail ensuite.
      now: [t("**BUT R&T Cybersécurité, 3ᵉ année** · IUT d’Annecy", "**BUT Networks & Telecom, Cybersecurity — 3rd year** · IUT Annecy"),
            t("Alternant chez **Lamberet SAS** depuis 2024", "Apprentice at **Lamberet SAS** since 2024")],
      goal: t("Je recherche une **poursuite d’études en cybersécurité** (master ou école d’ingénieurs), **en alternance dès septembre 2027**.",
              "Looking for **further studies in cybersecurity** (master’s or engineering school), **as an apprentice from September 2027**."),
      highlights: [
        t("**Migration EDR + SOC externe** sur ≈ 450 postes et serveurs (Trend Micro Vision One), sujet de mon mémoire",
          "**EDR + external SOC rollout** across ≈ 450 workstations and servers (Trend Micro Vision One), subject of my thesis"),
        t("**Active Directory redondant** : 2ᵉ contrôleur de domaine Windows Server 2025, **DHCP en failover** sur 7 sites",
          "**Redundant Active Directory**: second domain controller on Windows Server 2025, **DHCP failover** across 7 sites"),
        t("**Supervision Zabbix 7 + Grafana** : première plateforme de supervision centralisée du groupe",
          "**Zabbix 7 + Grafana monitoring**: the group’s first centralized monitoring platform"),
        t("**Sauvegardes Veeam v13** avec dépôt Linux durci, nouvel hyperviseur **Proxmox VE**",
          "**Veeam v13 backups** with a hardened Linux repository, new **Proxmox VE** hypervisor"),
      ],
      skills: [
        { k: t("Systèmes", "Systems"), v: "Active Directory · GPO · DNS/DHCP · Windows Server · Linux" },
        { k: t("Virtualisation", "Virtualization"), v: "VMware vSphere · Proxmox VE · Veeam" },
        { k: t("Sécurité", "Security"), v: t("EDR/XDR · pare-feu Stormshield · triage d’alertes SOC", "EDR/XDR · Stormshield firewall · SOC alert triage") },
        { k: t("Réseau", "Networking"), v: t("VLAN · routage · Wi-Fi · Zabbix", "VLAN · routing · Wi-Fi · Zabbix") },
        { k: "Scripts", v: "PowerShell · Python" },
      ],
      languages: [
        { name: t("Français", "French"), level: t("courant", "fluent") },
        { name: t("Anglais", "English"), level: "TOEIC 550" },
        { name: t("Espagnol", "Spanish"), level: t("intermédiaire", "intermediate") },
      ],
      hobbies: t("Vélo de route, course, escalade · 12 saisons de foot en club · vice-président d’une association de jeunes",
                 "Road cycling, running, climbing · 12 seasons of club football · vice-president of a youth association"),
      foot: t("**Curieux ?** Mon portfolio se visite en vaisseau spatial", "**Curious?** My portfolio is a spaceship ride"),
    },

    /* --- Visite guidée de la galaxie (≈ 1 min) ------------------------- */
    /* system : id du système (null = vue d'ensemble) · item : index de la   */
    /* planète dont la fiche s'ouvre automatiquement (facultatif).           */
    tour: [
      { system: null, title: t("Bienvenue à bord", "Welcome aboard"), text: t(
        "Je suis Oscar, alternant systèmes, réseaux & cybersécurité. En une minute, je vous fais visiter ma galaxie : chaque étoile est une section, chaque planète un projet ou une compétence.",
        "I’m Oscar, a systems, networks & security apprentice. In one minute, let me show you around my galaxy: every star is a section, every planet a project or a skill.") },
      { system: "experience", item: 0, title: t("Parcours", "Path"), text: t(
        "Deux ans d’alternance chez Lamberet SAS, sur l’infrastructure d’un groupe industriel multi-sites.",
        "Two years of apprenticeship at Lamberet SAS, on the infrastructure of a multi-site industrial group.") },
      { system: "projects", item: 0, title: t("Projets", "Projects"), text: t(
        "Cinq chantiers menés en production. La migration EDR fait l’objet de mon mémoire de BUT.",
        "Five projects delivered in production. The EDR migration is the subject of my BUT thesis.") },
      { system: "projects", item: 1, title: t("Projets", "Projects"), text: t(
        "Un Active Directory redondant sur 7 sites, avec le DHCP en failover entre les deux contrôleurs de domaine.",
        "A redundant Active Directory across 7 sites, with DHCP in failover between the two domain controllers.") },
      { system: "skills", title: t("Compétences", "Skills"), text: t(
        "Chaque planète est une compétence, avec l’endroit où je la pratique : en entreprise, à l’IUT ou en projet perso.",
        "Every planet is a skill, tagged with where I practise it: on the job, at university or in personal projects.") },
      { system: "engagement", item: 0, title: t("Engagements", "Beyond work"), text: t(
        "Depuis juillet 2026, je sers dans la réserve opérationnelle au 27ᵉ Bataillon de Chasseurs Alpins.",
        "Since July 2026, I have been serving in the operational reserve with the 27th Alpine Chasseurs Battalion.") },
      { system: "contact", item: 0, title: t("Contact", "Contact"), text: t(
        "Une question, un poste, un réseau à durcir ? Écrivez-moi, je réponds sous 48 h.",
        "A question, a role, a network to harden? Drop me a line, I reply within 48 hours.") },
      { system: null, end: true, title: t("À vous de piloter", "Your turn to fly"), text: t(
        "Visez une étoile et cliquez pour y sauter. Astuce : appuyez sur / pour ouvrir le terminal.",
        "Aim at a star and click to jump. Tip: press / to open the terminal.") },
    ],

    /* --- Hubs : ordre & métadonnées de chaque secteur (galaxie 3D) ------- */
    /* color = teinte d'accent du hub (HUD, repères), accordée à la couleur  */
    /* réelle de son étoile : bleu-blanc, jaune, orange, géante rouge, pulsar.*/
    hubs: [
      { id: "skills",     glyph: "◈", color: "#8fb4ff", label: t("Compétences", "Skills") },
      { id: "experience", glyph: "◆", color: "#ffd98a", label: t("Parcours", "Path") },
      { id: "projects",   glyph: "▲", color: "#ff9f5a", label: t("Projets", "Projects") },
      { id: "engagement", glyph: "★", color: "#ff7a6b", label: t("Engagements", "Beyond") },
      { id: "contact",    glyph: "✉", color: "#b9a6ff", label: t("Contact", "Contact") },
    ],

    /* --- Section : Compétences ----------------------------------------- */
    skills: {
      title: t("Des outils *éprouvés en production.*", "Tools *proven in production.*"),
      intro: t(
        "Une stack construite à l’IUT et mise à l’épreuve chaque semaine sur l’infrastructure de Lamberet. Chaque compétence indique où elle est pratiquée.",
        "A stack built at university and put to the test every week on Lamberet’s infrastructure. Each skill shows where it is practised."
      ),
      categories: [
        {
          code: "01 / SYS",
          name: t("Systèmes & annuaire", "Systems & directory"),
          items: [
            { name: "Active Directory · DNS · DHCP", short: "Active Directory", ctx: ["pro"], note: t(
              "Architecture à double contrôleur de domaine sur 7 sites, DHCP en failover entre les deux DC, santé de l’annuaire contrôlée avec dcdiag et repadmin.",
              "Dual domain controller architecture across 7 sites, DHCP in failover between the two DCs, directory health checked with dcdiag and repadmin.") },
            { name: "Windows Server · GPO", ctx: ["pro"], note: t(
              "Nouveau contrôleur de domaine sous Windows Server 2025 et configuration des postes par stratégies de groupe (GPO).",
              "New Windows Server 2025 domain controller and workstation configuration through Group Policy (GPO).") },
            { name: "Linux (Debian)", ctx: ["pro", "iut"], note: t(
              "Serveur Zabbix et dépôt de sauvegarde Veeam durci sous Debian ; administration système Windows et Linux à l’IUT.",
              "Zabbix server and hardened Veeam backup repository on Debian; Windows and Linux system administration at university.") },
          ],
        },
        {
          code: "02 / INFRA",
          name: t("Virtualisation & sauvegarde", "Virtualization & backup"),
          items: [
            { name: "VMware vSphere · ESXi", ctx: ["pro"], note: t(
              "Administration de l’environnement de production et migration de machines virtuelles vers Proxmox.",
              "Administration of the production environment and migration of virtual machines to Proxmox.") },
            { name: "Proxmox VE · ZFS", ctx: ["pro"], note: t(
              "Reconversion d’un HPE ProLiant DL380 Gen10 en hyperviseur : pools ZFS SSD et HDD, configuration via iLO 5, bridge VLAN-aware.",
              "Turned an HPE ProLiant DL380 Gen10 into a hypervisor: SSD and HDD ZFS pools, iLO 5 setup, VLAN-aware bridge.") },
            { name: "Veeam Backup & Replication", short: "Veeam B&R", ctx: ["pro"], note: t(
              "Montée de version 12.2 → v13, dépôt Linux durci, intégration de Proxmox comme source et résolution d’incidents de sauvegarde.",
              "Upgrade from 12.2 to v13, hardened Linux repository, Proxmox added as a source and backup incidents resolved.") },
          ],
        },
        {
          code: "03 / SEC",
          name: t("Cybersécurité", "Cybersecurity"),
          items: [
            { name: "EDR / XDR — Trend Micro Vision One", short: "EDR / XDR", ctx: ["pro"], note: t(
              "Déploiement d’Apex One (postes) et Deep Security (serveurs), politiques passées de la détection au blocage après observation.",
              "Rolled out Apex One (endpoints) and Deep Security (servers), policies moved from detection to blocking after an observation period.") },
            { name: t("Triage d’alertes & SOC", "Alert triage & SOC"), ctx: ["pro"], note: t(
              "Investigation quotidienne des alertes (évasion de défense, chevaux de Troie, fuites d’identifiants) en lien avec un SOC externe.",
              "Daily investigation of alerts (defense evasion, trojans, credential leaks) together with an external SOC.") },
            { name: t("Réduction de la surface d’attaque", "Attack surface reduction"), short: t("Surface d’attaque", "Attack surface"), ctx: ["pro"], note: t(
              "Gestion de l’exposition au risque : modules de sécurité inactifs, comptes Active Directory obsolètes, postes non conformes.",
              "Risk exposure management: inactive security modules, stale Active Directory accounts, non-compliant endpoints.") },
            { name: t("Sécurité des SI", "Information security"), ctx: ["iut"], note: t(
              "Analyse de vulnérabilités, cryptographie, pare-feu et sécurité des systèmes d’information.",
              "Vulnerability analysis, cryptography, firewalls and information systems security.") },
          ],
        },
        {
          code: "04 / NET",
          name: t("Réseaux & supervision", "Networks & monitoring"),
          items: [
            { name: t("Routage · commutation · VLAN · Wi-Fi", "Routing · switching · VLAN · Wi-Fi"), short: t("Routage & VLAN", "Routing & VLAN"), ctx: ["iut"], note: t(
              "Fondamentaux validés par les certifications Cisco CCNA 1 (Introduction to Networks) et CCNA 2 (Switching, Routing & Wireless Essentials).",
              "Fundamentals validated by the Cisco CCNA 1 (Introduction to Networks) and CCNA 2 (Switching, Routing & Wireless Essentials) certifications.") },
            { name: t("Relais DHCP · Juniper Mist", "DHCP relay · Juniper Mist"), ctx: ["pro"], note: t(
              "Reconfiguration site par site des relais DHCP sur les routeurs lors de la migration de l’annuaire.",
              "Site-by-site reconfiguration of DHCP relays on routers during the directory migration.") },
            { name: "Zabbix 7 · Grafana · SNMP", short: "Zabbix · Grafana", ctx: ["pro"], note: t(
              "Supervision des serveurs, hyperviseurs, switchs, onduleurs et sauvegardes, avec déclencheurs, escalades et tableaux de bord.",
              "Monitoring of servers, hypervisors, switches, UPS units and backups, with triggers, escalations and dashboards.") },
          ],
        },
        {
          code: "05 / DEV",
          name: t("Code & automatisation", "Code & automation"),
          items: [
            { name: "PowerShell", ctx: ["pro"], note: t(
              "Automatisation de la configuration des postes et de l’administration de l’annuaire (Active Directory, DNS, DHCP).",
              "Automating workstation configuration and directory administration (Active Directory, DNS, DHCP).") },
            { name: "Python", ctx: ["iut"], note: t(
              "Traitement du signal avec NumPy, SciPy et Matplotlib : démodulation AM/FM, RDS et BPSK.",
              "Signal processing with NumPy, SciPy and Matplotlib: AM/FM, RDS and BPSK demodulation.") },
            { name: "HTML · CSS · JS · PHP", ctx: ["iut", "perso"], note: t(
              "Site CyberZone (PHP / MySQL) à l’IUT, et ce portfolio, galaxie 3D Three.js comprise.",
              "CyberZone website (PHP / MySQL) at university, and this portfolio, Three.js 3D galaxy included.") },
          ],
        },
      ],
    },

    /* --- Section : Parcours (expériences + formations + certifications) - */
    experience: {
      title: t("Du terrain *aux serveurs.*", "From the field *to the servers.*"),
      intro: t(
        "Deux ans d’alternance sur une infrastructure industrielle bien réelle, nourris par une formation en cybersécurité.",
        "Two years of apprenticeship on a very real industrial infrastructure, backed by a cybersecurity degree."
      ),
      jobs: [
        {
          date: t("Sept. 2024 — aujourd’hui", "Sep 2024 — present"),
          title: t("Alternant Systèmes, Réseaux & Sécurité", "Systems, Networks & Security apprentice"),
          org: "Lamberet SAS",
          meta: t("Alternance · Saint-Cyr-sur-Menthon (01) · sur site", "Apprenticeship · Saint-Cyr-sur-Menthon, France · on site"),
          desc: t(
            "Gestion et évolution de l’infrastructure IT d’un groupe industriel multi-sites, au sein d’une petite équipe informatique.",
            "Running and evolving the IT infrastructure of a multi-site industrial group, within a small IT team."),
          groups: [
            { label: t("Systèmes & annuaire", "Systems & directory"), points: [
              t("Migration Active Directory vers deux contrôleurs de domaine (Windows Server 2016 → 2025) sur 7 sites",
                "Active Directory migration to two domain controllers (Windows Server 2016 → 2025) across 7 sites"),
              t("DHCP redondant entre les deux DC : failover 50/50, relais, superscopes",
                "Redundant DHCP across both DCs: 50/50 failover, relays, superscopes"),
            ] },
            { label: t("Virtualisation & sauvegarde", "Virtualization & backup"), points: [
              t("Administration VMware vSphere et mise en place de Proxmox VE sur HPE ProLiant DL380 Gen10",
                "VMware vSphere administration and Proxmox VE set up on an HPE ProLiant DL380 Gen10"),
              t("Migration de machines virtuelles VMware vers Proxmox",
                "Virtual machine migration from VMware to Proxmox"),
              t("Veeam Backup & Replication : montée 12.2 → v13, dépôt Linux durci",
                "Veeam Backup & Replication: 12.2 → v13 upgrade, hardened Linux repository"),
            ] },
            { label: t("Supervision", "Monitoring"), points: [
              t("Déploiement d’une stack Zabbix 7 + Grafana : serveurs, réseau, services, alerting",
                "Zabbix 7 + Grafana stack: servers, network, services, alerting"),
            ] },
            { label: t("Cybersécurité", "Cybersecurity"), points: [
              t("Migration de l’EDR vers Trend Micro Vision One (Apex One, Deep Security)",
                "EDR migration to Trend Micro Vision One (Apex One, Deep Security)"),
              t("Triage et remédiation des alertes avec un SOC externe",
                "Alert triage and remediation with an external SOC"),
              t("Référentiel de compétences pour la montée en compétence de l’équipe",
                "Skills framework to upskill the team on security tools"),
            ] },
          ],
          tags: ["Active Directory", "Proxmox", "VMware", "Veeam", "Zabbix", "Grafana", "Vision One", "PowerShell"],
        },
        {
          date: "2019 — 2023",
          title: t("Employé agricole", "Farm worker"),
          org: t("Exploitation agricole", "Local farm"),
          meta: t("Saisonnier · Saint-Benoît (01) · 2 mois cumulés", "Seasonal · Saint-Benoît, France · 2 months in total"),
          desc: t(
            "Premier contact avec le monde du travail : travail physique, rigueur et goût du travail en équipe.",
            "First taste of the working world: physical work, rigour and a liking for teamwork."),
          tags: [t("Autonomie", "Autonomy"), t("Travail d’équipe", "Teamwork"), t("Rigueur", "Rigour")],
        },
      ],
      education: [
        {
          date: "2024 — 2027",
          title: t("BUT Réseaux & Télécommunications", "BUT Networks & Telecommunications"), short: "BUT R&T",
          org: t("IUT d’Annecy · parcours Cybersécurité · alternance", "IUT Annecy · Cybersecurity track · apprenticeship"),
          badge: t("3ᵉ année", "3rd year"),
          desc: t(
            "Routage, commutation, VLAN et Wi-Fi, administration Windows et Linux, programmation, télécoms et cybersécurité : vulnérabilités, cryptographie, pare-feu.",
            "Routing, switching, VLAN and Wi-Fi, Windows and Linux administration, programming, telecoms and cybersecurity: vulnerabilities, cryptography, firewalls."),
        },
        {
          date: "2026",
          title: t("DUT Réseaux & Télécommunications", "DUT Networks & Telecommunications"), short: "DUT R&T",
          org: t("IUT d’Annecy · diplôme intermédiaire du BUT", "IUT Annecy · intermediate diploma of the BUT"),
          badge: t("obtenu", "awarded"),
          desc: t("", ""),
        },
        {
          date: "2021 — 2024",
          title: t("Baccalauréat général", "French baccalauréat"), short: t("Bac général", "Baccalauréat"),
          org: t("Lycée du Bugey · mention Assez bien", "Lycée du Bugey · with honours"),
          desc: t("Spécialités Mathématiques et Physique-Chimie, classe sport.",
                  "Maths and Physics-Chemistry majors, sports class."),
        },
        {
          date: "2021",
          title: t("Diplôme national du brevet", "Brevet (lower secondary diploma)"), short: "Brevet",
          org: t("Collège Chartreuse de Portes · mention Très bien", "Collège Chartreuse de Portes · highest honours"),
          desc: t("", ""), cv: false,   // pas sur le CV (trop ancien)
        },
      ],
      certifications: [
        { name: "CCNA 2 — Switching, Routing & Wireless Essentials", short: "CCNA 2", issuer: "Cisco", date: t("Juil. 2026", "Jul 2026") },
        { name: "Stormshield CSNA — Certified Stormshield Network Administrator", short: "Stormshield CSNA", issuer: "Stormshield", date: t("Juin 2026", "Jun 2026"),
          note: t("Pare-feu Stormshield Network Security · valide jusqu’en juin 2029", "Stormshield Network Security firewalls · valid until June 2029") },
        { name: "CCNA 1 — Introduction to Networks", short: "CCNA 1", issuer: "Cisco", date: t("Pendant le BUT", "During the BUT") },
        { name: "TOEIC", cvName: "TOEIC 550", issuer: "ETS", date: t("Mars 2026", "Mar 2026"), note: t("Score 550 · valide jusqu’en mars 2028", "Score 550 · valid until March 2028") },
        { name: "MOOC ANSSI", issuer: t("ANSSI — Agence nationale de la sécurité des SI", "ANSSI — French cybersecurity agency"), date: t("Janv. 2025", "Jan 2025") },
        { name: t("Certification Pix", "Pix certification"), short: "Pix", issuer: "Pix", date: "2023", note: t("404 pix", "404 pix") },
      ],
    },

    /* --- Section : Projets --------------------------------------------- */
    projects: {
      title: t("Là où la curiosité *rencontre la prod.*", "Where curiosity *meets production.*"),
      intro: t(
        "Cinq chantiers menés en alternance sur l’infrastructure de Lamberet, et deux projets universitaires. Chaque fiche détaille la démarche et l’environnement technique.",
        "Five projects delivered on Lamberet’s infrastructure during my apprenticeship, and two university projects. Each sheet details the approach and the tech environment."
      ),
      items: [
        {
          id: "edr", beam: true, ctx: "pro", featured: true, diagram: "edr",
          link: { href: "etude-edr.html", label: t("Lire l’étude de cas complète", "Read the full case study"), short: t("Étude de cas", "Case study") }, short: t("Migration EDR", "EDR migration"),
          badge: t("Mémoire de BUT", "BUT thesis"),
          title: t("Migration EDR : WithSecure → Trend Micro Vision One", "EDR migration: WithSecure → Trend Micro Vision One"),
          desc: t(
            "Remplacement de la protection des postes et serveurs du groupe, de l’étude comparative jusqu’au triage quotidien des alertes avec un SOC externe.",
            "Replacing the group’s endpoint and server protection, from the comparative study to daily alert triage with an external SOC."),
          points: [
            t("Étude comparative des solutions et cadrage du besoin avec la direction informatique",
              "Comparative study of solutions and scoping with IT management"),
            t("Déploiement des agents sur tout le parc (Apex One pour les postes, Deep Security pour les serveurs) et désinstallation de l’ancienne solution",
              "Agent rollout across the whole fleet (Apex One for endpoints, Deep Security for servers) and removal of the previous solution"),
            t("Politiques et modules de sécurité (réputation web, prévention d’intrusion, contrôle applicatif) d’abord en détection, puis en blocage",
              "Security policies and modules (web reputation, intrusion prevention, application control) first in detection, then in blocking mode"),
            t("Triage et investigation des alertes au quotidien (évasion de défense, chevaux de Troie, fuites d’identifiants) avec un SOC externe",
              "Daily alert triage and investigation (defense evasion, trojans, credential leaks) with an external SOC"),
            t("Réduction de la surface d’attaque : modules inactifs sur des serveurs critiques, comptes AD obsolètes, postes non conformes",
              "Attack surface reduction: inactive modules on critical servers, stale AD accounts, non-compliant endpoints"),
            t("Rédaction d’un référentiel de 22 compétences sur 8 domaines et 4 niveaux pour faire monter l’équipe en compétence",
              "Wrote a framework of 22 skills across 8 domains and 4 levels to upskill the IT team"),
          ],
          metrics: [
            { value: "2", label: t("consoles : postes & serveurs", "consoles: endpoints & servers") },
            { value: "22", label: t("compétences au référentiel", "skills in the framework") },
          ],
          env: ["Trend Micro Vision One", "Apex One", "Deep Security", "Active Directory", "Windows Server"],
        },
        {
          id: "ad", ctx: "pro", featured: true, diagram: "ad", short: t("AD redondant · 7 sites", "Redundant AD · 7 sites"),
          title: t("Active Directory redondant sur 7 sites", "Redundant Active Directory across 7 sites"),
          desc: t(
            "D’un contrôleur de domaine unique sous Windows Server 2016, qui portait à lui seul l’annuaire et tout le DHCP, à deux DC redondants (dont un sous Windows Server 2025) qui se partagent le DHCP en failover.",
            "From a single Windows Server 2016 domain controller that carried the directory and all of DHCP on its own, to two redundant DCs (including a new Windows Server 2025 one) sharing DHCP in failover."),
          points: [
            t("Promotion et configuration du nouveau contrôleur de domaine, contrôle de la réplication et de la santé de l’annuaire (dcdiag, repadmin)",
              "Promoted and configured the new domain controller, checked replication and directory health (dcdiag, repadmin)"),
            t("Configuration DHCP conservée à l’identique (une étendue filaire et une étendue Wi-Fi par site), désormais portée par les deux DC",
              "DHCP configuration kept identical (one wired and one Wi-Fi scope per site), now carried by both DCs"),
            t("Relation de failover DHCP entre les deux DC, en répartition de charge 50/50 sur 11 étendues",
              "DHCP failover relationship between the two DCs, 50/50 load balancing across 11 scopes"),
            t("Migration site par site avec reconfiguration des relais DHCP sur les routeurs",
              "Site-by-site migration with DHCP relays reconfigured on the routers"),
            t("Nettoyage des autorisations DHCP et des enregistrements DNS obsolètes",
              "Cleaned up stale DHCP authorizations and DNS records"),
            t("Chaque phase documentée dans un rapport technique remis à l’équipe informatique",
              "Every phase documented in a technical report handed to the IT team"),
          ],
          metrics: [
            { value: "7", label: t("sites", "sites") },
            { value: "2", label: t("contrôleurs de domaine", "domain controllers") },
            { value: "11", label: t("étendues DHCP", "DHCP scopes") },
          ],
          env: ["Windows Server 2016 / 2025", "Active Directory", "DNS", "DHCP", "PowerShell", "VMware vSphere", "Juniper Mist"],
        },
        {
          id: "zabbix", ctx: "pro", diagram: "monitoring", short: "Zabbix + Grafana",
          title: t("Supervision Zabbix 7 + Grafana", "Zabbix 7 + Grafana monitoring"),
          desc: t(
            "Mise en place de la première plateforme de supervision centralisée du groupe, des serveurs jusqu’aux onduleurs.",
            "Set up the group’s first centralized monitoring platform, from servers down to UPS units."),
          points: [
            t("Installation et configuration d’un serveur Zabbix 7 sous Debian (base de données, interface web, agents)",
              "Installed and configured a Zabbix 7 server on Debian (database, web UI, agents)"),
            t("Intégration des hôtes : serveurs Windows et Linux, hyperviseurs VMware, switchs, onduleurs, serveur de sauvegarde",
              "Onboarded hosts: Windows and Linux servers, VMware hypervisors, switches, UPS units, backup server"),
            t("Modèles adaptés et éléments personnalisés : services applicatifs, espace disque, état des sauvegardes",
              "Tuned templates and custom items: application services, disk space, backup status"),
            t("Déclencheurs et actions d’alerte avec notifications et escalades",
              "Triggers and alert actions with notifications and escalations"),
            t("Tableaux de bord Grafana branchés sur Zabbix pour une vue synthétique du parc",
              "Grafana dashboards on top of Zabbix for an at-a-glance view of the fleet"),
          ],
          env: ["Zabbix 7", "Grafana", "Debian", "SNMP", "VMware vSphere", "Windows Server"],
        },
        {
          id: "proxmox", ctx: "pro", diagram: "backup", short: "Proxmox VE",
          title: t("Proxmox VE sur HPE ProLiant DL380 Gen10", "Proxmox VE on an HPE ProLiant DL380 Gen10"),
          desc: t(
            "Reconversion d’un serveur auparavant sous VMware ESXi et HPE SimpliVity en plateforme Proxmox pour les tests et le stockage.",
            "Repurposed a server previously running VMware ESXi and HPE SimpliVity into a Proxmox platform for testing and storage."),
          points: [
            t("Installation de Proxmox VE et configuration matérielle via iLO 5",
              "Installed Proxmox VE and configured the hardware through iLO 5"),
            t("Pools de stockage ZFS : SSD pour les VM et modèles, disques durs pour le stockage de masse",
              "ZFS storage pools: SSDs for VMs and templates, hard drives for bulk storage"),
            t("Intégration de Proxmox comme source dans Veeam Backup & Replication et configuration des sauvegardes",
              "Added Proxmox as a source in Veeam Backup & Replication and configured backup jobs"),
            t("Migration de VM depuis vSphere, avec résolution des incompatibilités de disque (VMDK Stream Optimized)",
              "Migrated VMs from vSphere, solving disk format incompatibilities (VMDK Stream Optimized)"),
            t("Étude du réseau VLAN (bridge VLAN-aware) et de la gestion des utilisateurs et des rôles",
              "Studied VLAN networking (VLAN-aware bridge) and user and role management"),
            t("Rapport technique complet de la migration",
              "Full technical report of the migration"),
          ],
          env: ["Proxmox VE", "ZFS", "VMware ESXi", "HPE iLO 5", "Veeam B&R", "Debian"],
        },
        {
          id: "veeam", ctx: "pro", diagram: "backup", short: "Veeam v13",
          title: t("Sauvegardes Veeam : montée en v13 et dépôt durci", "Veeam backups: v13 upgrade and hardened repository"),
          desc: t(
            "Fiabilisation de la chaîne de sauvegarde du groupe : montée de version, dépôt Linux durci et prise en charge du nouvel hyperviseur Proxmox.",
            "Making the group’s backup chain more reliable: version upgrade, hardened Linux repository and support for the new Proxmox hypervisor."),
          points: [
            t("Montée de version de Veeam Backup & Replication de 12.2 vers v13",
              "Upgraded Veeam Backup & Replication from 12.2 to v13"),
            t("Mise en place d’un dépôt de sauvegarde Linux durci",
              "Set up a hardened Linux backup repository"),
            t("Intégration de Proxmox VE comme source d’infrastructure et configuration des travaux de sauvegarde",
              "Added Proxmox VE as an infrastructure source and configured the backup jobs"),
            t("Diagnostic et résolution d’incidents de sauvegarde",
              "Troubleshooting and resolution of backup incidents"),
          ],
          env: ["Veeam B&R 12.2 → v13", "Linux", "Proxmox VE", "VMware vSphere"],
        },
        {
          id: "sdr", ctx: "iut", short: t("Radio logicielle", "SDR radio"),
          badge: t("SAÉ 301", "SAÉ 301"),
          title: t("Radio logicielle (SDR) en Python", "Software-defined radio (SDR) in Python"),
          desc: t(
            "Traitement numérique du signal appliqué à la radio logicielle, à partir d’enregistrements issus d’un récepteur SDR.",
            "Digital signal processing applied to software-defined radio, using recordings from an SDR receiver."),
          points: [
            t("Démodulation de signaux radio AM et FM", "AM and FM radio signal demodulation"),
            t("Décodage du RDS (Radio Data System) diffusé en bande FM", "Decoding RDS (Radio Data System) broadcast on the FM band"),
            t("Étude et démodulation d’une transmission numérique BPSK", "Study and demodulation of a BPSK digital transmission"),
            t("Analyse spectrale, filtrage numérique et visualisation des signaux", "Spectral analysis, digital filtering and signal visualization"),
          ],
          env: ["Python", "NumPy", "SciPy", "Matplotlib", "SDR"],
        },
        {
          id: "cyberzone", ctx: "iut", short: "CyberZone",
          badge: t("SAÉ 203", "SAÉ 203"),
          title: t("CyberZone, site d’un café gaming", "CyberZone, a gaming café website"),
          desc: t(
            "Conception et développement en binôme du site web d’un café gaming, présenté devant un jury.",
            "Designed and built a gaming café website as a pair, presented to a jury."),
          points: [
            t("Maquettage et intégration des pages en HTML et CSS", "Mock-ups and page integration in HTML and CSS"),
            t("Fonctionnalités dynamiques en PHP adossées à une base MySQL", "Dynamic features in PHP backed by a MySQL database"),
            t("Gestion des formulaires et des données utilisateurs", "Form handling and user data management"),
            t("Présentation orale du projet devant un jury", "Oral presentation of the project to a jury"),
          ],
          env: ["HTML", "CSS", "PHP", "MySQL"],
          link: { href: "https://github.com/oscarginet31-sudo/CyberZone", label: t("Voir le code sur GitHub", "View the code on GitHub"), short: "GitHub" },
        },
      ],
    },

    /* --- Section : Engagements ----------------------------------------- */
    engagement: {
      title: t("Le terrain, *l’équipe, l’effort.*", "The field, *the team, the effort.*"),
      intro: t(
        "Ce qui m’occupe loin des écrans : servir, encadrer, organiser et rouler.",
        "What keeps me busy away from screens: serving, coaching, organizing and riding."
      ),
      items: [
        {
          glyph: "⌖", icon: "peak", featured: true, short: t("Réserve · 27ᵉ BCA", "Reserve · 27th BCA"),
          title: t("Réserviste opérationnel — 27ᵉ BCA", "Operational reservist — 27th BCA"),
          meta: t("Armée de Terre · depuis juillet 2026", "French Army · since July 2026"),
          desc: t(
            "Engagement de cinq ans dans la réserve opérationnelle, au sein du 27ᵉ Bataillon de Chasseurs Alpins, unité des troupes de montagne. Mené en parallèle de l’alternance et des études.",
            "Five-year commitment to the operational reserve with the 27th Alpine Chasseurs Battalion, a mountain infantry unit. Carried out alongside my apprenticeship and studies."),
        },
        {
          glyph: "★", icon: "group", short: t("Association des jeunes", "Youth association"),
          title: t("Vice-président — Association des jeunes", "Vice-president — Youth association"),
          meta: "Lhuis (01)",
          desc: t(
            "Organisation et animation d’événements pour le village, coordination de l’équipe et de la logistique.",
            "Organizing and running village events, coordinating the team and the logistics."),
        },
        {
          glyph: "⚑", icon: "ball", short: "Football",
          title: t("Football en club · 12 saisons", "Club football · 12 seasons"),
          meta: t("De 6 à 18 ans · encadrement des jeunes", "Age 6 to 18 · youth coaching"),
          desc: t(
            "Douze saisons en club, puis encadrement des entraînements des équipes de jeunes.",
            "Twelve seasons at club level, then coaching youth team training sessions."),
        },
        {
          glyph: "↗", icon: "bike",
          title: t("Cyclisme sur route", "Road cycling"),
          meta: t("~6 h de sport par semaine", "~6 h of sport a week"),
          desc: t(
            "Ma vraie passion. Complétée par la musculation, la course à pied et l’escalade.",
            "My real passion, rounded out with strength training, running and climbing."),
        },
      ],
    },

    /* --- Section : Contact --------------------------------------------- */
    contact: {
      title: t("Un réseau à durcir, *une idée à creuser ?*", "A network to harden, *an idea to explore?*"),
      intro: t(
        "Je cherche une poursuite d’études en cybersécurité, en alternance, à partir de septembre 2027. Ouvert aussi aux échanges sur un projet d’infrastructure ou une question technique. Réponse sous 48 h ouvrées.",
        "I’m looking for further cybersecurity studies, as an apprentice, from September 2027. Also happy to talk about an infrastructure project or a technical question. Reply within 48 working hours."
      ),
      email: "o.ginet.pro@gmail.com",
      linkedin: "https://www.linkedin.com/in/oscar-ginet-6523862b3/",
      // Pas de numéro de téléphone sur le site : il n'apparaît que dans le CV PDF (voir tools/build_cv.py).
      links: [
        { label: "EMAIL", value: "o.ginet.pro@gmail.com", href: "mailto:o.ginet.pro@gmail.com" },
        { label: "LINKEDIN", value: "/in/oscar-ginet", href: "https://www.linkedin.com/in/oscar-ginet-6523862b3/" },
        { label: t("LIEU", "LOCATION"), value: t("Annecy (74) · Ain (01) · Permis B", "Annecy & Ain, France · Driving licence"), href: null },
      ],
    },
  };

  /* --- Chaînes d'interface (UI chrome) --------------------------------- */
  PF.STRINGS = {
    /* Galaxie 3D */
    "intro.enter":      t("Entrer dans la galaxie", "Enter the galaxy"),
    "intro.hint":       t("Explorez ma galaxie : chaque étoile est une section.",
                          "Explore my galaxy: each star is a section."),
    "intro.controls":   t("Voler", "Fly"),
    "intro.look":       t("viser", "aim"),
    "intro.select":     t("ouvrir", "open"),
    "intro.controlsTouch": t("Glissez pour regarder", "Drag to look"),
    "intro.dock":       t("ouvrir", "open"),
    "hud.enter":        t("entrer", "enter"),
    "hud.clickLook":    t("Visez à la souris · clic pour ouvrir · bords de l’écran pour tourner",
                          "Aim with the mouse · click to open · screen edges to turn"),
    "hud.returnNode":   t("Retour à la galaxie", "Back to the galaxy"),
    "hud.returnVerb":   t("retour", "back"),
    "system.returnShort": t("↩ RETOUR", "↩ BACK"),
    "intro.classic":    t("Préférez le mode classique →", "Prefer the classic version →"),
    "intro.reduced":    t("Animations réduites détectées — le mode classique est recommandé.",
                          "Reduced motion detected — classic mode is recommended."),
    "hud.sector":       t("secteur", "sector"),
    "hud.deepspace":    t("espace ouvert", "open space"),
    "hud.cv":           t("CV", "CV"),
    "hud.classic":      t("Mode classique", "Classic mode"),
    "hud.back":         t("Retour à la galaxie", "Back to the galaxy"),
    "hud.dockPrompt":   t("ouvrir", "open"),
    "panel.close":      t("Fermer", "Close"),
    "contact.scope":    t("périmètre entreprise", "company scope"),

    /* Mode classique */
    "nav.about":        t("À propos", "About"),
    "nav.path":         t("Parcours", "Path"),
    "nav.projects":     t("Projets", "Projects"),
    "nav.skills":       t("Compétences", "Skills"),
    "nav.engagement":   t("Engagements", "Beyond"),
    "nav.contact":      t("Contact", "Contact"),
    "nav.galaxy":       t("Galaxie 3D", "3D galaxy"),
    "nav.menu":         t("Menu", "Menu"),
    "nav.theme":        t("Changer de thème", "Toggle theme"),
    "nav.lang":         t("Changer de langue", "Switch language"),
    "skip":             t("Aller au contenu", "Skip to content"),
    "hero.cta.projects":t("Voir les projets", "See the projects"),
    "hero.cta.cv":      t("Télécharger le CV", "Download the CV"),
    "hero.cta.contact": t("Me contacter", "Get in touch"),
    "hero.scroll":      t("défiler", "scroll"),
    "about.label":      t("À propos", "About"),
    "path.label":       t("Parcours", "Path"),
    "path.jobs":        t("Expérience", "Experience"),
    "path.edu":         t("Formation", "Education"),
    "path.certs":       t("Certifications", "Certifications"),
    "path.details":     t("Missions", "Responsibilities"),
    "proj.label":       t("Projets", "Projects"),
    "proj.all":         t("Tous", "All"),
    "proj.pro":         t("Alternance", "Apprenticeship"),
    "proj.iut":         t("IUT", "University"),
    "proj.open":        t("Lire la fiche", "Read more"),
    "proj.steps":       t("Démarche", "Approach"),
    "proj.env":         t("Environnement", "Environment"),
    "proj.close":       t("Fermer", "Close"),
    "proj.org.pro":     t("Lamberet SAS", "Lamberet SAS"),
    "proj.org.iut":     t("IUT d’Annecy", "IUT Annecy"),
    "skills.label":     t("Compétences", "Skills"),
    "ctx.pro":          t("Entreprise", "On the job"),
    "ctx.iut":          t("IUT", "University"),
    "ctx.perso":        t("Perso", "Personal"),
    "eng.label":        t("Engagements", "Beyond work"),
    "contact.label":    t("Contact", "Contact"),
    "contact.copy":     t("Copier", "Copy"),
    "contact.copied":   t("Copié ✓", "Copied ✓"),
    "contact.write":    t("Écrire un email", "Send an email"),
    "nav.cv":           t("CV", "CV"),
    "skills.where":     t("Pratiqué :", "Practised:"),
    "proj.metrics":     t("En chiffres", "Key figures"),
    "galaxy.cta":       t("Explorer en 3D", "Explore in 3D"),
    "galaxy.pitch":     t("Ce portfolio existe aussi en version jouable : une galaxie où chaque étoile est une section et chaque planète un projet.",
                          "This portfolio also comes as a playable version: a galaxy where every star is a section and every planet a project."),
    "case.back":        t("← Retour au portfolio", "← Back to portfolio"),
    "case.toc":         t("Sommaire", "Contents"),
    "case.more":        t("Voir les autres projets", "See the other projects"),
    "case.home":        t("Portfolio", "Portfolio"),
    "case.read":        t("Lire l’étude de cas", "Read the case study"),
    "tour.start":       t("Visite guidée", "Guided tour"),
    "tour.startLong":   t("Visite guidée · 1 min", "Guided tour · 1 min"),
    "tour.next":        t("Suivant", "Next"),
    "tour.prev":        t("Précédent", "Previous"),
    "tour.pause":       t("Pause", "Pause"),
    "tour.play":        t("Reprendre", "Resume"),
    "tour.quit":        t("Quitter la visite", "Exit tour"),
    "tour.fly":         t("Pilote automatique…", "Autopilot engaged…"),
    "tour.again":       t("Revoir", "Replay"),
    "tour.free":        t("Pilotage libre", "Fly freely"),
    "term.open":        t("Terminal", "Terminal"),
    "cv.file":          t("CV_Ginet_Oscar.pdf", "CV_Ginet_Oscar_EN.pdf"),
    "footer.crafted":   t("Conçu et codé à la main par Oscar Ginet", "Designed and hand-coded by Oscar Ginet"),
    "footer.top":       t("Haut de page ↑", "Back to top ↑"),
    "footer":           t("Conçu, codé et piloté à Annecy · 2026",
                          "Designed, coded and piloted in Annecy · 2026"),
  };
})(window.PF = window.PF || {});
