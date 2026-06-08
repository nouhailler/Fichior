import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import crypto from 'crypto';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import musicMetadata from 'music-metadata';
import exifParser from 'exif-parser';
import mime from 'mime-types';
import { getDb } from './db.js';

// Text file extensions we want to index contents for
const TEXT_EXTS = ['.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.py', '.c', '.cpp', '.h', '.html', '.css', '.sh', '.yml', '.yaml', '.rs', '.go', '.java', '.php'];

/**
 * Computes MD5 hash of a file for duplicate detection.
 */
export function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', err => reject(err));
  });
}

/**
 * Extracts text content from docx, pdf, or text files.
 */
async function extractText(filePath, ext) {
  try {
    if (ext === '.pdf') {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text || '';
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    } else if (TEXT_EXTS.includes(ext)) {
      // Read first 100KB of text file to prevent memory blow-up
      const handle = await fs.open(filePath, 'r');
      const buffer = Buffer.alloc(100 * 1024);
      const { bytesRead } = await handle.read(buffer, 0, 100 * 1024, 0);
      await handle.close();
      return buffer.toString('utf8', 0, bytesRead);
    }
  } catch (err) {
    console.error(`Failed to extract text from ${filePath}:`, err.message);
  }
  return null;
}

/**
 * Extracts metadata for specific file types (exif/id3).
 */
async function extractMetadata(filePath, ext) {
  try {
    if (['.jpg', '.jpeg'].includes(ext)) {
      const buffer = await fs.readFile(filePath);
      const parser = exifParser.create(buffer);
      const result = parser.parse();
      if (result && result.tags) {
        return {
          camera: result.tags.Model,
          dateTaken: result.tags.DateTimeOriginal,
          gps: result.tags.GPSLatitude && result.tags.GPSLongitude ? {
            lat: result.tags.GPSLatitude,
            lng: result.tags.GPSLongitude
          } : null,
          width: result.imageSize?.width,
          height: result.imageSize?.height
        };
      }
    } else if (['.mp3', '.m4a', '.flac', '.ogg', '.wav'].includes(ext)) {
      const metadata = await musicMetadata.parseFile(filePath);
      if (metadata && metadata.common) {
        return {
          title: metadata.common.title,
          artist: metadata.common.artist,
          album: metadata.common.album,
          duration: metadata.format.duration,
          year: metadata.common.year
        };
      }
    }
  } catch (err) {
    console.warn(`Could not extract image/audio metadata for ${filePath}:`, err.message);
  }
  return null;
}

/**
 * Indexes a single file, adding or updating its entry in SQLite database.
 */
export async function indexFile(filePath) {
  const db = await getDb();
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) return;

    const name = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const size = stats.size;
    const type = mime.lookup(filePath) || 'application/octet-stream';
    const mtime = stats.mtimeMs;
    const birthtime = stats.birthtimeMs || stats.mtimeMs;

    // Check if the file is already indexed and unchanged
    const existing = await db.get(`SELECT mtime, size FROM files WHERE path = ?`, [filePath]);
    if (existing && existing.mtime === mtime && existing.size === size) {
      return; // Already up to date
    }

    console.log(`Indexing: ${filePath}`);

    // Extract text content if applicable
    const content = await extractText(filePath, ext);

    // Extract image/audio metadata
    const metadataObj = await extractMetadata(filePath, ext);
    const metadata = metadataObj ? JSON.stringify(metadataObj) : null;

    // Compute hash for duplicate finder
    const hash = await computeFileHash(filePath).catch(() => null);

    await db.run(
      `INSERT INTO files (path, name, size, type, ext, mtime, birthtime, hash, content, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(path) DO UPDATE SET
         name=excluded.name,
         size=excluded.size,
         type=excluded.type,
         ext=excluded.ext,
         mtime=excluded.mtime,
         birthtime=excluded.birthtime,
         hash=excluded.hash,
         content=excluded.content,
         metadata=excluded.metadata`,
      [filePath, name, size, type, ext, mtime, birthtime, hash, content, metadata]
    );
  } catch (err) {
    console.error(`Error indexing file ${filePath}:`, err);
  }
}

/**
 * Removes a deleted file from the index.
 */
export async function removeFileFromIndex(filePath) {
  const db = await getDb();
  try {
    await db.run(`DELETE FROM files WHERE path = ?`, [filePath]);
    console.log(`Removed from index: ${filePath}`);
  } catch (err) {
    console.error(`Error removing ${filePath} from index:`, err);
  }
}

/**
 * Scans a directory recursively and indexes all files.
 */
export async function indexDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }
      if (entry.isDirectory()) {
        await indexDirectory(fullPath);
      } else if (entry.isFile()) {
        await indexFile(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error scanning directory ${dirPath}:`, err);
  }
}
