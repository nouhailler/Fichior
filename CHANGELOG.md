# 📝 Journal des Modifications (Changelog) - Fichior

Toutes les modifications notables apportées à ce projet sont répertoriées dans ce fichier.

---

## [1.0.0] - 2026-06-08

### 🚀 Ajouts Majeurs

#### 1. Moteur Backend & Indexation (`server.js`, `db.js`, `indexer.js`)
* Création du serveur API avec Express et d'une base de données SQLite pour stocker l'index des fichiers.
* Intégration de `pdf-parse` et `mammoth` pour indexer le contenu des fichiers PDF et Word.
* Intégration d'extracteurs de métadonnées pour lire les tags EXIF (photos JPEG) et ID3 (musique MP3/OGG/FLAC).
* Calcul automatique d'empreintes numériques (Hash MD5) de chaque fichier pour la recherche de doublons.

#### 2. Compilateur Langage Naturel (`natural_language.js`)
* Implémentation d'un parseur de requêtes textuelles qui compile des expressions humaines en clauses SQL.
* Support pour les recherches par taille (ex: `> 5 Mo`), type (`pdf`, `code`, `images`, `musique`), tags (`#urgent`), dates (`semaine dernière`, `hier`) et artistes.

#### 3. Gestionnaire de Versions Local (`versions.js`)
* Implémentation d'un système de sauvegarde silencieux qui conserve les 3 dernières copies d'un fichier écrasé ou modifié dans le répertoire masqué `.fichior/versions/`.
* Option de restauration directe depuis l'inspecteur d'interface.

#### 4. Règles Watchdog (`watchdog.js`)
* Intégration de `chokidar` pour surveiller les répertoires.
* Exécution automatique d'actions de tri : déplacement de fichiers et application de tags automatiques lorsqu'un fichier correspondant à une extension donnée est créé dans un dossier surveillé.

#### 5. Interface Graphique React & Thème Custom (`src/`)
* Création d'une interface utilisateur sombre moderne avec animations et transparence.
* **Explorateur** : Navigation fluide, filtres par tags et dossiers intelligents.
* **Inspecteur de Fichier** : Gestion des tags, des commentaires textuels et de l'historique des versions.
* **Panier de Staging** : Module de traitement collectif permettant de copier, déplacer ou compresser en ZIP plusieurs fichiers.
* **Quick Look (Espace)** : Fenêtre d'aperçu multimédia instantané (vidéo, son, code, markdown, documents).
* **Mode Focus (`Ctrl + F`)** : Fenêtre de recherche épurée style Spotlight/Raycast.
* **Nettoyeur de Doublons** : Panneau listant les fichiers identiques avec outil de suppression sélective.
* **Renommage par Lots** : Interface interactive appliquant des préfixes, suffixes, corrections de casse et expressions régulières (Regex) en temps réel.

#### 6. Paquet de Distribution Debian (`build_deb.sh`)
* Écriture d'un script d'assemblage automatisé qui génère un paquet d'installation `.deb` standard avec lanceur d'application et icône personnalisée intégrés.
* Publication de la release officielle sur GitHub.
