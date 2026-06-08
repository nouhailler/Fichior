import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import { getDb } from './db.js';
import { indexFile, removeFileFromIndex } from './indexer.js';

let watchers = {}; // Map of ruleId -> chokidar watcher instance

/**
 * Moves a file safely, handling cross-device moves by falling back to copy/unlink.
 */
async function safeMove(src, dest) {
  try {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.rename(src, dest);
  } catch (err) {
    if (err.code === 'EXDEV') {
      await fs.copyFile(src, dest);
      await fs.unlink(src);
    } else {
      throw err;
    }
  }
}

/**
 * Initializes and starts all enabled watchdog rules from the database.
 */
export async function initWatchdog() {
  const db = await getDb();
  try {
    const rules = await db.all(`SELECT * FROM watchdog_rules WHERE enabled = 1`);
    for (const rule of rules) {
      await startWatchRule(rule);
    }
  } catch (err) {
    console.error('Failed to initialize watchdog rules:', err);
  }
}

/**
 * Starts watching for a single rule.
 */
export async function startWatchRule(rule) {
  // Stop existing watcher if running
  if (watchers[rule.id]) {
    await watchers[rule.id].close();
    delete watchers[rule.id];
  }

  try {
    // Ensure source directory exists
    await fs.mkdir(rule.source_dir, { recursive: true });

    const watcher = chokidar.watch(rule.source_dir, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      depth: 0, // watch only immediate directory contents
      ignoreInitial: true
    });

    watcher.on('add', async (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const triggerExt = rule.trigger_ext.toLowerCase();

      // Check if extension matches or is wildcard '*'
      if (triggerExt === '*' || ext === triggerExt || (triggerExt.startsWith('.') && ext === triggerExt)) {
        console.log(`Watchdog Rule [${rule.id}] triggered for: ${filePath}`);

        // Wait a small moment to ensure the file has completed writing
        await new Promise(resolve => setTimeout(resolve, 500));

        const fileName = path.basename(filePath);
        const destPath = path.join(rule.target_dir, fileName);

        try {
          // Move the file
          await safeMove(filePath, destPath);
          console.log(`Watchdog moved: ${filePath} -> ${destPath}`);

          // Remove old path from index
          await removeFileFromIndex(filePath);

          // Index new file path
          await indexFile(destPath);

          // Add tags if defined
          if (rule.add_tags) {
            const tagNames = JSON.parse(rule.add_tags);
            const db = await getDb();

            for (const tagName of tagNames) {
              // Get or create tag
              let tag = await db.get(`SELECT id FROM tags WHERE name = ?`, [tagName]);
              if (!tag) {
                const res = await db.run(`INSERT INTO tags (name, color) VALUES (?, ?)`, [tagName, '#8b5cf6']);
                tag = { id: res.lastID };
              }

              // Map tag to new file path
              await db.run(
                `INSERT OR IGNORE INTO file_tags (file_path, tag_id) VALUES (?, ?)`,
                [destPath, tag.id]
              );
            }
          }
        } catch (moveErr) {
          console.error(`Watchdog failed to process file ${filePath}:`, moveErr);
        }
      }
    });

    watchers[rule.id] = watcher;
    console.log(`Started watchdog watcher for rule ${rule.id} on: ${rule.source_dir}`);
  } catch (err) {
    console.error(`Failed to start watch rule ${rule.id}:`, err);
  }
}

/**
 * Stops a running watch rule.
 */
export async function stopWatchRule(ruleId) {
  if (watchers[ruleId]) {
    await watchers[ruleId].close();
    delete watchers[ruleId];
    console.log(`Stopped watchdog rule ${ruleId}`);
  }
}
