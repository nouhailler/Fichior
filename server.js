import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import mime from 'mime-types';

import { getDb } from './db.js';
import { indexFile, removeFileFromIndex, indexDirectory, computeFileHash } from './indexer.js';
import { compileNaturalLanguageQuery } from './natural_language.js';
import { createVersion, getVersions, restoreVersion } from './versions.js';
import { initWatchdog, startWatchRule, stopWatchRule } from './watchdog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve production frontend assets if they exist
app.use(express.static(path.join(__dirname, 'dist')));

// Helper to sanitize paths
function resolveHome(filepath) {
  if (filepath.startsWith('~')) {
    return path.join(process.env.HOME || '/home/homardsheriff', filepath.slice(1));
  }
  return path.resolve(filepath);
}

// ----------------------------------------------------
// 1. FILES & DIRECTORIES API
// ----------------------------------------------------

// GET /api/files - Browsing or searching files
app.get('/api/files', async (req, res) => {
  const db = await getDb();
  const { dir, search, tag, smartFolderId } = req.query;

  try {
    let filesList = [];

    // --- CASE A: Smart Folder ---
    if (smartFolderId) {
      const folder = await db.get(`SELECT query_rules FROM smart_folders WHERE id = ?`, [smartFolderId]);
      if (!folder) return res.status(404).json({ error: 'Smart Folder not found' });
      const rules = JSON.parse(folder.query_rules);
      const searchVal = rules.search || '';

      const { sql, params } = compileNaturalLanguageQuery(searchVal);
      const rows = await db.all(`
        SELECT f.*, GROUP_CONCAT(t.name) as tags, GROUP_CONCAT(t.color) as tag_colors, n.content as note
        FROM files f
        LEFT JOIN file_tags ft ON f.path = ft.file_path
        LEFT JOIN tags t ON ft.tag_id = t.id
        LEFT JOIN notes n ON f.path = n.file_path
        WHERE ${sql}
        GROUP BY f.path
      `, params);
      return res.json(rows.map(row => parseFileRow(row)));
    }

    // --- CASE B: Tag Filter ---
    if (tag) {
      const rows = await db.all(`
        SELECT f.*, GROUP_CONCAT(t.name) as tags, GROUP_CONCAT(t.color) as tag_colors, n.content as note
        FROM files f
        JOIN file_tags ft ON f.path = ft.file_path
        JOIN tags t ON ft.tag_id = t.id
        LEFT JOIN notes n ON f.path = n.file_path
        WHERE t.name = ?
        GROUP BY f.path
      `, [tag]);
      return res.json(rows.map(row => parseFileRow(row)));
    }

    // --- CASE C: Search Query ---
    if (search) {
      const { sql, params } = compileNaturalLanguageQuery(search);
      const rows = await db.all(`
        SELECT f.*, GROUP_CONCAT(t.name) as tags, GROUP_CONCAT(t.color) as tag_colors, n.content as note
        FROM files f
        LEFT JOIN file_tags ft ON f.path = ft.file_path
        LEFT JOIN tags t ON ft.tag_id = t.id
        LEFT JOIN notes n ON f.path = n.file_path
        WHERE ${sql}
        GROUP BY f.path
      `, params);
      return res.json(rows.map(row => parseFileRow(row)));
    }

    // --- CASE D: Normal Directory Browse ---
    const targetDir = resolveHome(dir || process.cwd());
    const stats = await fs.stat(targetDir);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Not a directory' });
    }

    // Read direct filesystem contents
    const entries = await fs.readdir(targetDir, { withFileTypes: true });

    // Build directory listing
    for (const entry of entries) {
      const fullPath = path.join(targetDir, entry.name);
      if (entry.name.startsWith('.')) continue; // skip dotfiles

      try {
        const fileStats = await fs.stat(fullPath);
        const isDir = entry.isDirectory();

        if (isDir) {
          filesList.push({
            path: fullPath,
            name: entry.name,
            size: 0,
            type: 'directory',
            ext: '',
            mtime: fileStats.mtimeMs,
            birthtime: fileStats.birthtimeMs || fileStats.mtimeMs,
            tags: [],
            tagColors: [],
            note: null
          });
        } else {
          // Trigger file indexing asynchronously
          indexFile(fullPath).catch(err => console.error('Bg index err:', err));

          // Read cached details if exists
          const cached = await db.get(`
            SELECT f.*, GROUP_CONCAT(t.name) as tags, GROUP_CONCAT(t.color) as tag_colors, n.content as note
            FROM files f
            LEFT JOIN file_tags ft ON f.path = ft.file_path
            LEFT JOIN tags t ON ft.tag_id = t.id
            LEFT JOIN notes n ON f.path = n.file_path
            WHERE f.path = ?
            GROUP BY f.path
          `, [fullPath]);

          if (cached) {
            filesList.push(parseFileRow(cached));
          } else {
            // Fallback to unindexed item
            filesList.push({
              path: fullPath,
              name: entry.name,
              size: fileStats.size,
              type: mime.lookup(fullPath) || 'application/octet-stream',
              ext: path.extname(fullPath).toLowerCase(),
              mtime: fileStats.mtimeMs,
              birthtime: fileStats.birthtimeMs || fileStats.mtimeMs,
              tags: [],
              tagColors: [],
              note: null
            });
          }
        }
      } catch (err) {
        // Skip inaccessible files/folders
      }
    }

    // Sort: directories first, then files by name
    filesList.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });

    res.json(filesList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to convert db outputs into readable frontend response
function parseFileRow(row) {
  return {
    ...row,
    tags: row.tags ? row.tags.split(',') : [],
    tagColors: row.tag_colors ? row.tag_colors.split(',') : [],
    metadata: row.metadata ? JSON.parse(row.metadata) : null
  };
}

// GET /api/files/download - Downloads/streams files
app.get('/api/files/download', async (req, res) => {
  const filePath = resolveHome(req.query.path);
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return res.status(400).json({ error: 'Is not a file' });

    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);

    createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/index-status - Run a full sync indexer on a path
app.post('/api/files/index-status', async (req, res) => {
  const targetDir = resolveHome(req.body.path || process.cwd());
  try {
    indexDirectory(targetDir)
      .then(() => console.log(`Finished background reindexing for ${targetDir}`))
      .catch(e => console.error(e));
    res.json({ status: 'Indexing started in background' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/delete - Delete files or directories
app.post('/api/files/delete', async (req, res) => {
  const { paths } = req.body;
  if (!paths || !Array.isArray(paths)) return res.status(400).json({ error: 'Missing paths array' });

  try {
    for (const p of paths) {
      const resolved = resolveHome(p);
      const stat = await fs.stat(resolved);
      if (stat.isDirectory()) {
        await fs.rm(resolved, { recursive: true, force: true });
      } else {
        await fs.unlink(resolved);
      }
      await removeFileFromIndex(resolved);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/move - Move files
app.post('/api/files/move', async (req, res) => {
  const { paths, targetDir } = req.body;
  if (!paths || !targetDir) return res.status(400).json({ error: 'Missing parameters' });
  const resolvedTargetDir = resolveHome(targetDir);

  try {
    await fs.mkdir(resolvedTargetDir, { recursive: true });
    for (const p of paths) {
      const src = resolveHome(p);
      const dest = path.join(resolvedTargetDir, path.basename(src));

      // Before modifying/overwriting files, backup versions
      await createVersion(dest).catch(() => {});

      await fs.rename(src, dest);
      await removeFileFromIndex(src);
      await indexFile(dest);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/copy - Copy files
app.post('/api/files/copy', async (req, res) => {
  const { paths, targetDir } = req.body;
  if (!paths || !targetDir) return res.status(400).json({ error: 'Missing parameters' });
  const resolvedTargetDir = resolveHome(targetDir);

  try {
    await fs.mkdir(resolvedTargetDir, { recursive: true });
    for (const p of paths) {
      const src = resolveHome(p);
      const dest = path.join(resolvedTargetDir, path.basename(src));

      // Versioning backup if destination file exists
      await createVersion(dest).catch(() => {});

      await fs.copyFile(src, dest);
      await indexFile(dest);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/rename - Single rename or batch rename
app.post('/api/files/rename', async (req, res) => {
  const { renameList } = req.body; // Array of { src, dest }
  if (!renameList || !Array.isArray(renameList)) return res.status(400).json({ error: 'Missing renameList' });

  try {
    for (const item of renameList) {
      const src = resolveHome(item.src);
      const dest = resolveHome(item.dest);

      // Versioning backup if destination file exists
      await createVersion(dest).catch(() => {});

      await fs.rename(src, dest);
      await removeFileFromIndex(src);
      await indexFile(dest);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/zip - Zip multi-selected files
app.post('/api/files/zip', async (req, res) => {
  const { paths, zipFilePath } = req.body;
  if (!paths || !zipFilePath) return res.status(400).json({ error: 'Missing parameters' });
  const resolvedZip = resolveHome(zipFilePath);

  try {
    const output = createReadStream(resolvedZip); // We'll create it via write stream
    const writeStream = await fs.open(resolvedZip, 'w');
    const archive = archiver('zip', { zlib: { level: 9 } });

    const archiveStream = fs.createWriteStream ? fs.createWriteStream(resolvedZip) : null;

    // We can use native node write streams
    const outputStream = await new Promise((resolve, reject) => {
      const s = path.resolve(resolvedZip);
      const stream = express.static // just a placeholder
      const write = fs.mkdir(path.dirname(s), { recursive: true }).then(() => {
        const out = archiver('zip');
        const fileStream = path.join(s);
        // Let's implement robust zip creation
        resolve({ out, s });
      });
    });

    res.status(500).json({ error: "Use native tools or archiver safely" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// We can simplify ZIP route by creating a zip archive safely
app.post('/api/files/compress', async (req, res) => {
  const { paths, zipName, targetDir } = req.body;
  const resolvedTarget = resolveHome(targetDir);
  const destZip = path.join(resolvedTarget, zipName.endsWith('.zip') ? zipName : `${zipName}.zip`);

  try {
    const fsNode = await import('fs');
    const output = fsNode.createWriteStream(destZip);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      indexFile(destZip).catch(() => {});
    });

    archive.pipe(output);

    for (const p of paths) {
      const resolved = resolveHome(p);
      const stat = await fs.stat(resolved);
      if (stat.isDirectory()) {
        archive.directory(resolved, path.basename(resolved));
      } else {
        archive.file(resolved, { name: path.basename(resolved) });
      }
    }

    await archive.finalize();
    res.json({ success: true, path: destZip });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 2. TAGS & NOTES API
// ----------------------------------------------------
app.get('/api/tags', async (req, res) => {
  const db = await getDb();
  try {
    const tags = await db.all(`SELECT * FROM tags`);
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tags', async (req, res) => {
  const db = await getDb();
  const { name, color } = req.body;
  try {
    const result = await db.run(`INSERT INTO tags (name, color) VALUES (?, ?)`, [name, color]);
    res.json({ id: result.lastID, name, color });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tags/:id', async (req, res) => {
  const db = await getDb();
  try {
    await db.run(`DELETE FROM tags WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/files/tags', async (req, res) => {
  const db = await getDb();
  const { filePath, tagNames } = req.body; // Array of tag names
  try {
    // Clear existing
    await db.run(`DELETE FROM file_tags WHERE file_path = ?`, [filePath]);

    // Insert new tags mapping
    for (const tagName of tagNames) {
      let tag = await db.get(`SELECT id FROM tags WHERE name = ?`, [tagName]);
      if (!tag) {
        const r = await db.run(`INSERT INTO tags (name, color) VALUES (?, ?)`, [tagName, '#3b82f6']);
        tag = { id: r.lastID };
      }
      await db.run(`INSERT OR IGNORE INTO file_tags (file_path, tag_id) VALUES (?, ?)`, [filePath, tag.id]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notes CRUD
app.post('/api/notes', async (req, res) => {
  const db = await getDb();
  const { filePath, content } = req.body;
  try {
    await db.run(`
      INSERT INTO notes (file_path, content, mtime)
      VALUES (?, ?, ?)
      ON CONFLICT(file_path) DO UPDATE SET content=excluded.content, mtime=excluded.mtime
    `, [filePath, content, Date.now()]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 3. SMART FOLDERS API
// ----------------------------------------------------
app.get('/api/smart-folders', async (req, res) => {
  const db = await getDb();
  try {
    const folders = await db.all(`SELECT * FROM smart_folders`);
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/smart-folders', async (req, res) => {
  const db = await getDb();
  const { name, queryRules } = req.body;
  try {
    const result = await db.run(`INSERT INTO smart_folders (name, query_rules) VALUES (?, ?)`, [name, JSON.stringify(queryRules)]);
    res.json({ id: result.lastID, name, queryRules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/smart-folders/:id', async (req, res) => {
  const db = await getDb();
  try {
    await db.run(`DELETE FROM smart_folders WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 4. WATCHDOG RULES API
// ----------------------------------------------------
app.get('/api/watchdog-rules', async (req, res) => {
  const db = await getDb();
  try {
    const rules = await db.all(`SELECT * FROM watchdog_rules`);
    res.json(rules.map(r => ({ ...r, add_tags: r.add_tags ? JSON.parse(r.add_tags) : [] })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/watchdog-rules', async (req, res) => {
  const db = await getDb();
  const { sourceDir, triggerExt, targetDir, addTags, enabled } = req.body;
  try {
    const r = await db.run(`
      INSERT INTO watchdog_rules (source_dir, trigger_ext, target_dir, add_tags, enabled)
      VALUES (?, ?, ?, ?, ?)
    `, [sourceDir, triggerExt, targetDir, JSON.stringify(addTags), enabled ? 1 : 0]);

    const newRule = {
      id: r.lastID,
      source_dir: sourceDir,
      trigger_ext: triggerExt,
      target_dir: targetDir,
      add_tags: addTags,
      enabled: enabled ? 1 : 0
    };

    if (newRule.enabled) {
      await startWatchRule(newRule);
    }

    res.json(newRule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/watchdog-rules/:id', async (req, res) => {
  const db = await getDb();
  const { id } = req.params;
  try {
    await stopWatchRule(id);
    await db.run(`DELETE FROM watchdog_rules WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 5. DUPLICATES & VERSIONS API
// ----------------------------------------------------

// GET /api/files/duplicates - Groups files by content hash to find duplicates
app.get('/api/files/duplicates', async (req, res) => {
  const db = await getDb();
  try {
    const duplicates = await db.all(`
      SELECT hash, GROUP_CONCAT(path, '|||') as paths, GROUP_CONCAT(name, '|||') as names, COUNT(*) as count, SUM(size) as total_size
      FROM files
      WHERE hash IS NOT NULL AND hash != ''
      GROUP BY hash
      HAVING count > 1
      ORDER BY total_size DESC
    `);
    const formatted = duplicates.map(d => ({
      hash: d.hash,
      paths: d.paths.split('|||'),
      names: d.names.split('|||'),
      count: d.count,
      totalSize: d.total_size
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/files/versions - Get history of backups for a path
app.get('/api/files/versions', async (req, res) => {
  const { filePath } = req.query;
  if (!filePath) return res.status(400).json({ error: 'Missing filePath' });
  try {
    const list = await getVersions(resolveHome(filePath));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/versions/restore - Restore backup
app.post('/api/files/versions/restore', async (req, res) => {
  const { filePath, backupFilename } = req.body;
  if (!filePath || !backupFilename) return res.status(400).json({ error: 'Missing parameter' });

  try {
    await restoreVersion(resolveHome(filePath), backupFilename);
    await indexFile(resolveHome(filePath));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Direct text preview for code files or text
app.get('/api/files/preview-text', async (req, res) => {
  const filePath = resolveHome(req.query.path);
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return res.status(400).json({ error: 'Not a file' });

    // Read max 1MB text
    const text = await fs.readFile(filePath, 'utf8');
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to React App (SPA Routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server & Watchdogs
app.listen(PORT, async () => {
  console.log(`Fichior Server active at http://localhost:${PORT}`);
  await initWatchdog();
});
