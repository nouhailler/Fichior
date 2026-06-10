import React, { useState, useEffect } from 'react';

export default function SettingsModal({ viewMode, setViewMode, onReplayOnboarding, onClose }) {
  const [cloudAccounts, setCloudAccounts] = useState([]);

  const fetchCloudStatus = async () => {
    try {
      const res = await fetch('/api/cloud/status');
      if (res.ok) setCloudAccounts(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchCloudStatus();
  }, []);

  const handleLink = async (provider) => {
    try {
      const res = await fetch(`/api/cloud/auth-url/${provider}`);
      const { url } = await res.json();
      window.open(url, '_blank', 'width=600,height=600');
      // Refresh status after some time or via a listener
      setTimeout(fetchCloudStatus, 5000);
    } catch (err) { alert('Erreur lors de la liaison'); }
  };

  const handleUnlink = async (provider) => {
    if (confirm(`Déconnecter ${provider} ?`)) {
      await fetch(`/api/cloud/${provider}`, { method: 'DELETE' });
      fetchCloudStatus();
    }
  };

  const isLinked = (provider) => cloudAccounts.some(acc => acc.provider === provider);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>⚙️ Paramètres de l'application</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
          
          {/* Cloud Accounts Section */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              Comptes Cloud (Recherche Unifiée)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🤖</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>Google Drive</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isLinked('google') ? cloudAccounts.find(a => a.provider === 'google').email : 'Non connecté'}</div>
                  </div>
                </div>
                {isLinked('google') ? (
                  <button className="btn" style={{ color: 'var(--danger)', fontSize: '12px' }} onClick={() => handleUnlink('google')}>Déconnecter</button>
                ) : (
                  <button className="btn btn-primary" style={{ fontSize: '12px' }} onClick={() => handleLink('google')}>Connecter</button>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>📦</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>Dropbox</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isLinked('dropbox') ? 'Connecté' : 'Non connecté'}</div>
                  </div>
                </div>
                {isLinked('dropbox') ? (
                  <button className="btn" style={{ color: 'var(--danger)', fontSize: '12px' }} onClick={() => handleUnlink('dropbox')}>Déconnecter</button>
                ) : (
                  <button className="btn btn-primary" style={{ fontSize: '12px' }} onClick={() => handleLink('dropbox')}>Connecter</button>
                )}
              </div>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Note: Pour fonctionner hors environnement de démo, configurez vos Client IDs dans le fichier .env
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '5px 0' }} />

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
            <div>Version de Fichior : v2.0.0 (Native Desktop)</div>
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
