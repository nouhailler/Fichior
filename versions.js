import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const versionsDir = path.join(os.homedir(), '.fichior', 'versions');

// Ensure the versions directory exists synchronously
if (!fsSync.existsSync(versionsDir)) {
  fsSync.mkdirSync(versionsDir, { recursive: true });
}

function getHash(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Creates a version backup of a file before it gets modified/overwritten.
 * Keeps only the last 3 versions.
 * @param {string} filePath - Absolute path to the file
 */
export async function createVersion(filePath) {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) return;

    const fileHash = getHash(filePath);
    const timestamp = Date.now();
    const basename = path.basename(filePath);
    const backupName = `${fileHash}_${timestamp}_${basename}`;
    const backupPath = path.join(versionsDir, backupName);

    // Copy original file to backup location
    await fs.copyFile(filePath, backupPath);

    // List all existing backups for this file
    const files = await fs.readdir(versionsDir);
    const backups = files
      .filter(f => f.startsWith(`${fileHash}_`))
      .map(f => {
        const parts = f.split('_');
        const ts = parseInt(parts[1], 10);
        return { filename: f, timestamp: ts };
      })
      .sort((a, b) => a.timestamp - b.timestamp); // oldest first

    // Keep only last 3 backups
    if (backups.length > 3) {
      const toRemove = backups.slice(0, backups.length - 3);
      for (const item of toRemove) {
        await fs.unlink(path.join(versionsDir, item.filename));
      }
    }
  } catch (err) {
    console.error(`Error creating version backup for ${filePath}:`, err);
  }
}

/**
 * Retrieves the version history for a given file.
 * @param {string} filePath - Absolute path to the file
 */
export async function getVersions(filePath) {
  try {
    const fileHash = getHash(filePath);
    const files = await fs.readdir(versionsDir);
    const list = files
      .filter(f => f.startsWith(`${fileHash}_`))
      .map(f => {
        const parts = f.split('_');
        const ts = parseInt(parts[1], 10);
        const originalName = parts.slice(2).join('_');
        return {
          filename: f,
          originalName,
          timestamp: ts,
          date: new Date(ts).toLocaleString(),
          backupPath: path.join(versionsDir, f)
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp); // newest first
    return list;
  } catch (err) {
    console.error(`Error listing versions for ${filePath}:`, err);
    return [];
  }
}

/**
 * Restores a specific backup version to the original path.
 * @param {string} filePath - Original absolute file path
 * @param {string} backupFilename - The filename of the backup to restore
 */
export async function restoreVersion(filePath, backupFilename) {
  const backupPath = path.join(versionsDir, backupFilename);
  // Before restoring, save the current version as a backup (it might be useful!)
  await createVersion(filePath);
  await fs.copyFile(backupPath, filePath);
}
