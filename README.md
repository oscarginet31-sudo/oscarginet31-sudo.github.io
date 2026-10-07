# Portfolio — Oscar Ginet

Deux façons de visiter le même contenu :

- **`index.html`** — la galaxie 3D (Three.js) : chaque étoile est une section, chaque planète un projet ou une compétence.
- **`classic.html`** — la version classique, défilante, pensée pour les recruteurs pressés (et l'impression).

Les deux fonctionnent en double-clic (pas de build, pas de serveur requis). Une connexion est nécessaire pour les polices et Three.js (CDN).

## Modifier le contenu

Tout le texte vit dans **`assets/js/data/content.js`**, en français et en anglais (`t("fr", "en")`). Les deux versions du site se mettent à jour d'un coup.

- `*texte*` dans un titre = partie en italique.
- `short` = nom court affiché sur les planètes 3D (le nom complet reste dans les fiches).
- `ctx` = où une compétence / un projet est pratiqué : `pro` (Lamberet), `iut`, `perso`.
- `cv` = textes propres au CV ; `tour` = étapes de la visite guidée de la galaxie.

## Le CV (PDF)

`CV_Ginet_Oscar.pdf` (FR) et `CV_Ginet_Oscar_EN.pdf` (EN) sont générés depuis **`cv.html`**, qui lit le même
`content.js` que le site. Après une modification du contenu :

```
python3 tools/build_cv.py
```

(nécessite Google Chrome). Le site sert automatiquement le CV dans la langue choisie.

## Image d'aperçu de partage

`og-cover.jpg` (1200×630) s'affiche quand le lien est partagé sur LinkedIn, Teams, WhatsApp… Pour la régénérer :
servir le dossier (`python3 -m http.server`), ouvrir `/tools/og.html` dans un navigateur, puis « Télécharger ».
Une fois le site en ligne, remplacer `og-cover.jpg` par son URL absolue dans les balises `og:image` de `index.html` et `classic.html`.

## Dans la galaxie

- **Visite guidée** : bouton « Visite guidée · 1 min » de l'intro, bouton ▶ du dock ou touche `T`.
- **Terminal caché** : touche `/` ou bouton `>_` — `help`, `goto projets`, `open veeam`, `nmap`, `neofetch`, `sudo hire oscar`…

## Structure

```
index.html, classic.html     pages
cv.html                      source des CV PDF
CV_Ginet_Oscar*.pdf          CV téléchargeables (FR, EN)
og-cover.jpg                 image d'aperçu de partage
tools/                       build_cv.py (CV PDF), og.html (image d'aperçu)
assets/css/
  base.css                   couleurs (thème clair/sombre), boutons, tags partagés
  space.css                  HUD et fiches de la galaxie 3D
  classic.css                mise en page du mode classique
assets/js/
  data/content.js            ← le contenu (source unique)
  data/systems.js            adapte le contenu en systèmes stellaires (3D)
  core/utils.js              outils maths
  ui/i18n.js, ui/theme.js    langue FR/EN et thème, partagés par les deux pages
  classic.js                 rendu du mode classique
  scene/                     moteur 3D : shaders, cosmos, planètes, vol, post-traitement
  ui/                        HUD 3D, fiches, intro, son, visite guidée, terminal
  main3d.js                  assemblage de la galaxie
_archive/                    anciennes versions, non chargées (supprimable)
```

## Lancer en local

Double-cliquer sur `index.html` suffit. Pour un serveur local : `python3 -m http.server 4173` puis http://localhost:4173.
