import React from 'react';

export default function SettingsModal({ viewMode, setViewMode, onReplayOnboarding, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>⚙️ Paramètres de l'application</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
          
          {/* View Mode Settings */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Mode d'affichage par défaut
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn"
                style={{
                  flexGrow: 1,
                  backgroundColor: viewMode === 'grid' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  borderColor: viewMode === 'grid' ? 'var(--accent)' : 'var(--border-color)',
                  color: viewMode === 'grid' ? '#c7d2fe' : 'var(--text-main)'
                }}
                onClick={() => setViewMode('grid')}
              >
                🖼️ Grille d'icônes
              </button>
              <button
                className="btn"
                style={{
                  flexGrow: 1,
                  backgroundColor: viewMode === 'list' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  borderColor: viewMode === 'list' ? 'var(--accent)' : 'var(--border-color)',
                  color: viewMode === 'list' ? '#c7d2fe' : 'var(--text-main)'
                }}
                onClick={() => setViewMode('list')}
              >
                📝 Liste détaillée
              </button>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '10px 0' }} />

          {/* Onboarding Guide Setting */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Guide de démarrage
            </label>
            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                onReplayOnboarding();
                onClose();
              }}
            >
              👋 Relancer le guide d'accueil
            </button>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '10px 0' }} />

          {/* Version specs */}
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            <div>Version de Fichior : v1.0.0</div>
            <div>Moteur d'indexation : SQLite 3</div>
            <div>Statut : Prêt</div>
          </div>

        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
