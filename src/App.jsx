import React, { useState, useEffect, useRef } from 'react';
import QuickLook from './components/QuickLook.jsx';
import RenameModal from './components/RenameModal.jsx';
import DuplicateFinder from './components/DuplicateFinder.jsx';
import HelpModal from './components/HelpModal.jsx';
import OnboardingModal from './components/OnboardingModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';

export default function App() {
  // Explorer state
  const [currentDir, setCurrentDir] = useState('/home/homardsheriff/gemini-workspace/Fichior');
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [multiSelect, setMultiSelect] = useState([]); // Array of paths
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState(null);
  const [activeSmartFolder, setActiveSmartFolder] = useState(null);

  // Inspector details
  const [fileNote, setFileNote] = useState('');
  const [fileTags, setFileTags] = useState([]);
  const [fileVersions, setFileVersions] = useState([]);

  // Modals & Panels state
  const [showQuickLook, setShowQuickLook] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDuplicateFinder, setShowDuplicateFinder] = useState(false);
  const [showWatchdogModal, setShowWatchdogModal] = useState(false);
  const [showSmartFolderModal, setShowSmartFolderModal] = useState(false);
  
  // Settings & Onboarding state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Help Modal
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpTab, setHelpTab] = useState('INTRO');

  // Basket (Staging area)
  const [basket, setBasket] = useState([]);

  // Focus Mode
  const [focusMode, setFocusMode] = useState(false);
  const [focusQuery, setFocusQuery] = useState('');
  const [focusResults, setFocusResults] = useState([]);
  const [focusSelectedIndex, setFocusSelectedIndex] = useState(0);

  // DB Config Lists
  const [allTags, setAllTags] = useState([]);
  const [smartFolders, setSmartFolders] = useState([]);
  const [watchdogRules, setWatchdogRules] = useState([]);

  // New forms config
  const [newSmartFolderName, setNewSmartFolderName] = useState('');
  const [newSmartFolderQuery, setNewSmartFolderQuery] = useState('');

  const [wdSource, setWdSource] = useState('');
  const [wdExt, setWdExt] = useState('');
  const [wdDest, setWdDest] = useState('');
  const [wdTags, setWdTags] = useState('');

  // Indexing status message
  const [indexingMsg, setIndexingMsg] = useState('');

  // Onboarding auto-run check
  useEffect(() => {
    const onboarded = localStorage.getItem('fichior_onboarded');
    if (!onboarded) {
      setShowOnboarding(true);
    }
  }, []);

  // Fetch file list
  const fetchFiles = async () => {
    try {
      let url = `/api/files?dir=${encodeURIComponent(currentDir)}`;
      if (searchQuery) {
        url = `/api/files?search=${encodeURIComponent(searchQuery)}`;
      } else if (activeTagFilter) {
        url = `/api/files?tag=${encodeURIComponent(activeTagFilter)}`;
      } else if (activeSmartFolder) {
        url = `/api/files?smartFolderId=${encodeURIComponent(activeSmartFolder.id)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  // Fetch lists
  const fetchDbLists = async () => {
    try {
      const tagsRes = await fetch('/api/tags');
      if (tagsRes.ok) setAllTags(await tagsRes.json());

      const sfRes = await fetch('/api/smart-folders');
      if (sfRes.ok) setSmartFolders(await sfRes.json());

      const wdRes = await fetch('/api/watchdog-rules');
      if (wdRes.ok) setWatchdogRules(await wdRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentDir, searchQuery, activeTagFilter, activeSmartFolder]);

  useEffect(() => {
    fetchDbLists();
  }, []);

  // Update selection details
  useEffect(() => {
    if (!selectedFile || selectedFile.type === 'directory') {
      setFileNote('');
      setFileTags([]);
      setFileVersions([]);
      return;
    }

    setFileNote(selectedFile.note || '');
    setFileTags(selectedFile.tags || []);

    // Get versions
    fetch(`/api/files/versions?filePath=${encodeURIComponent(selectedFile.path)}`)
      .then(res => res.json())
      .then(data => setFileVersions(data))
      .catch(err => console.error(err));
  }, [selectedFile]);

  // Focus Mode Search
  useEffect(() => {
    if (!focusMode || !focusQuery) {
      setFocusResults([]);
      return;
    }
    fetch(`/api/files?search=${encodeURIComponent(focusQuery)}`)
      .then(res => res.json())
      .then(data => {
        setFocusResults(data.slice(0, 10)); // max 10
        setFocusSelectedIndex(0);
      });
  }, [focusQuery, focusMode]);

  // Keyboard Navigation & Spacebar listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Avoid keyboard navigation if an input or textarea is focused
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          document.activeElement.blur();
        }
        return;
      }

      // Focus mode toggle (Ctrl + Space or Ctrl + F)
      if (e.ctrlKey && (e.key === ' ' || e.key === 'f')) {
        e.preventDefault();
        setFocusMode(prev => !prev);
        setFocusQuery('');
        return;
      }

      if (focusMode) {
        if (e.key === 'Escape') {
          setFocusMode(false);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusSelectedIndex(idx => Math.min(focusResults.length - 1, idx + 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusSelectedIndex(idx => Math.max(0, idx - 1));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (focusResults[focusSelectedIndex]) {
            const file = focusResults[focusSelectedIndex];
            setSelectedFile(file);
            setFocusMode(false);
            if (file.type === 'directory') {
              setCurrentDir(file.path);
            } else {
              setShowQuickLook(true);
            }
          }
        }
        return;
      }

      // Explorer Keyboard Navigation
      if (files.length > 0) {
        const currentIndex = selectedFile ? files.findIndex(f => f.path === selectedFile.path) : -1;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = Math.min(files.length - 1, currentIndex + 1);
          setSelectedFile(files[nextIndex]);
          setMultiSelect([files[nextIndex].path]);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const nextIndex = Math.max(0, currentIndex - 1);
          setSelectedFile(files[nextIndex]);
          setMultiSelect([files[nextIndex].path]);
        } else if (e.key === 'Enter' && selectedFile) {
          e.preventDefault();
          if (selectedFile.type === 'directory') {
            setCurrentDir(selectedFile.path);
            setSelectedFile(null);
            setMultiSelect([]);
          } else {
            setShowQuickLook(true);
          }
        } else if (e.key === 'Backspace' && !e.ctrlKey) {
          e.preventDefault();
          navigateUp();
        }
      }

      // Spacebar for Quick Look
      if (e.key === ' ' && selectedFile) {
        e.preventDefault();
        setShowQuickLook(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, focusMode, focusResults, focusSelectedIndex, files, currentDir]);

  // Handle single file click
  const handleFileClick = (file, e) => {
    if (e.ctrlKey) {
      // Multi-select
      setMultiSelect(prev =>
        prev.includes(file.path) ? prev.filter(p => p !== file.path) : [...prev, file.path]
      );
    } else {
      setSelectedFile(file);
      setMultiSelect([file.path]);
    }
  };

  const navigateUp = () => {
    const parts = currentDir.split('/');
    if (parts.length > 2) {
      parts.pop();
      setCurrentDir(parts.join('/'));
      setSelectedFile(null);
      setMultiSelect([]);
    }
  };

  const triggerReindexing = async () => {
    setIndexingMsg('Indexation en cours...');
    await fetch('/api/files/index-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: currentDir })
    });
    setTimeout(() => {
      setIndexingMsg('Indexation démarrée en arrière-plan.');
      fetchFiles();
      setTimeout(() => setIndexingMsg(''), 3000);
    }, 1500);
  };

  // Tag Operations
  const handleSaveNote = async () => {
    if (!selectedFile) return;
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: selectedFile.path, content: fileNote })
    });
    fetchFiles();
  };

  const handleToggleFileTag = async (tagName) => {
    if (!selectedFile) return;
    const isTagged = fileTags.includes(tagName);
    const newTags = isTagged ? fileTags.filter(t => t !== tagName) : [...fileTags, tagName];

    const res = await fetch('/api/files/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: selectedFile.path, tagNames: newTags })
    });

    if (res.ok) {
      setFileTags(newTags);
      fetchFiles();
    }
  };

  // Restore versions
  const handleRestoreVersion = async (backupFilename) => {
    if (!selectedFile) return;
    if (confirm('Restaurer cette version et sauvegarder la version actuelle ?')) {
      const res = await fetch('/api/files/versions/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: selectedFile.path, backupFilename })
      });
      if (res.ok) {
        alert('Restauration réussie !');
        fetchFiles();
      }
    }
  };

  // Delete Action
  const handleDeleteSelected = async () => {
    if (multiSelect.length === 0) return;
    if (confirm(`Voulez-vous vraiment supprimer ${multiSelect.length} élément(s) ?`)) {
      const res = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: multiSelect })
      });
      if (res.ok) {
        fetchFiles();
        setSelectedFile(null);
        setMultiSelect([]);
      }
    }
  };

  // Basket Actions
  const addToBasket = () => {
    const filesToStage = files.filter(f => multiSelect.includes(f.path));
    const newBasket = [...basket];
    filesToStage.forEach(f => {
      if (!newBasket.some(b => b.path === f.path)) {
        newBasket.push(f);
      }
    });
    setBasket(newBasket);
    setMultiSelect([]);
  };

  const handleBasketClear = () => setBasket([]);

  const handleBasketExecute = async (action) => {
    if (basket.length === 0) return;
    const paths = basket.map(b => b.path);

    if (action === 'zip') {
      const zipName = prompt('Nom de l\'archive ZIP (ex: export.zip) :', 'archive.zip');
      if (!zipName) return;
      const res = await fetch('/api/files/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths, zipName, targetDir: currentDir })
      });
      if (res.ok) {
        alert('Compression terminée.');
        fetchFiles();
        setBasket([]);
      }
      return;
    }

    // Move or Copy
    const res = await fetch(`/api/files/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths, targetDir: currentDir })
    });
    if (res.ok) {
      alert(`${action === 'copy' ? 'Copie' : 'Déplacement'} terminé !`);
      fetchFiles();
      setBasket([]);
    }
  };

  // Smart Folder Management
  const handleSaveSmartFolder = async () => {
    if (!newSmartFolderName || !newSmartFolderQuery) return;
    const res = await fetch('/api/smart-folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSmartFolderName, queryRules: { search: newSmartFolderQuery } })
    });
    if (res.ok) {
      fetchDbLists();
      setNewSmartFolderName('');
      setNewSmartFolderQuery('');
      setShowSmartFolderModal(false);
    }
  };

  const handleDeleteSmartFolder = async (id, e) => {
    e.stopPropagation();
    if (confirm('Supprimer ce dossier intelligent ?')) {
      await fetch(`/api/smart-folders/${id}`, { method: 'DELETE' });
      fetchDbLists();
      setActiveSmartFolder(null);
    }
  };

  // Watchdog Management
  const handleSaveWatchdog = async () => {
    if (!wdSource || !wdExt || !wdDest) return;
    const tagsArray = wdTags ? wdTags.split(',').map(t => t.trim()) : [];
    const res = await fetch('/api/watchdog-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceDir: wdSource,
        triggerExt: wdExt,
        targetDir: wdDest,
        addTags: tagsArray,
        enabled: true
      })
    });
    if (res.ok) {
      fetchDbLists();
      setWdSource('');
      setWdExt('');
      setWdDest('');
      setWdTags('');
      setShowWatchdogModal(false);
    }
  };

  const handleDeleteWatchdog = async (id) => {
    if (confirm('Supprimer cette règle ?')) {
      await fetch(`/api/watchdog-rules/${id}`, { method: 'DELETE' });
      fetchDbLists();
    }
  };

  // Context Help Trigger
  const triggerHelp = (tab) => {
    setHelpTab(tab);
    setShowHelpModal(true);
  };

  return (
    <div className="app-container">
      {/* 1. SIDEBAR */}
      <aside className="sidebar">
        <div className="logo" onClick={() => triggerHelp('INTRO')} style={{ cursor: 'pointer' }} title="Cliquez pour voir l'aide générale">
          <span>📁</span> Fichior
        </div>

        {/* Browser root navigate */}
        <div className="sidebar-section">
          <ul className="sidebar-menu">
            <li>
              <a
                href="#"
                className={`sidebar-item ${!activeTagFilter && !activeSmartFolder ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTagFilter(null);
                  setActiveSmartFolder(null);
                  setSearchQuery('');
                }}
              >
                📁 Explorateur
              </a>
            </li>
            <li>
              <a href="#" className="sidebar-item" onClick={(e) => { e.preventDefault(); setShowDuplicateFinder(true); }}>
                🔍 Doublons
              </a>
            </li>
            <li>
              <a href="#" className="sidebar-item" onClick={(e) => { e.preventDefault(); setShowWatchdogModal(true); }}>
                🤖 Watchdog Rules
              </a>
            </li>
          </ul>
        </div>

        {/* Smart Folders */}
        <div className="sidebar-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="sidebar-title">
              Dossiers Intelligents
              <span onClick={() => triggerHelp('SEARCH')} style={{ marginLeft: '6px', cursor: 'pointer', color: 'var(--accent)', fontSize: '10px' }}>[?]</span>
            </span>
            <button
              onClick={() => setShowSmartFolderModal(true)}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
            >
              +
            </button>
          </div>
          <ul className="sidebar-menu">
            {smartFolders.map(folder => (
              <li key={folder.id}>
                <a
                  href="#"
                  className={`sidebar-item ${activeSmartFolder?.id === folder.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSmartFolder(folder);
                    setActiveTagFilter(null);
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>✨ {folder.name}</span>
                  <span onClick={(e) => handleDeleteSmartFolder(folder.id, e)} style={{ color: 'var(--danger)', fontSize: '12px' }}>✕</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Tags system */}
        <div className="sidebar-section">
          <span className="sidebar-title">Tags</span>
          <ul className="sidebar-menu">
            {allTags.map(tag => (
              <li key={tag.id}>
                <a
                  href="#"
                  className={`sidebar-item ${activeTagFilter === tag.name ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTagFilter(tag.name);
                    setActiveSmartFolder(null);
                  }}
                >
                  <span className="tag-badge-pill" style={{ backgroundColor: tag.color }} />
                  <span>#{tag.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn" style={{ justifyContent: 'center' }} onClick={() => setShowSettingsModal(true)}>
            ⚙️ Paramètres
          </button>
          <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => triggerHelp('INTRO')}>
            📖 Aide Générale
          </button>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            <div>Raccourcis :</div>
            <div>[Espace] Aperçu rapide</div>
            <div>[Ctrl+F] Focus Mode</div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE AREA */}
      <main className="main-content">
        <header className="topbar">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setActiveTagFilter(null);
                setActiveSmartFolder(null);
              }}
              placeholder="Rechercher (ex: 'pdf de plus de 5 Mo' ou 'rapport #urgent')"
            />
            <span onClick={() => triggerHelp('SEARCH')} style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', marginLeft: '8px' }} title="Aide de recherche">❓</span>
          </div>

          <div className="quick-actions-bar">
            {indexingMsg && <span style={{ fontSize: '13px', color: 'var(--warning)', marginRight: '10px' }}>{indexingMsg}</span>}
            <button className="btn" onClick={triggerReindexing}>🔄 Indexer</button>
            <button className="btn btn-primary" onClick={() => setFocusMode(true)}>⚡ Focus</button>
          </div>
        </header>

        <div className="explorer-pane">
          {/* Files Browser Pane */}
          <div className="file-list-view">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="breadcrumbs">
                <span className="breadcrumb-item" onClick={() => setCurrentDir('/home/homardsheriff/gemini-workspace/Fichior')}>Racine</span>
                {currentDir.split('/').filter(Boolean).map((part, idx, arr) => {
                  const pathBuild = '/' + arr.slice(0, idx + 1).join('/');
                  return (
                    <React.Fragment key={idx}>
                      <span className="breadcrumb-separator">/</span>
                      <span className="breadcrumb-item" onClick={() => setCurrentDir(pathBuild)}>{part}</span>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Toolbar buttons depending on selection */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {currentDir !== '/' && (
                  <button className="btn" onClick={navigateUp}>⬆ Retour</button>
                )}
                {multiSelect.length > 0 && (
                  <>
                    <button className="btn" onClick={addToBasket}>🛒 Panier (+{multiSelect.length})</button>
                    <button className="btn" onClick={() => setShowRenameModal(true)}>✏ Renommer</button>
                    <button className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleDeleteSelected}>
                      🗑 Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Folder Layout (Grid or List View) */}
            {viewMode === 'grid' ? (
              <div className="files-grid">
                {files.map((file, idx) => {
                  const isSelected = multiSelect.includes(file.path);
                  const isDir = file.type === 'directory';
                  const fileIcon = isDir ? '📁' : file.type.startsWith('image/') ? '🖼️' : file.type.startsWith('audio/') ? '🎵' : file.type.startsWith('video/') ? '🎥' : file.ext === '.pdf' ? '📕' : '📄';

                  return (
                    <div
                      key={idx}
                      className={`file-card ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => handleFileClick(file, e)}
                      onDoubleClick={() => {
                        if (isDir) {
                          setCurrentDir(file.path);
                          setSelectedFile(null);
                          setMultiSelect([]);
                        } else {
                          setSelectedFile(file);
                          setShowQuickLook(true);
                        }
                      }}
                    >
                      <div className="file-icon">{fileIcon}</div>
                      <div className="file-name" title={file.name}>{file.name}</div>
                      {!isDir && <div className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} Mo</div>}

                      <div className="file-tags">
                        {file.tags && file.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="tag-badge" style={{ backgroundColor: file.tagColors[tIdx] || '#3b82f6' }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <table className="files-list-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Taille</th>
                    <th>Type</th>
                    <th>Dernière modification</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, idx) => {
                    const isSelected = multiSelect.includes(file.path);
                    const isDir = file.type === 'directory';
                    const fileIcon = isDir ? '📁' : file.type.startsWith('image/') ? '🖼️' : file.type.startsWith('audio/') ? '🎵' : file.type.startsWith('video/') ? '🎥' : file.ext === '.pdf' ? '📕' : '📄';

                    return (
                      <tr
                        key={idx}
                        className={`files-list-row ${isSelected ? 'selected' : ''}`}
                        onClick={(e) => handleFileClick(file, e)}
                        onDoubleClick={() => {
                          if (isDir) {
                            setCurrentDir(file.path);
                            setSelectedFile(null);
                            setMultiSelect([]);
                          } else {
                            setSelectedFile(file);
                            setShowQuickLook(true);
                          }
                        }}
                      >
                        <td>
                          <div className="files-list-name-col">
                            <span style={{ fontSize: '18px' }}>{fileIcon}</span>
                            <span title={file.name}>{file.name}</span>
                            {file.tags && file.tags.map((tag, tIdx) => (
                              <span key={tIdx} className="tag-badge" style={{ backgroundColor: file.tagColors[tIdx] || '#3b82f6', fontSize: '9px', marginLeft: '4px' }}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>{isDir ? '--' : `${(file.size / (1024 * 1024)).toFixed(2)} Mo`}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{file.type}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{new Date(file.mtime).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Right Inspector Details */}
          {selectedFile && (
            <aside className="details-panel">
              <h3 className="details-title">Inspecteur</h3>
              <div style={{ fontSize: '64px', textAlign: 'center', marginBottom: '20px' }}>
                {selectedFile.type === 'directory' ? '📁' : '📄'}
              </div>

              <div className="details-meta-row">
                <span className="details-meta-label">Nom</span>
                <span className="details-meta-val">{selectedFile.name}</span>
              </div>
              <div className="details-meta-row">
                <span className="details-meta-label">Chemin</span>
                <span className="details-meta-val" style={{ fontSize: '11px' }}>{selectedFile.path}</span>
              </div>
              {selectedFile.type !== 'directory' && (
                <>
                  <div className="details-meta-row">
                    <span className="details-meta-label">Taille</span>
                    <span className="details-meta-val">{(selectedFile.size / (1024 * 1024)).toFixed(2)} Mo</span>
                  </div>
                  <div className="details-meta-row">
                    <span className="details-meta-label">Modifié</span>
                    <span className="details-meta-val">{new Date(selectedFile.mtime).toLocaleString()}</span>
                  </div>
                </>
              )}

              {/* Tags modifier */}
              {selectedFile.type !== 'directory' && (
                <div style={{ marginTop: '20px' }}>
                  <div className="details-meta-label" style={{ marginBottom: '10px' }}>Tags</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {allTags.map(tag => {
                      const isActive = fileTags.includes(tag.name);
                      return (
                        <button
                          key={tag.id}
                          className="btn"
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            borderColor: tag.color,
                            backgroundColor: isActive ? tag.color : 'transparent',
                            color: isActive ? '#fff' : 'var(--text-main)'
                          }}
                          onClick={() => handleToggleFileTag(tag.name)}
                        >
                          #{tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Comments Note */}
              <div style={{ marginTop: '20px' }}>
                <div className="details-meta-label">Note / Commentaires</div>
                <textarea
                  className="notes-textarea"
                  value={fileNote}
                  onChange={e => setFileNote(e.target.value)}
                  placeholder="Écrire une note..."
                />
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} onClick={handleSaveNote}>
                  Enregistrer la Note
                </button>
              </div>

              {/* Versions back panel */}
              {selectedFile.type !== 'directory' && fileVersions.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div className="details-meta-label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Historique de versions local</span>
                    <span onClick={() => triggerHelp('VERSIONING')} style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: '12px' }}>[?]</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {fileVersions.map((v, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-main)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px' }}>
                        <span>{v.date}</span>
                        <button className="btn" style={{ padding: '2px 6px', fontSize: '10px' }} onClick={() => handleRestoreVersion(v.filename)}>
                          Restaurer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>

        {/* 3. BASKET AREA */}
        {basket.length > 0 && (
          <footer className="basket-drawer">
            <div style={{ flexShrink: 0 }}>
              <strong style={{ display: 'block', fontSize: '14px' }}>
                Panier Staging ({basket.length})
                <span onClick={() => triggerHelp('STAGING')} style={{ marginLeft: '6px', cursor: 'pointer', color: 'var(--accent)', fontSize: '12px' }}>[?]</span>
              </strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fichiers prêts pour action globale</span>
            </div>
            <div className="basket-files-container">
              {basket.map((item, idx) => (
                <div key={idx} className="basket-file-chip">
                  <span>{item.type === 'directory' ? '📁' : '📄'}</span>
                  <span>{item.name}</span>
                  <span className="basket-file-remove" onClick={() => setBasket(prev => prev.filter(p => p.path !== item.path))}>✕</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button className="btn" onClick={() => handleBasketExecute('copy')}>Copier ici</button>
              <button className="btn" onClick={() => handleBasketExecute('move')}>Déplacer ici</button>
              <button className="btn" onClick={() => handleBasketExecute('zip')}>Zipper ici</button>
              <button className="btn" style={{ color: 'var(--danger)' }} onClick={handleBasketClear}>Vider</button>
            </div>
          </footer>
        )}
      </main>

      {/* 4. MODALS */}
      {showQuickLook && selectedFile && (
        <QuickLook file={selectedFile} onClose={() => setShowQuickLook(false)} />
      )}

      {showRenameModal && multiSelect.length > 0 && (
        <RenameModal
          files={files.filter(f => multiSelect.includes(f.path))}
          onClose={() => setShowRenameModal(false)}
          onRefresh={() => {
            fetchFiles();
            setSelectedFile(null);
            setMultiSelect([]);
          }}
        />
      )}

      {showDuplicateFinder && (
        <DuplicateFinder
          onClose={() => setShowDuplicateFinder(false)}
          onRefreshExplorer={fetchFiles}
        />
      )}

      {/* Help Overlay modal */}
      {showHelpModal && (
        <HelpModal
          defaultTab={helpTab}
          onClose={() => setShowHelpModal(false)}
        />
      )}

      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingModal
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {/* Settings Panel */}
      {showSettingsModal && (
        <SettingsModal
          viewMode={viewMode}
          setViewMode={setViewMode}
          onReplayOnboarding={() => setShowOnboarding(true)}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Watchdog configurations */}
      {showWatchdogModal && (
        <div className="modal-overlay" onClick={() => setShowWatchdogModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ margin: 0 }}>Règles automatisées Watchdog</h2>
              <span onClick={() => triggerHelp('WATCHDOG')} style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: '14px' }} title="Aide Watchdog">❓ Aide</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Configurez des règles automatiques (ex: Déplacer les .pdf de Téléchargements vers Documents et ajouter le tag #à_lire)</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0' }}>
              <input type="text" className="search-input" style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }} placeholder="Dossier Source (ex: /home/user/Downloads)" value={wdSource} onChange={e => setWdSource(e.target.value)} />
              <input type="text" className="search-input" style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }} placeholder="Extension à écouter (ex: .pdf)" value={wdExt} onChange={e => setWdExt(e.target.value)} />
              <input type="text" className="search-input" style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }} placeholder="Dossier Cible (ex: /home/user/Documents/PDFs)" value={wdDest} onChange={e => setWdDest(e.target.value)} />
              <input type="text" className="search-input" style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }} placeholder="Tags à ajouter séparés par virgules (ex: urgent, à_lire)" value={wdTags} onChange={e => setWdTags(e.target.value)} />
              <button className="btn btn-primary" onClick={handleSaveWatchdog}>Ajouter la Règle</button>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h4>Règles actives :</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {watchdogRules.map(rule => (
                  <div key={rule.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--bg-main)', borderRadius: '6px', fontSize: '12px' }}>
                    <div>
                      <div><strong>Source:</strong> {rule.source_dir}</div>
                      <div><strong>Déplacer:</strong> {rule.trigger_ext} ➔ {rule.target_dir}</div>
                      {rule.add_tags?.length > 0 && <div><strong>Tags:</strong> {rule.add_tags.join(', ')}</div>}
                    </div>
                    <button className="btn" style={{ color: 'var(--danger)', padding: '4px 8px' }} onClick={() => handleDeleteWatchdog(rule.id)}>Supprimer</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Folder Modals */}
      {showSmartFolderModal && (
        <div className="modal-overlay" onClick={() => setShowSmartFolderModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 style={{ marginTop: 0 }}>Nouveau dossier virtuel intelligent</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0' }}>
              <input type="text" className="search-input" style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }} placeholder="Nom du dossier (ex: PDF Factures)" value={newSmartFolderName} onChange={e => setNewSmartFolderName(e.target.value)} />
              <input type="text" className="search-input" style={{ backgroundColor: 'var(--bg-input)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }} placeholder="Règles de recherche (ex: 'pdf modifié la semaine dernière')" value={newSmartFolderQuery} onChange={e => setNewSmartFolderQuery(e.target.value)} />
              <button className="btn btn-primary" onClick={handleSaveSmartFolder}>Créer le dossier virtuel</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FOCUS MODE (Spotlight Search) */}
      {focusMode && (
        <div className="focus-mode-overlay" onClick={() => setFocusMode(false)}>
          <div className="focus-mode-box" onClick={e => e.stopPropagation()}>
            <input
              type="text"
              autoFocus
              className="focus-search-input"
              value={focusQuery}
              onChange={e => setFocusQuery(e.target.value)}
              placeholder="Rechercher partout dans vos fichiers (Raycast style)..."
            />
            {focusResults.length > 0 && (
              <ul className="focus-results">
                {focusResults.map((res, idx) => (
                  <li
                    key={idx}
                    className={`focus-result-item ${focusSelectedIndex === idx ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedFile(res);
                      setFocusMode(false);
                      if (res.type === 'directory') {
                        setCurrentDir(res.path);
                      } else {
                        setShowQuickLook(true);
                      }
                    }}
                  >
                    <div className="focus-item-main">
                      <span style={{ fontSize: '20px' }}>{res.type === 'directory' ? '📁' : '📄'}</span>
                      <div>
                        <div className="focus-item-name">{res.name}</div>
                        <div className="focus-item-path">{res.path}</div>
                      </div>
                    </div>
                    {res.tags?.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {res.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="tag-badge" style={{ backgroundColor: res.tagColors[tIdx] || '#3b82f6' }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
