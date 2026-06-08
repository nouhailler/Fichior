# 📁 Fichior - Le Gestionnaire de Fichiers Intelligent

> **Fichior** est un gestionnaire de fichiers moderne, ultra-rapide et esthétique conçu pour Linux. Il dépasse les limites des explorateurs traditionnels grâce à son moteur d'indexation local, sa recherche en langage naturel et son automatisation poussée.

---

## 🚀 État du Projet & Dashboard
| Fonctionnalité | État | Description |
| :--- | :---: | :--- |
| **Moteur NLP** | ✅ | Recherche en langage naturel (ex: "PDF > 5Mo"). |
| **Indexation Plein Texte** | ✅ | Recherche dans le contenu des PDF, DOCX et Code. |
| **Watchdog (Auto-tri)** | ✅ | Règles "Si... Alors..." pour automatiser le rangement. |
| **Versioning Local** | ✅ | Historique des 3 dernières versions pour chaque fichier. |
| **Quick Look** | ✅ | Aperçu instantané (Espace) sans ouvrir d'application. |
| **Navigation Clavier** | ✅ | Parcourez l'explorateur sans toucher à la souris. |
| **Paquet .deb** | ✅ | Installation native et lancement silencieux. |

---

## ✨ Fonctionnalités Clés

### 🔍 1. Moteur de Recherche de Nouvelle Génération
*   **Langage Naturel** : Tapez intuitivement `"PDF modifiés la semaine dernière"` ou `"images de plus de 5 Mo"`.
*   **Recherche Floue (Fuzzy)** : Tolérance totale aux fautes de frappe (ex: `"raport"` trouve `rapport_final.docx`).
*   **Métadonnées EXIF & ID3** : Retrouvez vos photos par lieu ou vos musiques par artiste.
*   **Dossiers Intelligents** : Sauvegardez vos filtres pour créer des dossiers dynamiques.

### 🏷️ 2. Organisation & Productivité
*   **Tags Colorés & Notes** : Marquez vos fichiers et ajoutez des annotations textuelles indexées.
*   **Historique des Versions** : Restaurez une version antérieure en un clic en cas d'erreur.
*   **Nettoyeur de Doublons** : Libérez de l'espace en détectant les fichiers identiques (Hash MD5).
*   **Renommage en Lot** : Modifiez des dizaines de fichiers simultanément avec aperçu en temps réel.

### ⌨️ 3. Expérience Utilisateur (UX) Premium
*   **Focus Mode** : Appuyez sur `Ctrl + F` pour une recherche style Spotlight/Raycast.
*   **Quick Look** : Prévisualisez vidéos, musiques, PDF et code instantanément.
*   **Clavier First** : Navigation fluide avec les flèches, `Entrée` et `Backspace`.

---

## 📸 Aperçus Visuels

> *Note : Remplacez ces placeholders par vos captures d'écran réelles.*

| Explorateur & Thème Sombre | Mode Focus (Spotlight) |
| :---: | :---: |
| ![Explorateur](https://via.placeholder.com/400x250?text=Explorateur+Fichior) | ![Focus](https://via.placeholder.com/400x250?text=Mode+Focus) |

| Nettoyeur de Doublons | Inspecteur & Tags |
| :---: | :---: |
| ![Doublons](https://via.placeholder.com/400x250?text=Nettoyage+Doublons) | ![Inspecteur](https://via.placeholder.com/400x250?text=Inspecteur+Details) |

---

## 🛠️ Stack Technique
*   **Frontend** : `React`, `Vite`, `Vanilla CSS` (Glassmorphism).
*   **Backend** : `Node.js`, `Express`, `Chokidar` (Surveillance).
*   **Données** : `SQLite` pour l'indexation ultra-rapide.
*   **Parsing** : `pdf-parse`, `mammoth`, `music-metadata`, `exif-parser`.

---

## 🗺️ Roadmap (Prochaines Étapes)

- [ ] **v1.2.0** : Support du Drag & Drop système complet.
- [ ] **v1.3.0** : Intégration Cloud (Google Drive / Dropbox) pour recherche unifiée.
- [ ] **v1.5.0** : Système de plugins pour ajouter des parsers personnalisés.
- [ ] **v2.0.0** : Version Desktop native via Electron ou Tauri.

---

## 📦 Installation (Debian/Ubuntu)

1.  Téléchargez le dernier `.deb` depuis les [Releases](https://github.com/nouhailler/Fichior/releases).
2.  Installez-le :
    ```bash
    sudo dpkg -i fichior_1.0.0_all.deb
    ```
3.  Lancez **Fichior** depuis votre menu d'applications.

---

## 🤝 Contribution
Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une Issue ou une Pull Request pour améliorer Fichior.

---
*Développé avec ❤️ pour la communauté Linux.*
