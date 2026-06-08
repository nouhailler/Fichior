import React, { useState, useEffect } from 'react';

export default function DuplicateFinder({ onClose, onRefreshExplorer }) {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState({}); // { [path]: boolean }

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/files/duplicates');
      if (res.ok) {
        const data = await res.json();
        setDuplicates(data);

        // Pre-select duplicates for deletion (leaving the first one unchecked by default)
        const initialSelections = {};
        data.forEach(group => {
          // Keep first file, check others for deletion
          group.paths.slice(1).forEach(p => {
            initialSelections[p] = true;
          });
        });
        setSelectedPaths(initialSelections);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const handleToggle = (path) => {
    setSelectedPaths(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleDelete = async () => {
    const pathsToDelete = Object.keys(selectedPaths).filter(p => selectedPaths[p]);
    if (pathsToDelete.length === 0) return;

    if (!window.confirm(`Voulez-vous vraiment supprimer définitivement ces ${pathsToDelete.length} fichiers en double ?`)) {
      return;
    }

    try {
      const res = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: pathsToDelete })
      });

      if (res.ok) {
        alert('Doublons supprimés avec succès.');
        fetchDuplicates();
        onRefreshExplorer();
      } else {
        const data = await res.json();
        alert(`Erreur: ${data.error}`);
      }
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Nettoyeur de doublons</h2>
          <button className="btn" onClick={onClose}>Fermer</button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Analyse des doublons en cours...</div>
        ) : duplicates.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Aucun fichier en double détecté (par empreinte numérique hash).</div>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '15px' }}>
              Les fichiers suivants ont été identifiés comme identiques par leur contenu (hash MD5). Cochez les copies que vous souhaitez supprimer.
            </p>
            <div style={{ overflowY: 'auto', maxHeight: '50vh', display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              {duplicates.map((group, groupIdx) => (
                <div key={groupIdx} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', backgroundColor: 'var(--bg-main)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                    <span style={{ fontWeight: 'bold' }}>Groupe {groupIdx + 1} - {group.names[0]}</span>
                    <span style={{ color: 'var(--accent)' }}>Taille: {(group.totalSize / (1024 * 1024)).toFixed(2)} Mo cumulés</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {group.paths.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                        <input
                          type="checkbox"
                          checked={!!selectedPaths[p]}
                          onChange={() => handleToggle(p)}
                        />
                        <span style={{ color: selectedPaths[p] ? 'var(--danger)' : 'var(--success)', fontWeight: 'bold' }}>
                          {idx === 0 ? '[CONSERVER]' : '[SUPPRIMER]'}
                        </span>
                        <span style={{ wordBreak: 'break-all', color: 'var(--text-main)' }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Fichiers sélectionnés pour suppression : {Object.keys(selectedPaths).filter(p => selectedPaths[p]).length}
              </span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn" onClick={onClose}>Annuler</button>
                <button className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleDelete}>
                  Supprimer les doublons sélectionnés
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
