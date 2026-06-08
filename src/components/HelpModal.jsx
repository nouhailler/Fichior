import React, { useState } from 'react';

const TABS = {
  INTRO: 'Prise en main',
  SEARCH: 'Recherche NLP',
  WATCHDOG: 'Automatisation (Watchdog)',
  VERSIONING: 'Versions Locales',
  STAGING: 'Panier Staging',
  RENAME: 'Renommage en Lot',
  DUPLICATES: 'Doublons',
  SHORTCUTS: 'Raccourcis Clavier'
};

export default function HelpModal({ defaultTab = 'INTRO', onClose }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'INTRO':
        return (
          <div>
            <h3>👋 Bienvenue dans Fichior !</h3>
            <p>Fichior est un gestionnaire de fichiers intelligent conçu pour simplifier l'organisation et la recherche de vos documents locaux sur Linux.</p>
            <p>Pour commencer, explorez vos dossiers depuis le panneau central. Vous pouvez double-cliquer sur un dossier pour y entrer ou cliquer sur un fichier pour afficher ses informations détaillées (tags, notes, historique) dans l'<strong>Inspecteur</strong> de droite.</p>
            <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--accent)', marginTop: '15px' }}>
              <strong>💡 Conseil :</strong> Appuyez sur la touche <strong>Espace</strong> après avoir cliqué sur un fichier pour afficher un aperçu instantané (Quick Look).
            </div>
          </div>
        );
      case 'SEARCH':
        return (
          <div>
            <h3>🔍 Recherche en Langage Naturel & Filtres</h3>
            <p>Le moteur de recherche de Fichior analyse votre texte pour en extraire des filtres SQL automatiques.</p>
            <p><strong>Exemples de requêtes supportées :</strong></p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
              <li><code>pdf de plus de 5 Mo</code> : Filtre les fichiers d'extension PDF et de taille supérieure à 5 Mo.</li>
              <li><code>images modifiées hier</code> : Affiche les images créées ou modifiées dans les dernières 24 heures.</li>
              <li><code>code modifié le mois dernier</code> : Filtre les fichiers de programmation selon leur date.</li>
              <li><code>artiste Daft Punk</code> : Extrait les chansons dont les métadonnées ID3 correspondent.</li>
              <li><code>#urgent factures</code> : Trouve les fichiers contenant le mot "factures" et ayant le tag "#urgent".</li>
            </ul>
            <p>Vous pouvez également enregistrer une requête sous forme de <strong>Dossier Intelligent</strong> dans la barre latérale pour la retrouver instantanément plus tard.</p>
          </div>
        );
      case 'WATCHDOG':
        return (
          <div>
            <h3>🤖 Règles Automatisées Watchdog</h3>
            <p>Le Watchdog surveille vos répertoires en arrière-plan et effectue des actions de tri automatiques dès qu'un fichier y est déposé.</p>
            <p><strong>Comment créer une règle :</strong></p>
            <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>Ouvrez le menu <strong>Watchdog Rules</strong> dans la barre latérale, puis cliquez sur <strong>+</strong> ou remplissez le formulaire.</li>
              <li>Renseignez le <strong>Dossier Source</strong> à écouter (ex: votre dossier Téléchargements).</li>
              <li>Définissez l'<strong>Extension</strong> (ex: <code>.pdf</code> ou <code>*</code> pour tous).</li>
              <li>Définissez le <strong>Dossier Cible</strong> où déplacer automatiquement les fichiers (ex: Documents/PDFs).</li>
              <li>Saisissez éventuellement des <strong>Tags</strong> à appliquer automatiquement séparés par des virgules (ex: <code>à_lire, facture</code>).</li>
            </ol>
          </div>
        );
      case 'VERSIONING':
        return (
          <div>
            <h3>⏳ Historique des Versions Local</h3>
            <p>Fichior protège vos documents contre les modifications involontaires ou les écrasements accidentels.</p>
            <p>Chaque fois que vous modifiez, déplacez, copiez ou écrasez un fichier via Fichior, l'application conserve automatiquement une copie de sauvegarde de l'ancienne version dans un répertoire masqué local (`.fichior/versions`).</p>
            <p><strong>Comment restaurer une version :</strong></p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>Sélectionnez un fichier.</li>
              <li>Consultez la section <strong>Historique de versions local</strong> tout en bas de l'Inspecteur de droite.</li>
              <li>Cliquez sur <strong>Restaurer</strong> à côté de la version souhaitée. Fichior créera une sauvegarde de la version actuelle avant de restaurer l'ancienne.</li>
            </ul>
          </div>
        );
      case 'STAGING':
        return (
          <div>
            <h3>🛒 Le Panier (Staging Area)</h3>
            <p>Le Panier vous évite de devoir faire de multiples allers-retours fastidieux pour copier ou déplacer des fichiers situés dans différents dossiers.</p>
            <p><strong>Utilisation :</strong></p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>Sélectionnez un ou plusieurs fichiers (maintenez <code>Ctrl</code> pour la sélection multiple).</li>
              <li>Cliquez sur le bouton <strong>🛒 Panier (+X)</strong> dans la barre d'outils supérieure pour les stocker temporairement.</li>
              <li>Naviguez dans le dossier de destination finale de votre choix.</li>
              <li>Dans la barre inférieure du Panier, cliquez sur <strong>Copier ici</strong>, <strong>Déplacer ici</strong> ou <strong>Zipper ici</strong> pour traiter tous les fichiers d'un seul coup.</li>
            </ul>
          </div>
        );
      case 'RENAME':
        return (
          <div>
            <h3>✏️ Renommage par Lots Intelligent</h3>
            <p>Modifiez instantanément les noms de dizaines de fichiers selon des règles logiques, avec un aperçu dynamique en temps réel.</p>
            <p><strong>Options de renommage :</strong></p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
              <li><strong>Préfixe & Suffixe</strong> : Ajoute du texte au début ou à la fin des noms.</li>
              <li><strong>Rechercher & Remplacer</strong> : Permet de remplacer des mots. Cochez <em>"Utiliser Regex"</em> pour des critères avancés (ex: <code>^([0-9]+)-</code> pour cibler les chiffres au début).</li>
              <li><strong>Casse</strong> : Convertit les noms en MAJUSCULES, minuscules ou capitales (Majuscule En Début De Mot).</li>
            </ul>
          </div>
        );
      case 'DUPLICATES':
        return (
          <div>
            <h3>🔍 Nettoyeur de Doublons</h3>
            <p>Le nettoyeur de doublons compare la signature numérique unique (Hash MD5) de vos fichiers plutôt que de simples noms, afin d'identifier les copies strictement identiques.</p>
            <p>Cliquez sur <strong>🔍 Doublons</strong> dans le menu latéral pour analyser vos dossiers. L'application regroupe les doublons par contenu et vous suggère de conserver l'original tout en cochant les doublons à détruire en toute sécurité.</p>
          </div>
        );
      case 'SHORTCUTS':
        return (
          <div>
            <h3>⚡ Raccourcis Clavier</h3>
            <p>Utilisez ces raccourcis à tout moment pour naviguer rapidement comme un utilisateur pro :</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 0' }}>Raccourci</th>
                  <th style={{ padding: '8px 0' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}><strong>Espace</strong></td>
                  <td style={{ padding: '8px 0' }}>Quick Look (Aperçu instantané du fichier sélectionné)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}><strong>Ctrl + F</strong> / <strong>Ctrl + Espace</strong></td>
                  <td style={{ padding: '8px 0' }}>Activer/Désactiver le Mode Focus (style Raycast)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}><strong>Echap</strong></td>
                  <td style={{ padding: '8px 0' }}>Fermer l'aperçu ou le mode Focus</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}><strong>Ctrl + Clic</strong></td>
                  <td style={{ padding: '8px 0' }}>Sélectionner plusieurs fichiers dans la grille</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', width: '90%', display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>📖 Centre d'Aide & Documentation</h2>
          <button className="btn" onClick={onClose}>Fermer</button>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexGrow: 1 }}>
          {/* Navigation */}
          <div style={{ width: '220px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '15px', flexShrink: 0 }}>
            {Object.keys(TABS).map(key => (
              <button
                key={key}
                className="btn"
                style={{
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  backgroundColor: activeTab === key ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: activeTab === key ? '#c7d2fe' : 'var(--text-main)',
                  borderColor: activeTab === key ? 'var(--accent)' : 'transparent',
                  padding: '8px 12px',
                  width: '100%'
                }}
                onClick={() => setActiveTab(key)}
              >
                {TABS[key]}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flexGrow: 1, overflowY: 'auto', paddingLeft: '5px' }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
