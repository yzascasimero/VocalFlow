process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception in main process:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in main process:', reason);
});

const os = require("os");
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const crypto = require("crypto");
const chokidar = require("chokidar");
const AdmZip = require("adm-zip");
const { spawn } = require("child_process");

const {
  initDatabase,
  closeDatabase,
  ensureDrive,
  upsertAsset,
  deleteAssetByPath,
  markMissingByPath,
  markDeletedByPath,
  resetDeletedByPath,
  updateAssetProjectByPath,
  getDashboardStats,
  getAnalyticsOverview,
  listAssets,
  listIntakeAssets,
  listProjects
} = require("./database");

let mainWindow = null;
let watcher = null;
let intakeSorter = null;

// Dev (`npm start`): data lives next to the app (this folder). Packaged: use Documents\VocalFlow.
// Override with VOCALFLOW_APP_ROOT if needed.
const APP_ROOT = process.env.VOCALFLOW_APP_ROOT
  ? path.resolve(process.env.VOCALFLOW_APP_ROOT)
  : app.isPackaged
    ? path.join(app.getPath("documents"), "VocalFlow")
    : path.resolve(__dirname);
const INTAKE_DIR = path.join(APP_ROOT, "VocalFlow_Intake");
const PROJECTS_DIR = path.join(APP_ROOT, "Projects");
const ARCHIVE_DIR = path.join(APP_ROOT, "Archive");
const EXTRACTED_DIR = path.join(APP_ROOT, "Extracted");

const WATCHED_DIRS = [INTAKE_DIR, PROJECTS_DIR, ARCHIVE_DIR, EXTRACTED_DIR];
const SUPPORTED_ASSET_EXTENSIONS = new Set([
  ".wav", ".mp3", ".flac", ".aac", ".m4a",
  ".txt", ".doc", ".docx", ".pdf", ".csv",
  ".zip", ".json", ".srt", ".vtt",
  ".png", ".jpg", ".jpeg", ".bmp", ".tiff",
  ".mp4", ".mov", ".avi"
]);

function normalizePath(p) {
  return path.normalize(p);
}

function isPathInside(parentPath, childPath) {
  const parent = normalizePath(parentPath);
  const child = normalizePath(childPath);
  return child === parent || child.startsWith(parent + path.sep);
}

function resolveManagedPath(relativePath = "") {
  const fullPath = normalizePath(path.join(APP_ROOT, relativePath));
  if (!isPathInside(APP_ROOT, fullPath)) {
    throw new Error("Access denied: path is outside managed workspace.");
  }
  return fullPath;
}

function sanitizeName(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) throw new Error("Name is required.");
  if (/[<>:"/\\|?*\x00-\x1F]/.test(trimmed)) {
    throw new Error("Name contains invalid characters.");
  }
  if (trimmed === "." || trimmed === "..") {
    throw new Error("Invalid name.");
  }
  return trimmed;
}

function extractProjectCodeFromPath(filePath) {
  try {
    // Check if the file is inside the Projects directory
    if (isPathInside(PROJECTS_DIR, filePath)) {
      const relative = path.relative(PROJECTS_DIR, filePath);
      const parts = relative.split(path.sep);
      // The first part is the project folder name
      if (parts.length > 0 && parts[0]) {
        return parts[0];
      }
    }
  } catch (error) {
    console.error("Error extracting project code from path:", error);
  }
  return null;
}

async function safeStat(targetPath) {
  try {
    return await fsp.stat(targetPath);
  } catch {
    return null;
  }
}

async function removePathRecursive(targetPath) {
  await fsp.rm(targetPath, { recursive: true, force: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#0b1220",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile(path.join(__dirname, "ui", "index.html"));
}

async function ensureDirectories() {
  for (const dir of [
    APP_ROOT,
    INTAKE_DIR,
    PROJECTS_DIR,
    path.join(APP_ROOT, "Images"),
    path.join(APP_ROOT, "Others"),
    ARCHIVE_DIR,
    path.join(ARCHIVE_DIR, "Deleted"),
    EXTRACTED_DIR
  ]) {
    await fsp.mkdir(dir, { recursive: true });
  }
}

function getPythonCommand() {
  if (process.platform === "win32") {
    return { cmd: "py", argsPrefix: ["-3"] };
  }
  return { cmd: "python3", argsPrefix: [] };
}

async function fileExists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isZip(filePath) {
  return path.extname(filePath).toLowerCase() === ".zip";
}

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_ASSET_EXTENSIONS.has(ext);
}

async function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function getDriveRoot(filePath) {
  const parsed = path.parse(filePath);
  return parsed.root || APP_ROOT;
}

function getDriveNameFromPath(filePath) {
  const root = getDriveRoot(filePath).replace(/\\+$/, "");
  return root || "Local Drive";
}

function startIntakeSorter() {
  const scriptPath = path.join(__dirname, "main.py");
  const python = getPythonCommand();
  const args = [...python.argsPrefix, scriptPath];

  intakeSorter = spawn(python.cmd, args, {
    windowsHide: true,
    cwd: __dirname,
    env: {
      ...process.env,
      VOCALFLOW_APP_ROOT: APP_ROOT,
      // Windows piped stdout defaults to cp1252; emoji in main.py would crash before initial_scan.
      PYTHONIOENCODING: "utf-8"
    }
  });

  console.log(`Intake sorter started (pid ${intakeSorter.pid}) — APP_ROOT=${APP_ROOT}`);

  intakeSorter.stdout?.on("data", (chunk) => {
    const line = chunk.toString().trim();
    if (line) console.log("[intake-sorter]", line);
  });

  intakeSorter.stderr?.on("data", (chunk) => {
    const line = chunk.toString().trim();
    if (line) console.error("[intake-sorter]", line);
  });

  intakeSorter.on("error", (err) => {
    console.error("Intake sorter failed to start:", err.message);
    intakeSorter = null;
  });

  intakeSorter.on("exit", (code, signal) => {
    if (signal === "SIGTERM" || signal === "SIGKILL") return;
    console.warn(`Intake sorter exited (code ${code ?? "null"})`);
    intakeSorter = null;
  });
}

async function runAnalytics(filePath) {
  return new Promise((resolve, reject) => {
    const python = getPythonCommand();
    const args = [...python.argsPrefix, path.join(__dirname, "analytics.py"), filePath];
    const child = spawn(python.cmd, args, { windowsHide: true });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `analytics.py exited with code ${code}`));
      }

      try {
        resolve(JSON.parse(stdout.trim() || "{}"));
      } catch (err) {
        reject(new Error(`Invalid JSON from analytics.py: ${err.message}`));
      }
    });

    child.on("error", reject);
  });
}

async function extractZip(zipPath) {
  const zipBaseName = path.basename(zipPath, path.extname(zipPath));
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destination = path.join(EXTRACTED_DIR, `${zipBaseName}_${timestamp}`);

  await fsp.mkdir(destination, { recursive: true });

  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destination, true);

  return destination;
}

async function processSingleFile(filePath, intakeSource = "watcher") {
  try {
    if (!(await fileExists(filePath))) return;
    if (!shouldProcessFile(filePath)) return;

    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) return;

    if (isZip(filePath)) {
      const extractedTo = await extractZip(filePath);
      notifyRenderer("intake:zip-extracted", { zipPath: filePath, extractedTo });
      return;
    }

    const analytics = await runAnalytics(filePath).catch((err) => {
      console.error("Analytics failed:", err.message);
      return {
        project_code: null,
        episode_number: null,
        asset_type: path.extname(filePath).replace(".", "").toLowerCase(),
        matches: [],
        error: err.message
      };
    });

    // If the file was auto-sorted into `Projects/<project_code>/...`, analytics.py may
    // still fail to detect the project. In that case, fall back to the folder name
    // so the inbox UI can classify it as "Assigned".
    const pathProjectCode = extractProjectCodeFromPath(filePath);
    const resolvedProjectCode = analytics.project_code || pathProjectCode || null;
    const resolvedProjectName = analytics.project_name || resolvedProjectCode || null;
    const analyticsResolved = {
      ...analytics,
      project_code: resolvedProjectCode,
      project_name: resolvedProjectName
    };

    const fileHash = await computeFileHash(filePath);
    const driveRoot = getDriveRoot(filePath);
    const driveId = await ensureDrive(getDriveNameFromPath(filePath), driveRoot);

    const assetPayload = {
      file_name: path.basename(filePath),
      file_path: filePath,
      relative_path: path.relative(APP_ROOT, filePath),
      extension: path.extname(filePath).toLowerCase(),
      size_bytes: stat.size,
      mtime_ms: Math.floor(stat.mtimeMs),
      file_hash: fileHash,
      drive_id: driveId,
      project_code: resolvedProjectCode,
      project_name: resolvedProjectName,
      episode_number: analytics.episode_number || null,
      asset_type: analytics.asset_type || path.extname(filePath).replace(".", ""),
      intake_source: intakeSource,
      analytics_json: JSON.stringify(analyticsResolved)
    };

    await upsertAsset(assetPayload);
    notifyRenderer("db:updated", { filePath, asset: assetPayload });
  } catch (err) {
    console.error("processSingleFile error:", err);
  }
}

async function handleUnlink(filePath) {
  try {
    // FIX: Hard-delete the row instead of marking is_missing=1.
    // When Python's sorter moves a file out of intake, Chokidar fires
    // unlink on the old path. Keeping is_missing=1 creates a ghost row
    // the inbox keeps showing and that fs:delete-item can't remove
    // (safeStat returns null for the already-moved file).
    await deleteAssetByPath(filePath);
    notifyRenderer("db:updated", { filePath, missing: true });
  } catch (err) {
    console.error("handleUnlink error:", err);
  }
}

function notifyRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

async function initialScan() {
  for (const dir of WATCHED_DIRS) {
    const exists = await fileExists(dir);
    if (!exists) continue;

    const entries = await walkDirectory(dir);
    for (const filePath of entries) {
      await processSingleFile(filePath, "initial_scan");
    }
  }
}

async function walkDirectory(dir) {
  const result = [];

  async function walk(current) {
    const entries = await fsp.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      // Skip hidden folders (e.g. .dart_tool, .cxx, .cmake, .git)
      // These are build/tool artifacts that should never be treated as assets.
      if (entry.name.startsWith(".")) continue;

      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        result.push(fullPath);
      }
    }
  }

  await walk(dir);
  return result;
}


// waitForSortOutcome: waits up to `timeoutMs` for the Python sorter to move a
// file out of intake. `scopeDir` constrains what counts as "recognized" —
// the file must land somewhere inside scopeDir (e.g. the folder the user has
// open) to be treated as auto-sorted. At the root layer pass PROJECTS_DIR.
async function waitForSortOutcome(intakePath, timeoutMs = 12000, scopeDir = PROJECTS_DIR) {
  const start = Date.now();
  const pollMs = 400;
  const fileName = path.basename(intakePath);

  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, pollMs));

    // If the file is still in intake the sorter hasn't moved it yet (or won't).
    const stillInIntake = await fileExists(intakePath);

    if (!stillInIntake) {
      // File moved — find its new location from the DB by file_name + hash
      // (the add-event will have upserted it at the new path by now).
      const { db } = require("./database");
      const row = await new Promise((res, rej) => {
        db.get(
          `SELECT file_path, project_id FROM assets
           WHERE file_name = ? AND is_missing = 0 AND is_deleted = 0
           ORDER BY updated_at DESC LIMIT 1`,
          [fileName],
          (err, r) => err ? rej(err) : res(r)
        );
      });
      if (row) {
        const newPath = row.file_path;
        const inProjects = isPathInside(scopeDir, newPath);
        return { moved: true, finalPath: newPath, inProjects, recognized: inProjects };
      }
      return { moved: true, finalPath: null, inProjects: false, recognized: false };
    }
  }

  // Timed out — file stayed in intake, sorter couldn't match it.
  return { moved: false, finalPath: intakePath, inProjects: false, recognized: false };
}

// Build a human-readable activity log entry for an import outcome.
function buildActivityEntry(fileName, outcome) {
  if (outcome.recognized && outcome.finalPath) {
    const rel = path.relative(APP_ROOT, outcome.finalPath);
    return { label: "sorted", message: `"${fileName}" has been automatically moved to ${rel}` };
  }
  if (outcome.moved && !outcome.recognized) {
    return { label: "sorted", message: `"${fileName}" has been moved but not matched to a project folder` };
  }
  return { label: "inbox", message: `"${fileName}" needs manual assignment in Inbox` };
}

function setupWatcher() {
  watcher = chokidar.watch(WATCHED_DIRS, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1500,
      pollInterval: 100
    },
    depth: 20
  });

  watcher
    .on("add", async (filePath) => {
      await processSingleFile(filePath, "watcher_add");
      notifyRenderer("fs:changed", {
        type: "file-added",
        relativePath: path.relative(APP_ROOT, filePath)
      });
    })
    .on("change", async (filePath) => {
      await processSingleFile(filePath, "watcher_change");
      notifyRenderer("fs:changed", {
        type: "file-changed",
        relativePath: path.relative(APP_ROOT, filePath)
      });
    })
    .on("unlink", async (filePath) => {
      await handleUnlink(filePath);
      notifyRenderer("fs:changed", {
        type: "file-removed",
        relativePath: path.relative(APP_ROOT, filePath)
      });
    })
    .on("addDir", async (dirPath) => {
      notifyRenderer("fs:changed", {
        type: "directory-added",
        relativePath: path.relative(APP_ROOT, dirPath)
      });
    })
    .on("unlinkDir", async (dirPath) => {
      notifyRenderer("fs:changed", {
        type: "directory-removed",
        relativePath: path.relative(APP_ROOT, dirPath)
      });
    })
    .on("error", (error) => {
      console.error("Watcher error:", error);
    });
}

/* Core app IPC */

ipcMain.handle("app:get-paths", async () => {
  return {
    appRoot: APP_ROOT,
    intakeDir: INTAKE_DIR,
    projectsDir: PROJECTS_DIR,
    archiveDir: ARCHIVE_DIR,
    extractedDir: EXTRACTED_DIR
  };
});

ipcMain.handle("dashboard:get-stats", async () => {
  return getDashboardStats();
});

ipcMain.handle("analytics:get-overview", async () => {
  return getAnalyticsOverview();
});

ipcMain.handle("assets:list", async () => {
  return listAssets();
});

// Inbox-specific: only assets currently inside VocalFlow_Intake.
// Files that have been sorted into Projects/ are excluded — they are
// not "pending review", they have already been handled.
ipcMain.handle("assets:list-intake", async () => {
  return listIntakeAssets(INTAKE_DIR);
});

ipcMain.handle("projects:list", async () => {
  return listProjects();
});

// Projects folder summary — reads the Projects/ directory on disk and returns
// each top-level client folder with its subfolder count, total file count,
// total size, and last modified date. Fully filesystem-driven so it always
// reflects reality regardless of what the DB says.
ipcMain.handle("projects:folder-summary", async () => {
  try {
    const exists = await safeStat(PROJECTS_DIR);
    if (!exists) return [];

    const clientEntries = await fsp.readdir(PROJECTS_DIR, { withFileTypes: true });
    const clients = clientEntries.filter(e => e.isDirectory());

    const summary = await Promise.all(clients.map(async (client) => {
      const clientPath = path.join(PROJECTS_DIR, client.name);

      // Walk the client folder recursively to count files + size
      let fileCount = 0;
      let totalBytes = 0;
      let lastModifiedMs = 0;
      const subfolders = new Set();

      async function scanDir(dir, depth) {
        let entries;
        try { entries = await fsp.readdir(dir, { withFileTypes: true }); }
        catch { return; }

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            // Track direct subfolders of the client (project names)
            if (depth === 0) subfolders.add(entry.name);
            await scanDir(fullPath, depth + 1);
          } else {
            fileCount++;
            try {
              const st = await fsp.stat(fullPath);
              totalBytes += st.size;
              if (st.mtimeMs > lastModifiedMs) lastModifiedMs = st.mtimeMs;
            } catch { /* skip inaccessible files */ }
          }
        }
      }

      await scanDir(clientPath, 0);

      return {
        name: client.name,
        relativePath: path.relative(APP_ROOT, clientPath),
        projectCount: subfolders.size,
        projects: Array.from(subfolders).sort(),
        fileCount,
        totalBytes,
        lastModified: lastModifiedMs ? new Date(lastModifiedMs).toISOString() : null
      };
    }));

    // Sort by last modified descending — most recently active client first
    return summary.sort((a, b) => {
      if (!a.lastModified) return 1;
      if (!b.lastModified) return -1;
      return new Date(b.lastModified) - new Date(a.lastModified);
    });
  } catch (err) {
    console.error("projects:folder-summary error:", err);
    return [];
  }
});

ipcMain.handle("intake:rescan", async () => {
  await initialScan();
  return { ok: true };
});

/* Filesystem IPC */

ipcMain.handle("fs:list-directory", async (_event, { relativePath = "" }) => {
  try {
    const fullPath = resolveManagedPath(relativePath);
    const stat = await safeStat(fullPath);

    if (!stat) {
      throw new Error("Directory not found.");
    }

    if (!stat.isDirectory()) {
      throw new Error("Target is not a directory.");
    }

    const entries = await fsp.readdir(fullPath, { withFileTypes: true });

    const items = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(fullPath, entry.name);
        const entryStat = await safeStat(entryPath);

        return {
          name: entry.name,
          relativePath: path.relative(APP_ROOT, entryPath),
          isDirectory: entry.isDirectory(),
          size: entryStat?.size ?? 0,
          updatedAt: entryStat?.mtime?.toISOString?.() ?? null
        };
      })
    );

    items.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      ok: true,
      currentPath: path.relative(APP_ROOT, fullPath),
      items
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("fs:create-folder", async (_event, { parentRelativePath, folderName }) => {
  try {
    const safeName = sanitizeName(folderName);
    const parentPath = resolveManagedPath(parentRelativePath || "Projects");
    const parentStat = await safeStat(parentPath);

    if (!parentStat || !parentStat.isDirectory()) {
      throw new Error("Parent folder not found.");
    }

    const targetPath = path.join(parentPath, safeName);

    if (await safeStat(targetPath)) {
      throw new Error("A file or folder with that name already exists.");
    }

    await fsp.mkdir(targetPath, { recursive: false });

    notifyRenderer("fs:changed", {
      type: "directory-created",
      relativePath: path.relative(APP_ROOT, targetPath)
    });

    return {
      ok: true,
      relativePath: path.relative(APP_ROOT, targetPath)
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("fs:rename-item", async (_event, { relativePath, newName }) => {
  try {
    const safeName = sanitizeName(newName);
    const sourcePath = resolveManagedPath(relativePath);
    const sourceStat = await safeStat(sourcePath);

    if (!sourceStat) {
      throw new Error("Item not found.");
    }

    const parentDir = path.dirname(sourcePath);
    const targetPath = path.join(parentDir, safeName);

    if (normalizePath(sourcePath) === normalizePath(targetPath)) {
      return {
        ok: true,
        oldRelativePath: relativePath,
        newRelativePath: relativePath
      };
    }

    if (await safeStat(targetPath)) {
      throw new Error("Another item with that name already exists.");
    }

    await fsp.rename(sourcePath, targetPath);

    if (sourceStat.isDirectory()) {
      const renamedFiles = await walkDirectory(targetPath);
      for (const filePath of renamedFiles) {
        await processSingleFile(filePath, "rename_item");
      }
    } else {
      await processSingleFile(targetPath, "rename_item");
      await handleUnlink(sourcePath);
    }

    notifyRenderer("fs:changed", {
      type: "item-renamed",
      oldRelativePath: relativePath,
      newRelativePath: path.relative(APP_ROOT, targetPath)
    });

    return {
      ok: true,
      oldRelativePath: relativePath,
      newRelativePath: path.relative(APP_ROOT, targetPath)
    };
  } catch (error) {
    console.error("Rename error:", error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("fs:move-item", async (_event, { sourceRelativePath, targetParentRelativePath }) => {
  try {
    const sourcePath = resolveManagedPath(sourceRelativePath);
    const targetParentPath = resolveManagedPath(targetParentRelativePath || "");
    const sourceStat = await safeStat(sourcePath);
    const targetParentStat = await safeStat(targetParentPath);

    if (!sourceStat) {
      throw new Error("Source item not found.");
    }

    if (!targetParentStat || !targetParentStat.isDirectory()) {
      throw new Error("Target folder not found.");
    }

    const targetPath = path.join(targetParentPath, path.basename(sourcePath));

    if (await safeStat(targetPath)) {
      throw new Error("Target already contains an item with the same name.");
    }

    const oldFilePaths = sourceStat.isDirectory() ? await walkDirectory(sourcePath) : [];

    await fsp.rename(sourcePath, targetPath);

    if (sourceStat.isDirectory()) {
      const movedFiles = await walkDirectory(targetPath);
      for (const filePath of movedFiles) {
        await processSingleFile(filePath, "move_item");
      }

      for (const oldFilePath of oldFilePaths) {
        await markMissingByPath(oldFilePath);
      }
    } else {
      await processSingleFile(targetPath, "move_item");
      await handleUnlink(sourcePath);
    }

    notifyRenderer("fs:changed", {
      type: "item-moved",
      oldRelativePath: sourceRelativePath,
      newRelativePath: path.relative(APP_ROOT, targetPath)
    });

    return {
      ok: true,
      oldRelativePath: sourceRelativePath,
      newRelativePath: path.relative(APP_ROOT, targetPath)
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("fs:delete-item", async (_event, { relativePath }) => {
  try {
    const targetPath = resolveManagedPath(relativePath);
    const stat = await safeStat(targetPath);

    if (stat) {
      // File/folder exists on disk — remove it and mark all children deleted.
      const filePaths = stat.isDirectory() ? await walkDirectory(targetPath) : [targetPath];
      await removePathRecursive(targetPath);
      for (const filePath of filePaths) {
        await markDeletedByPath(filePath);
      }
    } else {
      // FIX: File is already gone from disk (moved by the Python sorter).
      // Don't throw — just purge the ghost DB row so the inbox clears.
      await deleteAssetByPath(targetPath);
    }

    notifyRenderer("fs:changed", {
      type: "item-deleted",
      relativePath
    });

    return { ok: true, relativePath };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("fs:open-item", async (_event, { relativePath }) => {
  try {
    const targetPath = resolveManagedPath(relativePath);
    const stat = await safeStat(targetPath);

    if (!stat) {
      throw new Error("Item not found.");
    }

    await shell.openPath(targetPath);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("fs:open-items", async (_event, { items }) => {
  try {
    for (const relativePath of items) {
      const targetPath = resolveManagedPath(relativePath);
      const stat = await safeStat(targetPath);

      if (!stat) continue;

      await shell.openPath(targetPath);
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("fs:import-files", async (_event, { scopeRelativePath = "" } = {}) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"]
    });

    if (result.canceled) return { ok: false, canceled: true };

    // Resolve the scope: the folder the user is currently browsing.
    // At the root layer scopeRelativePath is "" (treats all of Projects as scope).
    const scopeDir = scopeRelativePath
      ? resolveManagedPath(scopeRelativePath)
      : PROJECTS_DIR;

    const outcomes = [];
    const errors = [];

    for (const file of result.filePaths) {
      const fileName = path.basename(file);
      const intakeDest = path.join(INTAKE_DIR, fileName);

      if (await safeStat(intakeDest)) {
        errors.push({ file: fileName, error: "Already exists in intake" });
        continue;
      }

      // 1. Copy into intake so the Python sorter can see it.
      await fsp.copyFile(file, intakeDest);

      // 2. Register in DB immediately so the inbox can show it while sorting.
      await processSingleFile(intakeDest, "import_files");

      // 3. Wait for the Python sorter to move it — but only look within scopeDir.
      const outcome = await waitForSortOutcome(intakeDest, 12000, scopeDir);
      const activity = buildActivityEntry(fileName, outcome);

      outcomes.push({
        fileName,
        intakePath: path.relative(APP_ROOT, intakeDest),
        finalPath: outcome.finalPath ? path.relative(APP_ROOT, outcome.finalPath) : null,
        recognized: outcome.recognized,
        inProjects: outcome.inProjects,
        activity
      });
    }

    notifyRenderer("fs:changed", {
      type: "files-imported",
      outcomes,
      errors
    });

    return { ok: true, outcomes, errors };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("fs:import-folder", async (_event, { scopeRelativePath = "" } = {}) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    });

    if (result.canceled) return { ok: false, canceled: true };

    const scopeDir = scopeRelativePath
      ? resolveManagedPath(scopeRelativePath)
      : PROJECTS_DIR;

    const sourceFolder = result.filePaths[0];
    const folderName = path.basename(sourceFolder);
    const intakeDest = path.join(INTAKE_DIR, folderName);

    if (await safeStat(intakeDest)) {
      throw new Error(`Folder already exists in intake: ${folderName}`);
    }

    // 1. Copy the whole folder into intake.
    await fsp.cp(sourceFolder, intakeDest, { recursive: true });

    // 2. Register all files in DB so the inbox can show them.
    const importedFiles = await walkDirectory(intakeDest);
    for (const filePath of importedFiles) {
      await processSingleFile(filePath, "import_folder");
    }

    // 3. Wait for each file's sort outcome — scoped to the current layer.
    const outcomes = [];
    for (const filePath of importedFiles) {
      const fileName = path.basename(filePath);
      const outcome = await waitForSortOutcome(filePath, 12000, scopeDir);
      const activity = buildActivityEntry(fileName, outcome);
      outcomes.push({
        fileName,
        intakePath: path.relative(APP_ROOT, filePath),
        finalPath: outcome.finalPath ? path.relative(APP_ROOT, outcome.finalPath) : null,
        recognized: outcome.recognized,
        inProjects: outcome.inProjects,
        activity
      });
    }

    notifyRenderer("fs:changed", {
      type: "folder-imported",
      folderName,
      relativePath: path.relative(APP_ROOT, intakeDest),
      outcomes
    });

    return { ok: true, folder: intakeDest, outcomes };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("fs:move-items", async (_event, { items, targetParentRelativePath }) => {
  try {
    const targetParentPath = resolveManagedPath(targetParentRelativePath || "");
    const targetParentStat = await safeStat(targetParentPath);

    if (!targetParentStat || !targetParentStat.isDirectory()) {
      throw new Error("Target folder not found.");
    }

    const moved = [];

    for (const relativePath of items) {
      const sourcePath = resolveManagedPath(relativePath);
      const sourceStat = await safeStat(sourcePath);

      if (!sourceStat) continue;

      const targetPath = path.join(targetParentPath, path.basename(sourcePath));

      if (await safeStat(targetPath)) {
        throw new Error(`Target already contains: ${path.basename(sourcePath)}`);
      }

      // If it's a folder, capture the old file paths so the database can mark them missing after move.
      const oldFilePaths = sourceStat.isDirectory() ? await walkDirectory(sourcePath) : [];

      await fsp.rename(sourcePath, targetPath);

      if (sourceStat.isDirectory()) {
        const movedFiles = await walkDirectory(targetPath);
        for (const filePath of movedFiles) {
          await processSingleFile(filePath, "move_items");
        }

        for (const oldFilePath of oldFilePaths) {
          await markMissingByPath(oldFilePath);
        }
      } else {
        await processSingleFile(targetPath, "move_items");
        await handleUnlink(sourcePath);
      }

      moved.push({
        oldRelativePath: relativePath,
        newRelativePath: path.relative(APP_ROOT, targetPath)
      });
    }

    notifyRenderer("fs:changed", {
      type: "items-moved",
      moved
    });

    // If moving to deleted folder, mark as deleted
    if (targetParentRelativePath === "Archive/Deleted") {
      for (const move of moved) {
        const newPath = resolveManagedPath(move.newRelativePath);
        const stat = await safeStat(newPath);
        if (stat?.isDirectory()) {
          const files = await walkDirectory(newPath);
          for (const file of files) {
            await markDeletedByPath(file);
          }
        } else {
          await markDeletedByPath(newPath);
        }
      }
    }

    // If moving to Intake (unarchiving), reset is_deleted
    if (targetParentRelativePath === "") {
      for (const move of moved) {
        const newPath = resolveManagedPath(move.newRelativePath);
        const stat = await safeStat(newPath);
        if (stat?.isDirectory()) {
          const files = await walkDirectory(newPath);
          for (const file of files) {
            await resetDeletedByPath(file);
          }
        } else {
          await resetDeletedByPath(newPath);
        }
      }
    }

    // If moving to a project folder, assign the project to the files
    const projectCode = extractProjectCodeFromPath(targetParentPath);
    if (projectCode) {
      for (const move of moved) {
        const newPath = resolveManagedPath(move.newRelativePath);
        const stat = await safeStat(newPath);
        if (stat?.isDirectory()) {
          const files = await walkDirectory(newPath);
          for (const file of files) {
            await updateAssetProjectByPath(file, projectCode);
          }
        } else {
          await updateAssetProjectByPath(newPath, projectCode);
        }
      }
    }

    return { ok: true, moved };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("fs:delete-items", async (_event, { items }) => {
  try {
    const deleted = [];

    for (const relativePath of items) {
      const targetPath = resolveManagedPath(relativePath);
      const stat = await safeStat(targetPath);

      if (stat) {
        // File/folder is on disk — remove it and mark DB records deleted.
        const filePaths = stat.isDirectory() ? await walkDirectory(targetPath) : [targetPath];
        await removePathRecursive(targetPath);
        for (const filePath of filePaths) {
          await markDeletedByPath(filePath);
        }
      } else {
        // FIX: Already gone from disk — just purge the ghost DB row.
        await deleteAssetByPath(targetPath);
      }

      deleted.push(relativePath);
    }

    notifyRenderer("fs:changed", {
      type: "items-deleted",
      deleted
    });

    return { ok: true, deleted };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("fs:select-target-folder", async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      defaultPath: PROJECTS_DIR
    });

    if (result.canceled) return { ok: false, canceled: true };

    const selectedPath = result.filePaths[0];
    const relativePath = path.relative(APP_ROOT, selectedPath);

    return { ok: true, relativePath };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle("intake:list-folders", async () => {
  try {
    const entries = await fsp.readdir(INTAKE_DIR, { withFileTypes: true });

    const folders = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const fullPath = path.join(INTAKE_DIR, entry.name);
          const stat = await safeStat(fullPath);

          // FIX: Count files inside the folder — skip empty folders so that
          // clearing intake via File Explorer leaves no ghost entries in inbox.
          const contents = await fsp.readdir(fullPath).catch(() => []);
          if (contents.length === 0) return null;

          return {
            name: entry.name,
            relative_path: path.relative(APP_ROOT, fullPath),
            file_path: fullPath,
            is_directory: true,
            is_missing: false,
            updated_at: stat?.mtime?.toISOString?.() ?? null,
            asset_type: "folder"
          };
        })
    );

    // Filter out nulls (empty folders)
    return folders.filter(Boolean);
  } catch (error) {
    console.error("intake:list-folders error:", error);
    return [];
  }
});

app.whenReady().then(async () => {
  await ensureDirectories();
  await initDatabase();
  createWindow();
  await initialScan();
  setupWatcher();
  // Start after chokidar is running so it can observe `unlink`/`add` events
  // triggered by the Python intake sorter.
  startIntakeSorter();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// FIX: Use will-quit + preventDefault so async cleanup is actually awaited
// before the process exits. before-quit is not awaited by Electron.
app.on("will-quit", (e) => {
  e.preventDefault();
  (async () => {
    try {
      if (intakeSorter && !intakeSorter.killed) {
        intakeSorter.kill();
        intakeSorter = null;
      }
      if (watcher) {
        await watcher.close();
      }
      await closeDatabase();
    } catch (err) {
      console.error("Cleanup error on quit:", err);
    } finally {
      app.exit(0);
    }
  })();
});