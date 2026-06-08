import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import os from 'os';

const userDataDir = path.join(os.homedir(), '.fichior');
const dbPath = path.join(userDataDir, 'fichior.db');

let db = null;

export async function getDb() {
  if (db) return db;

  // Ensure the user data directory exists
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      path TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      size INTEGER NOT NULL,
      type TEXT,
      ext TEXT,
      mtime INTEGER NOT NULL,
      birthtime INTEGER NOT NULL,
      hash TEXT,
      content TEXT,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS file_tags (
      file_path TEXT NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (file_path, tag_id),
      FOREIGN KEY (file_path) REFERENCES files(path) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      file_path TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      mtime INTEGER NOT NULL,
      FOREIGN KEY (file_path) REFERENCES files(path) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS smart_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      query_rules TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS watchdog_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_dir TEXT NOT NULL,
      trigger_ext TEXT NOT NULL,
      target_dir TEXT NOT NULL,
      add_tags TEXT,
      enabled INTEGER DEFAULT 1
    );
  `);

  // Insert some default tags if they don't exist
  const count = await db.get(`SELECT COUNT(*) as count FROM tags`);
  if (count.count === 0) {
    const defaultTags = [
      { name: 'urgent', color: '#ef4444' },
      { name: 'projetA', color: '#3b82f6' },
      { name: 'facture', color: '#10b981' },
      { name: 'à_lire', color: '#8b5cf6' },
      { name: 'perso', color: '#f59e0b' }
    ];
    for (const tag of defaultTags) {
      await db.run(`INSERT INTO tags (name, color) VALUES (?, ?)`, [tag.name, tag.color]);
    }
  }

  return db;
}
