const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DB_PATH = path.join(__dirname, "vocalflow.db");
const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function initDatabase() {
  await run(`
    PRAGMA foreign_keys = ON;
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS drives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      root_path TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_code TEXT NOT NULL UNIQUE,
      project_name TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL UNIQUE,
      relative_path TEXT,
      extension TEXT,
      size_bytes INTEGER,
      mtime_ms INTEGER,
      file_hash TEXT,
      drive_id INTEGER,
      project_id INTEGER,
      episode_number TEXT,
      asset_type TEXT,
      is_missing INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      intake_source TEXT,
      analytics_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE SET NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
  `);

  // Migration: add is_deleted if schema predates it
  const existingCols = await all(`PRAGMA table_info(assets)`);
  if (!existingCols.some((col) => col.name === "is_deleted")) {
    await run(`ALTER TABLE assets ADD COLUMN is_deleted INTEGER DEFAULT 0`);
  }

  await run(`CREATE INDEX IF NOT EXISTS idx_assets_file_hash ON assets(file_hash)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_assets_drive_id ON assets(drive_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_assets_missing ON assets(is_missing)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_assets_deleted ON assets(is_deleted)`);
}

async function ensureDrive(name, rootPath) {
  const existing = await get(`SELECT * FROM drives WHERE root_path = ?`, [rootPath]);
  if (existing) return existing.id;

  const result = await run(
    `INSERT INTO drives (name, root_path) VALUES (?, ?)`,
    [name, rootPath]
  );
  return result.lastID;
}

async function ensureProject(projectCode, projectName = null) {
  if (!projectCode) return null;

  const existing = await get(`SELECT * FROM projects WHERE project_code = ?`, [projectCode]);
  if (existing) {
    await run(
      `UPDATE projects
       SET project_name = COALESCE(?, project_name),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [projectName, existing.id]
    );
    return existing.id;
  }

  const result = await run(
    `INSERT INTO projects (project_code, project_name) VALUES (?, ?)`,
    [projectCode, projectName]
  );
  return result.lastID;
}

async function upsertAsset(asset) {
  const {
    file_name,
    file_path,
    relative_path,
    extension,
    size_bytes,
    mtime_ms,
    file_hash,
    drive_id,
    project_code,
    project_name,
    episode_number,
    asset_type,
    intake_source,
    analytics_json
  } = asset;

  const project_id = project_code ? await ensureProject(project_code, project_name) : null;

  const existingByPath = await get(`SELECT * FROM assets WHERE file_path = ?`, [file_path]);

  if (existingByPath) {
    await run(
      `UPDATE assets
       SET file_name = ?,
           relative_path = ?,
           extension = ?,
           size_bytes = ?,
           mtime_ms = ?,
           file_hash = ?,
           drive_id = ?,
           project_id = COALESCE(?, project_id),
           episode_number = ?,
           asset_type = ?,
           intake_source = ?,
           analytics_json = ?,
           is_missing = 0,
           is_deleted = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        file_name,
        relative_path,
        extension,
        size_bytes,
        mtime_ms,
        file_hash,
        drive_id,
        project_id,
        episode_number,
        asset_type,
        intake_source,
        analytics_json,
        existingByPath.id
      ]
    );
    return existingByPath.id;
  }

  if (file_hash) {
    const existingByHash = await get(
      `SELECT * FROM assets WHERE file_hash = ? ORDER BY id ASC LIMIT 1`,
      [file_hash]
    );

    if (existingByHash) {
      await run(
        `UPDATE assets
         SET file_name = ?,
             file_path = ?,
             relative_path = ?,
             extension = ?,
             size_bytes = ?,
             mtime_ms = ?,
             drive_id = ?,
             project_id = COALESCE(?, project_id),
             episode_number = ?,
             asset_type = ?,
             intake_source = ?,
             analytics_json = ?,
             is_missing = 0,
             is_deleted = 0,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          file_name,
          file_path,
          relative_path,
          extension,
          size_bytes,
          mtime_ms,
          drive_id,
          project_id,
          episode_number,
          asset_type,
          intake_source,
          analytics_json,
          existingByHash.id
        ]
      );
      return existingByHash.id;
    }
  }

  const result = await run(
    `INSERT INTO assets (
      file_name,
      file_path,
      relative_path,
      extension,
      size_bytes,
      mtime_ms,
      file_hash,
      drive_id,
      project_id,
      episode_number,
      asset_type,
      intake_source,
      analytics_json,
      is_missing,
      is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      file_name,
      file_path,
      relative_path,
      extension,
      size_bytes,
      mtime_ms,
      file_hash,
      drive_id,
      project_id,
      episode_number,
      asset_type,
      intake_source,
      analytics_json
    ]
  );

  return result.lastID;
}

// FIX 1: Hard-delete a DB row by file path.
// Used by handleUnlink so moved files don't leave ghost rows in the inbox.
async function deleteAssetByPath(filePath) {
  await run(
    `DELETE FROM assets WHERE file_path = ?`,
    [filePath]
  );
}

async function markMissingByPath(filePath) {
  await run(
    `UPDATE assets
     SET is_missing = 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE file_path = ?`,
    [filePath]
  );
}

async function markDeletedByPath(filePath) {
  await run(
    `UPDATE assets
     SET is_missing = 1,
         is_deleted = 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE file_path = ?`,
    [filePath]
  );
}

// FIX 2: Also clear is_missing when unarchiving a file, not just is_deleted.
async function resetDeletedByPath(filePath) {
  await run(
    `UPDATE assets
     SET is_deleted = 0,
         is_missing = 0,
         updated_at = CURRENT_TIMESTAMP
     WHERE file_path = ?`,
    [filePath]
  );
}

async function updateAssetProjectByPath(filePath, projectCode, projectName = null) {
  const project_id = projectCode ? await ensureProject(projectCode, projectName) : null;
  await run(
    `UPDATE assets
     SET project_id = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE file_path = ?`,
    [project_id, filePath]
  );
}

async function getDashboardStats() {
  const stats = await get(`
    SELECT
      (SELECT COUNT(*) FROM assets WHERE is_missing = 0 AND is_deleted = 0) AS total_assets,
      (SELECT COUNT(*) FROM assets WHERE is_missing = 1 AND is_deleted = 0) AS missing_assets,
      (SELECT COUNT(*) FROM assets WHERE is_deleted = 1) AS deleted_assets,
      (SELECT COUNT(*) FROM projects) AS total_projects,
      (SELECT COUNT(*) FROM drives) AS total_drives
  `);
  return stats;
}

// FIX 3: Exclude ghost rows (is_missing=1 or is_deleted=1) so the inbox
// never shows files that have been moved or removed.
async function listAssets() {
  return all(`
    SELECT
      a.id,
      a.file_name,
      a.file_path,
      a.relative_path,
      a.extension,
      a.size_bytes,
      a.episode_number,
      a.asset_type,
      a.file_hash,
      a.drive_id,
      a.is_missing,
      a.is_deleted,
      a.updated_at,
      p.project_code,
      p.project_name
    FROM assets a
    LEFT JOIN projects p ON a.project_id = p.id
    WHERE a.is_missing = 0
      AND a.is_deleted = 0
    ORDER BY a.updated_at DESC
    LIMIT 500
  `);
}

async function listProjects() {
  return all(`
    SELECT
      p.id,
      p.project_code,
      p.project_name,
      p.status,
      p.updated_at,
      COUNT(a.id) AS asset_count
    FROM projects p
    LEFT JOIN assets a ON a.project_id = p.id AND a.is_missing = 0 AND a.is_deleted = 0
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `);
}

// Export closeDatabase so the quit handler can close the connection cleanly.
function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = {
  db,
  initDatabase,
  closeDatabase,
  ensureDrive,
  ensureProject,
  upsertAsset,
  deleteAssetByPath,
  markMissingByPath,
  markDeletedByPath,
  resetDeletedByPath,
  updateAssetProjectByPath,
  getDashboardStats,
  listAssets,
  listProjects
};