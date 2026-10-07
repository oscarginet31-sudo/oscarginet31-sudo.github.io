/* =============================================================================
 * case-edr.js — Étude de cas « Migration EDR + SOC », tirée du mémoire de BUT 2.
 * ANONYMISÉE : ni noms de personnes, de machines, de tickets ou de chemins
 * internes, ni prestataire SOC, ni logiciel métier ; pas de détail sur les
 * failles résiduelles du parc. Rendue par assets/js/case.js (etude-edr.html).
 * ========================================================================== */
(function (PF) {
  "use strict";
  const t = (fr, en) => ({ fr, en });

  PF.CASE_EDR = {
    eyebrow: t("Étude de cas · mémoire de BUT 2", "Case study · 2nd-year BUT thesis"),
    title: t("Passer d’un antivirus *qu’on ne regarde plus* à une surveillance active",
             "From an antivirus *nobody looked at* to active monitoring"),
    lead: t(
      "Remplacer la protection des postes et serveurs d’un groupe industriel multi-sites par un EDR supervisé par un SOC externe, de l’étude de marché jusqu’à l’exploitation quotidienne, en deux mois, sans jamais laisser le parc sans couverture.",
      "Replacing the endpoint and server protection of a multi-site industrial group with an EDR monitored by an external SOC, from the market study to day-to-day operations, in two months, without ever leaving the fleet unprotected."),
    facts: [
      { value: "≈ 450", label: t("endpoints dans le périmètre", "endpoints in scope") },
      { value: t("2 mois", "2 months"), label: t("de l’étude au déploiement", "from study to rollout") },
      { value: "4", label: t("EDR évalués en démonstration", "EDRs evaluated in demos") },
      { value: "< 15 min", label: t("prise en charge visée d’une alerte critique", "target response to a critical alert") },
    ],
    role: t("Mon rôle : chef de projet technique, de l’analyse du besoin à la mise en exploitation, avec mon maître d’apprentissage (responsable informatique). La négociation commerciale relevait du service achats.",
            "My role: technical project lead, from needs analysis to go-live, alongside my apprenticeship mentor (IT manager). Commercial negotiation was handled by the purchasing department."),
    question: t("Comment passer d’une protection logicielle passive à une surveillance active en temps réel, sans interruption de couverture avant la fin du contrat existant ?",
                "How do we move from passive software protection to active real-time monitoring, without any gap in coverage before the current contract ends?"),
    sections: [
      {
        id: "contexte", title: t("Le point de départ", "The starting point"),
        paras: [
          t("Le groupe fabrique des carrosseries frigorifiques sur plusieurs sites de production en France et en Europe. Une équipe informatique de quatre personnes gère l’ensemble du système d’information, soit environ 450 endpoints entre postes de travail et serveurs.",
            "The group builds refrigerated truck bodies across several production sites in France and Europe. A four-person IT team runs the entire information system: around 450 endpoints, workstations and servers combined."),
          t("La protection reposait depuis une dizaine d’années sur une solution de protection des postes qui détectait et isolait automatiquement les machines au-delà d’un score de risque. Le reste des alertes remontait dans une console… que personne n’avait le temps d’analyser. Un outil qui tourne sans supervision humaine laisse passer des signaux faibles : une alarme incendie sans pompiers au bout du fil.",
            "Protection had relied for about ten years on an endpoint protection product that detected threats and automatically isolated machines above a risk score. Every other alert landed in a console… that nobody had time to analyze. A tool running without human oversight lets weak signals slip through: a fire alarm with no firefighters on the other end."),
          t("L’arrivée à échéance du contrat a été l’occasion de changer de modèle, pas seulement d’outil : ajouter une couche humaine derrière la détection, des analystes capables de contextualiser une alerte et de réagir vite.",
            "The contract coming to an end was the chance to change the model, not just the tool: adding a human layer behind detection, analysts able to put an alert in context and react fast."),
        ],
      },
      {
        id: "besoin", title: t("Le cahier des charges", "The requirements"),
        list: [
          t("**Adapté à une petite équipe** : console lisible, alertes claires, échanges simples avec le SOC. Pas une plateforme pensée pour un SOC interne de vingt personnes.",
            "**Fit for a small team**: a readable console, clear alerts, simple exchanges with the SOC. Not a platform built for a twenty-person in-house SOC."),
          t("**Une enveloppe budgétaire définie** : comparer le coût total (licences, service SOC, déploiement), pas seulement les fonctionnalités.",
            "**A set budget**: compare the total cost (licences, SOC service, rollout), not just features."),
          t("**Évolutif vers l’OT et l’IoT** : un industriel a des réseaux de production à protéger demain. Une solution « IT seulement » aurait été un choix à courte vue.",
            "**Able to grow towards OT and IoT**: a manufacturer has production networks to protect tomorrow. An IT-only product would have been short-sighted."),
          t("**Deux mois, pas un de plus** : étude de marché, rendez-vous, négociation et déploiement devaient avancer en parallèle avant la fin de l’ancien contrat.",
            "**Two months, not a day more**: market study, vendor meetings, negotiation and rollout all had to run in parallel before the old contract expired."),
        ],
      },
      {
        id: "marche", title: t("L’étude de marché", "The market study"),
        paras: [
          t("En deux à quatre semaines, nous avons rencontré cinq prestataires représentant quatre EDR, chacun en démonstration avec une offre chiffrée. Quatre critères guidaient l’évaluation : la qualité et la réactivité du SOC (24/7, matrice d’escalade claire), la détection comportementale (appuyée sur le Magic Quadrant Gartner et les évaluations MITRE ATT&CK), la capacité d’évolution vers le XDR et l’OT, et le prix.",
            "Over two to four weeks, we met five providers representing four EDRs, each with a demo and a priced offer. Four criteria drove the evaluation: SOC quality and responsiveness (24/7, a clear escalation matrix), behavioural detection (backed by the Gartner Magic Quadrant and MITRE ATT&CK evaluations), the ability to grow towards XDR and OT, and price."),
        ],
        table: {
          head: [t("Solution", "Solution"), t("Points forts", "Strengths"), t("Pourquoi pas / pourquoi", "Why not / why"), t("Verdict", "Verdict")],
          rows: [
            ["CrowdStrike Falcon", t("Référence du marché, détection de premier plan", "Market leader, top-tier detection"), t("Hors budget, fonctionnalités surdimensionnées pour notre équipe", "Over budget, more than our team could use"), t("Écarté", "Ruled out")],
            ["SentinelOne", t("Solution reconnue", "Well-established product"), t("Même positionnement tarifaire, sans avantage décisif", "Same price bracket, no decisive edge"), t("Écarté", "Ruled out")],
            ["HarfangLab", t("Éditeur français, souveraineté, RGPD", "French vendor, sovereignty, GDPR"), t("Prix élevé pour un EDR pur, sans XDR ni feuille de route OT/IoT", "High price for a pure EDR, no XDR or OT/IoT roadmap"), t("Écarté", "Ruled out")],
            ["Trend Micro Vision One", t("Console SaaS claire, prix compétitif, XDR, messagerie, OT/IoT", "Clear SaaS console, competitive price, XDR, email, OT/IoT"), t("Proposé avec un SOC qui connaît la plateforme", "Offered with a SOC that knows the platform"), t("Retenu", "Selected")],
          ],
        },
        after: t("La comparaison a été formalisée dans un tableau de synthèse remis à la direction, qui a validé le choix ; le service achats a ensuite négocié le contrat pendant que je préparais le déploiement.",
                 "The comparison was formalized in a summary table for management, who approved the choice; purchasing then negotiated the contract while I prepared the rollout."),
      },
      {
        id: "deploiement", title: t("Le déploiement", "The rollout"), diagram: "edr",
        paras: [
          t("Pas de déploiement massif à l’aveugle. D’abord l’agent installé à la main sur mon propre poste, pour vérifier qu’il cohabitait avec nos outils métier ; puis une OU dédiée dans l’Active Directory avec les postes de l’équipe informatique, pour tester la GPO de déploiement sur nos propres machines avant celles des utilisateurs.",
            "No blind mass rollout. First, the agent installed by hand on my own workstation to check it coexisted with our business tools; then a dedicated OU in Active Directory with the IT team’s machines, to test the deployment GPO on our own computers before users’."),
          t("Le déploiement repose sur une GPO en configuration ordinateur, exécutée au démarrage, qui lance un script PowerShell hébergé sur un partage du contrôleur de domaine. Le script vérifie d’abord que l’agent n’est pas déjà là et que l’ancienne solution a bien disparu (deux agents de sécurité sur un même poste, c’est la garantie de conflits), copie l’installateur en local pour résister aux réseaux instables des portables, puis lance une installation silencieuse.",
            "The rollout relies on a computer-configuration GPO run at startup, which launches a PowerShell script hosted on a domain-controller share. The script first checks that the agent isn’t already there and that the old product is really gone (two security agents on one machine guarantee conflicts), copies the installer locally to survive flaky laptop connections, then runs a silent install."),
          t("Deux cas ont demandé du travail manuel : des postes où l’ancien agent refusait de se désinstaller (outil de désinstallation de l’éditeur, poste par poste), et les serveurs critiques, traités pendant une fenêtre de maintenance le week-end avec retour arrière prévu, pour ne jamais arrêter la production en semaine.",
            "Two cases needed manual work: machines where the old agent refused to uninstall (the vendor’s removal tool, one machine at a time), and critical servers, handled during a weekend maintenance window with a rollback plan, so production never stopped during the week."),
        ],
        code: {
          caption: t("Extrait simplifié du script de déploiement (anonymisé)", "Simplified excerpt of the rollout script (anonymized)"),
          fr: `# Lancé par GPO au démarrage de la machine
$Log      = "C:\\EdrInstall.log"
$Source   = "\\\\<serveur>\\<partage>\\EDR_Agent"
$LocalDir = "C:\\Temp_EDR"
function Log($m) { Add-Content $Log "$(Get-Date -f 'yyyy-MM-dd HH:mm:ss') - $m" }

# 1. Contrôles : agent déjà présent ? ancienne solution encore là ?
if (Get-Service | ? { $_.DisplayName -match "Trend Micro" -or $_.Name -match "Basecamp" }) {
    Log "Agent déjà installé"; exit }
if (Get-Service | ? { $_.DisplayName -match "WithSecure|F-Secure" }) {
    Log "Ancienne solution présente : installation reportée"; exit }

# 2. Copie locale (résiste aux connexions instables des portables)
Remove-Item $LocalDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item $LocalDir -ItemType Directory -Force | Out-Null
Copy-Item "$Source\\*" $LocalDir -Recurse -Force

# 3. Installation silencieuse
Start-Process "$LocalDir\\EndpointBasecamp.exe" -ArgumentList "/quiet" -WorkingDirectory $LocalDir
Log "Installation lancée"`,
          en: `# Run by GPO at machine startup
$Log      = "C:\\EdrInstall.log"
$Source   = "\\\\<server>\\<share>\\EDR_Agent"
$LocalDir = "C:\\Temp_EDR"
function Log($m) { Add-Content $Log "$(Get-Date -f 'yyyy-MM-dd HH:mm:ss') - $m" }

# 1. Checks: agent already there? old product still installed?
if (Get-Service | ? { $_.DisplayName -match "Trend Micro" -or $_.Name -match "Basecamp" }) {
    Log "Agent already installed"; exit }
if (Get-Service | ? { $_.DisplayName -match "WithSecure|F-Secure" }) {
    Log "Old product still present: install postponed"; exit }

# 2. Local copy (survives flaky laptop connections)
Remove-Item $LocalDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item $LocalDir -ItemType Directory -Force | Out-Null
Copy-Item "$Source\\*" $LocalDir -Recurse -Force

# 3. Silent install
Start-Process "$LocalDir\\EndpointBasecamp.exe" -ArgumentList "/quiet" -WorkingDirectory $LocalDir
Log "Install started"`,
        },
      },
      {
        id: "soc", title: t("L’onboarding du SOC", "Onboarding the SOC"),
        paras: [
          t("Un EDR sans paramétrage adapté à son environnement est aveugle : l’analyste doit pouvoir juger en quelques minutes si un comportement est malveillant ou parfaitement normal chez nous. Après une réunion de lancement avec les analystes eux-mêmes, deux ateliers ont servi à cartographier le système d’information et à rédiger l’avenant au contrat de service : qui contacter, comment, et surtout ce que le SOC a le droit de faire seul.",
            "An EDR without tuning to its environment is blind: an analyst must be able to tell within minutes whether a behaviour is malicious or perfectly normal for us. After a kickoff meeting with the analysts themselves, two workshops were used to map the information system and write the service addendum: who to call, how, and above all what the SOC may do on its own."),
        ],
        table: {
          caption: t("Postures de réponse négociées avec le SOC", "Response postures agreed with the SOC"),
          head: [t("Périmètre", "Scope"), t("Heures ouvrées", "Business hours"), t("Hors heures ouvrées", "Off-hours")],
          rows: [
            [t("Serveurs très critiques (contrôleurs de domaine, messagerie…)", "Very critical servers (domain controllers, mail…)"), t("Prudente : le SOC nous appelle avant toute isolation", "Cautious: the SOC calls us before any isolation"), t("Active : le SOC agit seul", "Active: the SOC acts on its own")],
            [t("Serveurs critiques de production", "Critical production servers"), t("Prudente", "Cautious"), t("Active", "Active")],
            [t("Postes utilisateurs", "User workstations"), t("Active : blocage et isolement autonomes", "Active: autonomous blocking and isolation"), t("Active", "Active")],
          ],
        },
        after: t("L’idée : sur un serveur de production, une isolation intempestive peut arrêter une ligne entière, mieux vaut un appel en journée. Sur un poste à 3 h du matin, attendre une validation n’a aucun sens.",
                 "The idea: on a production server, an untimely isolation can stop a whole line, so a phone call during the day is better. On a workstation at 3 a.m., waiting for approval makes no sense."),
      },
      {
        id: "run", title: t("En production : réglages et vraies alertes", "In production: tuning and real alerts"),
        list: [
          t("**Premier faux positif** : l’agent de notre outil d’inventaire a été mis en quarantaine, car il embarque un composant d’exécution à distance qui, hors contexte, ressemble à une porte dérobée. Le SOC nous a appelés, nous avons expliqué l’outil, l’alerte a été qualifiée et close en quelques heures.",
            "**First false positive**: our inventory tool’s agent was quarantined, because it ships a remote-execution component that looks like a backdoor out of context. The SOC called us, we explained the tool, and the alert was triaged and closed within hours."),
          t("**Sécurité contre performance** : un logiciel de production qui lit et écrit massivement des fichiers ralentissait sous l’analyse temps réel. Exclusions ciblées fournies par l’éditeur, puis arbitrage documenté et suivi entre protection et performance, avec le SOC et l’éditeur.",
            "**Security versus performance**: a production application that reads and writes huge numbers of files slowed down under real-time scanning. Targeted exclusions from the vendor, then a documented, tracked trade-off between protection and performance, with the SOC and the vendor."),
          t("**Un vrai positif en moins de 15 minutes** : un exécutable téléchargé depuis une publicité se faisait passer pour un convertisseur PDF (technique MITRE ATT&CK T1036, masquerading). Alerte qualifiée par le SOC en moins d’un quart d’heure, avec une recommandation de suppression appliquée par notre équipe. Avec l’ancienne configuration, l’alerte aurait probablement été générée… et jamais lue.",
            "**A true positive in under 15 minutes**: an executable downloaded from an ad was posing as a PDF converter (MITRE ATT&CK T1036, masquerading). The SOC triaged it in under a quarter of an hour and recommended deletion, which our team applied. With the old setup, the alert would probably have been raised… and never read."),
          t("**Au-delà des incidents** : le point mensuel avec le SOC fait aussi remonter des risques structurels (logiciels obsolètes, identifiants exposés dans des fuites) et déclenche des actions correctives, jusqu’au blocage d’une application vulnérable sur tout le parc.",
            "**Beyond incidents**: the monthly review with the SOC also surfaces structural risks (outdated software, credentials exposed in leaks) and triggers corrective actions, up to blocking a vulnerable application across the whole fleet."),
        ],
      },
      {
        id: "transmission", title: t("Documenter pour transmettre", "Documenting to hand over"),
        paras: [
          t("Chaque problème, configuration ou point de vigilance a alimenté au fil de l’eau une documentation partagée sur la plateforme : prise en main de la console, politiques de scan, exclusions et leur justification, procédures en cas d’incident. Pour faire monter l’équipe en compétence sur les outils de sécurité, j’ai aussi rédigé un référentiel de 22 compétences réparties sur 8 domaines et 4 niveaux. Objectif : qu’à mon départ, l’équipe soit autonome, sans dépendre de formations externes.",
            "Every problem, configuration or point of attention fed a shared documentation of the platform as I went: console basics, scan policies, exclusions and why they exist, incident procedures. To upskill the team on security tools, I also wrote a framework of 22 skills across 8 domains and 4 levels. The goal: when I leave, the team is autonomous, with no need for external training."),
        ],
      },
      {
        id: "lecons", title: t("Ce que j’en retiens", "What I learned"),
        list: [
          t("**Le calendrier a tenu** : la nouvelle solution était déployée avant la fin de l’ancien contrat, sans période sans couverture. C’est ce dont je suis le plus fier.",
            "**The deadline held**: the new solution was rolled out before the old contract ended, with no period without coverage. That’s what I’m proudest of."),
          t("**Ce que je ferais autrement** : une grille d’évaluation formelle avant les démonstrations, un rétroplanning avec jalons (la désinstallation de l’ancien agent a pris plus de temps que prévu) et une prise en main de la console en environnement de test avant la production.",
            "**What I’d do differently**: a formal scoring grid before the demos, a backward schedule with milestones (removing the old agent took longer than planned) and hands-on time with the console in a test environment before production."),
          t("**La cybersécurité, c’est surtout ce qui entoure la technique** : analyse de risque, choix d’outils, relation avec les prestataires, pédagogie auprès des utilisateurs et de la direction. Déployer un agent et écrire un script, c’est finalement ce qui prend le moins de temps.",
            "**Cybersecurity is mostly what surrounds the technology**: risk analysis, tool selection, vendor relationships, explaining things to users and management. Deploying an agent and writing a script is what takes the least time."),
        ],
      },
    ],
    cta: t("Envie d’en parler de vive voix ?", "Want to talk it through?"),
  };
})(window.PF = window.PF || {});
