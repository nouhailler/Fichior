# 📁 Fichior - Gestionnaire de fichiers intelligent

Fichior est une application de gestion de fichiers moderne, ultra-rapide et esthétique conçue pour dépasser les limites de recherche des gestionnaires traditionnels comme Nautilus sur Linux. 

Grâce à son moteur d'indexation local et à sa recherche en langage naturel, Fichior vous permet de retrouver n'importe quel document instantanément, d'automatiser des tâches répétitives et de gérer vos versions locales en toute simplicité.

---

## ✨ Fonctionnalités Clés

### 🔍 1. Moteur de Recherche Avancé
* **Langage Naturel** : Tapez intuitivement `"PDF modifiés la semaine dernière"` ou `"images de plus de 5 Mo"` pour appliquer des filtres automatiques.
* **Recherche Floue (Fuzzy Search)** : Tolérance totale aux fautes de frappe (ex: `"raport"` trouve `rapport_final.docx`).
* **Recherche Plein Texte (Full-text)** : Indexation du contenu textuel des fichiers **PDF**, **DOCX**, **TXT** et du code source avec un snippet du passage correspondant.
* **Métadonnées EXIF & ID3** : Recherche par tag de photos (ex: modèle de caméra, lieu) ou de musiques (ex: artiste, album).
* **Dossiers Virtuels Intelligents** : Sauvegardez des filtres pour créer des dossiers dynamiques (ex: dossier "Factures urgentes" qui affiche les PDF contenant "facture" tagués `#urgent`).

### 🏷️ 2. Organisation & Historique
* **Tags Colorés** : Marquez vos fichiers avec des étiquettes personnalisées (`#projetA`, `#urgent`, `#facture`) indépendamment de leur emplacement.
* **Notes & Commentaires** : Ajoutez des annotations textuelles liées à vos fichiers, entièrement indexées dans le moteur de recherche.
* **Historique des Versions** : Fichior conserve silencieusement une copie des 3 dernières versions de vos fichiers modifiés. Restaurez une version antérieure en un clic.

### ⚡ 3. Productivité & Actions en Lot
* **Le Panier (Staging Area)** : Glissez-déposez des fichiers de différents dossiers dans un panier temporaire pour les copier, déplacer ou compresser en ZIP en une seule fois.
* **Renommage en Lot Intelligent** : Modifiez les noms de dizaines de fichiers en temps réel avec des préfixes/suffixes, modification de casse ou expressions régulières (Regex).
* **Nettoyeur de Doublons** : Détectez et supprimez les fichiers en double grâce à leur signature numérique (Hash MD5), pour libérer de l'espace en toute sécurité.

### 🖥️ 4. Interface & Expérience Utilisateur
* **Quick Look (Barre d'Espace)** : Prévisualisez instantanément des images, vidéos, musiques, fichiers markdown, PDFs ou code source en appuyant sur la barre d'espace.
* **Mode "Focus" (Style Raycast/Spotlight)** : Tappez `Ctrl + Space` ou `Ctrl + F` pour ouvrir un moteur de recherche minimaliste flottant au-dessus de tout le reste.
* **Thème Sombre Premium** : Interface épurée avec des effets de transparence (glassmorphism) et des animations fluides.

### 🤖 5. Watchdog (Automatisation)
* Créez des règles automatisées "Si... Alors..." pour trier vos fichiers à votre place.
* *Exemple* : *"Si un fichier `.pdf` arrive dans mon dossier `Téléchargements`, le déplacer automatiquement dans `Documents/PDFs` et lui appliquer le tag `#à_lire`."*

---

## 🛠️ Stack Technique
* **Frontend** : React, Vite, CSS personnalisé.
* **Backend** : Node.js, Express, Chokidar (surveillance de fichiers).
* **Base de données** : SQLite (via `sqlite3` / `sqlite`) pour l'indexation rapide.
* **Parsing** : `pdf-parse`, `mammoth` (DOCX), `music-metadata`, `exif-parser`.

---

## 🚀 Démarrage Rapide

### Prérequis
* [Node.js](https://nodejs.org/) (v18 ou supérieur)
* [npm](https://www.npmjs.com/)

### Installation
1. Clonez ce dépôt.
2. Installez les dépendances :
   ```bash
   npm install
   ```

### Lancement
1. **Générer le build de production** :
   ```bash
   npm run build
   ```
2. **Démarrer le serveur** :
   ```bash
   npm run start
   ```
3. Ouvrez votre navigateur sur **[http://localhost:5000](http://localhost:5000)**.
