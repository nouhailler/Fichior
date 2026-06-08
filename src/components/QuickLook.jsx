import React, { useEffect, useState } from 'react';

export default function QuickLook({ file, onClose }) {
  const [textPreview, setTextPreview] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) return;

    const isText =
      file.type.startsWith('text/') ||
      file.type === 'application/json' ||
      file.type === 'application/javascript' ||
      ['.js', '.jsx', '.ts', '.tsx', '.py', '.c', '.cpp', '.h', '.html', '.css', '.md', '.txt', '.sh', '.yml', '.yaml', '.rs', '.go', '.java'].includes(file.ext);

    if (isText) {
      setLoading(true);
      fetch(`/api/files/preview-text?path=${encodeURIComponent(file.path)}`)
        .then(res => res.text())
        .then(data => {
          setTextPreview(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setTextPreview('Failed to load text preview');
          setLoading(false);
        });
    }
  }, [file]);

  if (!file) return null;

  const renderContent = () => {
    if (loading) {
      return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Chargement de l'aperçu...</div>;
    }

    // Image preview
    if (file.type.startsWith('image/')) {
      return (
        <img
          src={`/api/files/download?path=${encodeURIComponent(file.path)}`}
          alt={file.name}
          className="quicklook-preview-image"
        />
      );
    }

    // Video preview
    if (file.type.startsWith('video/')) {
      return (
        <video
          controls
          autoPlay
          style={{ width: '100%', maxHeight: '100%', outline: 'none' }}
          src={`/api/files/download?path=${encodeURIComponent(file.path)}`}
        />
      );
    }

    // Audio preview
    if (file.type.startsWith('audio/')) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
          <div style={{ fontSize: '72px' }}>🎵</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{file.name}</div>
          {file.metadata?.title && <div style={{ color: 'var(--text-muted)' }}>{file.metadata.title} - {file.metadata.artist}</div>}
          <audio
            controls
            autoPlay
            style={{ width: '80%' }}
            src={`/api/files/download?path=${encodeURIComponent(file.path)}`}
          />
        </div>
      );
    }

    // PDF preview
    if (file.ext === '.pdf') {
      return (
        <iframe
          src={`/api/files/download?path=${encodeURIComponent(file.path)}`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={file.name}
        />
      );
    }

    // Text/Code preview
    const isText =
      file.type.startsWith('text/') ||
      file.type === 'application/json' ||
      file.type === 'application/javascript' ||
      ['.js', '.jsx', '.ts', '.tsx', '.py', '.c', '.cpp', '.h', '.html', '.css', '.md', '.txt', '.sh', '.yml', '.yaml', '.rs', '.go', '.java'].includes(file.ext);

    if (isText) {
      return <pre className="quicklook-content-text">{textPreview}</pre>;
    }

    // Fallback: Generic details
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
        <div style={{ fontSize: '72px' }}>📄</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{file.name}</div>
        <div style={{ color: 'var(--text-muted)' }}>Type: {file.type}</div>
        <div style={{ color: 'var(--text-muted)' }}>Taille: {(file.size / (1024 * 1024)).toFixed(2)} Mo</div>
        {file.metadata && (
          <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-input)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Métadonnées extraites:</div>
            <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
              {JSON.stringify(file.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content quicklook-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Aperçu rapide : {file.name}</h2>
          <button className="btn" onClick={onClose}>Fermer</button>
        </div>
        <div className="quicklook-body">{renderContent()}</div>
      </div>
    </div>
  );
}
