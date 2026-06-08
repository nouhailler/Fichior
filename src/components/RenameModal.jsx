import React, { useState, useEffect } from 'react';

export default function RenameModal({ files, onClose, onRefresh }) {
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [caseMode, setCaseMode] = useState('none'); // none, upper, lower, title
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const list = files.map(file => {
      let ext = file.ext || '';
      let base = file.name.substring(0, file.name.length - ext.length);
      let newBase = base;

      // 1. Find and replace
      if (findText) {
        try {
          if (useRegex) {
            const regex = new RegExp(findText, 'g');
            newBase = newBase.replace(regex, replaceText);
          } else {
            newBase = newBase.split(findText).join(replaceText);
          }
        } catch (e) {
          // Invalid regex
        }
      }

      // 2. Case Mode
      if (caseMode === 'upper') {
        newBase = newBase.toUpperCase();
      } else if (caseMode === 'lower') {
        newBase = newBase.toLowerCase();
      } else if (caseMode === 'title') {
        newBase = newBase.replace(/\b\w/g, c => c.toUpperCase());
      }

      // 3. Prefix & Suffix
      const newName = `${prefix}${newBase}${suffix}${ext}`;
      const parentDir = file.path.substring(0, file.path.length - file.name.length);

      return {
        src: file.path,
        dest: `${parentDir}${newName}`,
        oldName: file.name,
        newName: newName
      };
    });
    setPreviews(list);
  }, [files, prefix, suffix, findText, replaceText, useRegex, caseMode]);

  const handleRename = async () => {
    try {
      const res = await fetch('/api/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renameList: previews })
      });
      if (res.ok) {
        onRefresh();
        onClose();
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
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Renommer par lots ({files.length} fichiers)</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Préfixe</label>
            <input
              type="text"
              className="search-input"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px' }}
              value={prefix}
              onChange={e => setPrefix(e.target.value)}
              placeholder="ex: projetA_"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Suffixe</label>
            <input
              type="text"
              className="search-input"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px' }}
              value={suffix}
              onChange={e => setSuffix(e.target.value)}
              placeholder="ex: _v1"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Rechercher</label>
            <input
              type="text"
              className="search-input"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px' }}
              value={findText}
              onChange={e => setFindText(e.target.value)}
              placeholder="Texte à remplacer"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Remplacer par</label>
            <input
              type="text"
              className="search-input"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px' }}
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              placeholder="Nouveau texte"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input type="checkbox" checked={useRegex} onChange={e => setUseRegex(e.target.checked)} />
            Utiliser Regex (Expression régulière)
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px' }}>Casse:</span>
            <select
              value={caseMode}
              onChange={e => setCaseMode(e.target.value)}
              style={{ backgroundColor: 'var(--bg-input)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', outline: 'none' }}
            >
              <option value="none">Inchangée</option>
              <option value="upper">MAJUSCULE</option>
              <option value="lower">minuscule</option>
              <option value="title">Majuscule En Début De Mot</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Aperçu en temps réel :</h3>
          <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', backgroundColor: 'var(--bg-main)' }}>
            {previews.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                  {item.oldName}
                </span>
                <span style={{ color: 'var(--success)', fontWeight: '500', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                  ➔ {item.newName}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={handleRename}>Valider le renommage</button>
        </div>
      </div>
    </div>
  );
}
