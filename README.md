# Portfolio — Oscar Ginet

**En ligne : https://oscarginet31-sudo.github.io/** (GitHub Pages, publié depuis la branche `main` à chaque `git push`).

Trois façons de visiter le même contenu :

- **`index.html`** : la galaxie 3D (Three.js). Chaque étoile est une section, chaque planète un projet ou une compétence.
- **`classic.html`** : la version classique, défilante, pensée pour les recruteurs pressés (et l'impression).
- **`etude-edr.html`** : l'étude de cas détaillée du projet EDR + SOC (tirée du mémoire de BUT, anonymisée).

Tout fonctionne en double-clic : pas de build, pas de serveur, **aucune ressource externe** (Three.js et les polices sont hébergés dans `assets/vendor/`).

## Modifier le contenu

Tout le texte vit dans **`assets/js/data/content.js`**, en français et en anglais (`t("fr", "en")`). Toutes les pages se mettent à jour d'un coup.

- `*texte*` dans un titre = partie en italique.
- `short` = nom court affiché sur les planètes 3D (le nom complet reste dans les fiches).
- `ctx` = où une compétence / un projet est pratiqué : `pro` (Lamberet), `iut`, `perso`.
- `diagram` = schéma d'architecture affiché dans la fiche du projet (`ad`, `edr`, `backup`, `monitoring`, dessinés dans `data/diagrams.js`).
- `link` = lien en bas de la fiche (étude de cas, dépôt GitHub…).
- `cv` = textes propres au CV ; `tour` = étapes de la visite guidée de la galaxie.

L'étude de cas a son propre fichier : **`assets/js/data/case-edr.js`**.

**Après chaque modification du contenu**, régénérer les fichiers dérivés :

```
python3 tools/prerender.py    # HTML statique du mode classique et de l'étude de cas
python3 tools/build_cv.py     # CV PDF FR + EN
```

(les deux nécessitent Google Chrome).

## Référencement (HTML pré-rendu)

Les pages sont construites en JavaScript, mais `tools/prerender.py` injecte le résultat final dans `classic.html` et `etude-edr.html` entre des marqueurs `<!--prerender:id-->`. Google, les aperçus LinkedIn et les navigateurs sans JavaScript lisent donc tout le contenu. Avec JavaScript, la page se rend comme avant par-dessus. Ne pas éditer à la main le HTML entre les marqueurs : il est écrasé à chaque exécution.

## Le CV (PDF)

`CV_Ginet_Oscar.pdf` (FR) et `CV_Ginet_Oscar_EN.pdf` (EN) sont générés depuis **`cv.html`**, qui lit le même `content.js`. Le site sert automatiquement le CV dans la langue choisie.

**Téléphone** : il n'apparaît sur aucune page du site ni dans le code, seulement dans les CV PDF. `build_cv.py` le lit dans **`tools/private.json`** (fichier local, ignoré par Git) et ne l'injecte que dans les PDF :

```
{"phone": "+33 6 12 34 56 78"}
```

Sans ce fichier, le CV est généré sans numéro (à recréer sur un nouvel ordinateur).

## Image d'aperçu de partage

`og-cover.jpg` (1200×630) s'affiche quand le lien est partagé sur LinkedIn, Teams, WhatsApp… Pour la régénérer : servir le dossier (`python3 -m http.server`), ouvrir `/tools/og.html` dans un navigateur, puis « Télécharger ».
Les balises `og:image`, `og:url` et `canonical` pointent vers l'adresse en ligne (à changer en cas de nom de domaine personnel, comme `sitemap.xml`, `robots.txt` et `security.txt`).

## Sécurité

- **CSP stricte** sur chaque page : scripts et polices uniquement depuis le site, aucun script en ligne, aucune iframe, aucun formulaire externe.
- `referrer: no-referrer` : aucune URL n'est transmise aux sites liés.
- **Zéro tiers** : pas de CDN, pas de Google Fonts, pas d'analytics (licences complètes : `assets/vendor/three/LICENSE` en MIT, `assets/vendor/fonts/OFL.txt`).
- `.well-known/security.txt` : contact pour signaler une vulnérabilité (à renouveler avant octobre 2027).
- `robots.txt` : `tools/` et `cv.html` exclus de l'indexation.
- Schémas et étude de cas **anonymisés** : aucun nom de serveur, d'IP, de chemin interne, de collègue ni de prestataire.

## Accessibilité

Contrastes WCAG AA vérifiés dans les deux thèmes, lien d'évitement vers le mode classique depuis la 3D, fiches 3D en `dialog` avec gestion du focus, navigation clavier complète, animations réduites si `prefers-reduced-motion`.

## Dans la galaxie

- **Viseur FPS** : il suit la souris et se verrouille sur les cibles ; clic = ouvrir. Bords de l'écran = orienter le vaisseau.
- **Visite guidée** : bouton « Visite guidée · 1 min » de l'intro, bouton ▶ du dock ou touche `T`.
- **Terminal caché** : touche `/` ou bouton `>_` (`help`, `goto projets`, `open veeam`, `case`, `nmap`, `neofetch`, `sudo hire oscar`…).
- **Mobile** : bouton gyroscope pour regarder autour de soi en inclinant le téléphone (permission demandée sur iPhone).
- **Succès caché** : découvrir toutes les planètes débloque un dernier secret.

## Structure

```
index.html, classic.html     pages principales
etude-edr.html               étude de cas EDR + SOC
cv.html                      source des CV PDF
CV_Ginet_Oscar*.pdf          CV téléchargeables (FR, EN)
og-cover.jpg                 image d'aperçu de partage
.well-known/security.txt     contact sécurité
sitemap.xml, robots.txt      référencement
.nojekyll                    GitHub Pages sert les fichiers tels quels (dont .well-known/)
tools/                       prerender.py (HTML statique), build_cv.py (CV PDF), og.html (image d'aperçu)
assets/vendor/               Three.js r128 + post-traitement, polices woff2 (hébergés en local)
assets/css/
  fonts.css                  @font-face locales
  base.css                   couleurs (thème clair/sombre), boutons, tags, schémas
  space.css                  HUD, viseur et fiches de la galaxie 3D
  classic.css                mode classique et étude de cas
assets/js/
  data/content.js            ← le contenu (source unique)
  data/case-edr.js           contenu de l'étude de cas
  data/diagrams.js           schémas d'architecture (SVG, FR/EN)
  data/systems.js            adapte le contenu en systèmes stellaires (3D)
  core/early.js              thème + drapeau JS avant le premier rendu (dans <head>)
  core/utils.js              outils maths, pré-rendu
  ui/i18n.js, ui/theme.js    langue FR/EN et thème, partagés par toutes les pages
  classic.js, case.js, cv.js rendu du mode classique, de l'étude de cas, du CV
  scene/                     moteur 3D : shaders, cosmos, planètes, comète, vol, post-traitement
  ui/                        HUD 3D, fiches, intro, son, visite guidée, terminal
  main3d.js                  assemblage de la galaxie
_archive/                    anciennes versions, non chargées, hors Git
```

## Lancer en local

Double-cliquer sur `index.html` suffit. Pour un serveur local : `python3 -m http.server 4173` puis http://localhost:4173.
