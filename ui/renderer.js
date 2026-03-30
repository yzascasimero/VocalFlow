const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");
const themeToggle = document.getElementById("themeToggle");

const navItems = document.querySelectorAll(".nav-item[data-section]");
const pageSections = document.querySelectorAll(".page-section");

const assetsTableBody = document.getElementById("assetsTableBody");
const projectsTableBody = document.getElementById("projectsTableBody");
const archivedTableBody = document.getElementById("archivedTableBody");
const deletedTableBody = document.getElementById("deletedTableBody");
const inboxItemsTableBody = document.getElementById("inboxItemsTableBody");
const assignedItemsTableBody = document.getElementById("assignedItemsTableBody");
const pathsContainer = document.getElementById("pathsContainer");
const eventLog = document.getElementById("eventLog");
const analyticsFeed = document.getElementById("analyticsFeed");
const actionList = document.getElementById("actionList");
const projectsFolderGrid = document.getElementById("projectsFolderGrid");
const projectsSummaryGrid = document.getElementById("projectsSummaryGrid");
const projectBreadcrumbs = document.getElementById("projectBreadcrumbs");
const rescanBtn = document.getElementById("rescanBtn");
const addFolderBtn = document.getElementById("addFolderBtn");
const projectsBackBtn = document.getElementById("projectsBackBtn");

const inboxSearch = document.getElementById("inboxSearch");
const inboxFilterBtn = document.getElementById("inboxFilterBtn");
const inboxFilterMenu = document.getElementById("inboxFilterMenu");
const inboxFilterOptions = document.querySelectorAll(".filter-option");
const inboxTabs = document.getElementById("inboxTabs");
const projectsSearch = document.getElementById("projectsSearch");
const archiveSearch = document.getElementById("archiveSearch");

const viewArchiveBtn = document.getElementById("viewArchiveBtn");

let selectedArchiveItems = new Set();

const archiveSelectionLabel = document.getElementById("archiveSelectionLabel");
const archiveUnarchiveBtn = document.getElementById("archiveUnarchiveBtn");
const archiveDeleteBtn = document.getElementById("archiveDeleteBtn");
const archiveToggleSelectAllBtn = document.getElementById("archiveToggleSelectAllBtn");
const archiveActionBar = document.querySelector(".archive-action-bar");
const inboxSelectionLabel = document.getElementById("inboxSelectionLabel");
const inboxToggleSelectAllBtn = document.getElementById("inboxToggleSelectAllBtn");
const inboxOpenBtn = document.getElementById("inboxOpenBtn");
const inboxRenameBtn = document.getElementById("inboxRenameBtn");
const inboxMoveBtn = document.getElementById("inboxMoveBtn");
const inboxArchiveBtn = document.getElementById("inboxArchiveBtn");
const inboxDeleteBtn = document.getElementById("inboxDeleteBtn");

const inboxActionBar = document.querySelector(".inbox-action-bar");
const assignFilesBtn = document.getElementById("assignFilesBtn");
const viewDeletedBtn = document.getElementById("viewDeletedBtn");
const deletedFilesModal = document.getElementById("deletedFilesModal");
const deletedFilesModalCloseBtn = document.getElementById("deletedFilesModalCloseBtn");
const deletedFilesModalDoneBtn = document.getElementById("deletedFilesModalDoneBtn");

const inboxBadge = document.getElementById("inboxBadge");

const calendarGrid = document.getElementById("calendarGrid");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");

const todoComposer = document.getElementById("todoComposer");
const todoList = document.getElementById("todoList");
const todoDateLabel = document.getElementById("todoDateLabel");

const taskModal = document.getElementById("taskModal");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalCancelBtn = document.getElementById("modalCancelBtn");
const modalSaveBtn = document.getElementById("modalSaveBtn");
const modalTaskTitle = document.getElementById("modalTaskTitle");
const modalTaskNotes = document.getElementById("modalTaskNotes");
const modalTaskDate = document.getElementById("modalTaskDate");

const taskNotesModal = document.getElementById("taskNotesModal");
const notesModalCloseBtn = document.getElementById("notesModalCloseBtn");
const notesModalDoneBtn = document.getElementById("notesModalDoneBtn");
const notesTaskTitle = document.getElementById("notesTaskTitle");
const notesTaskBody = document.getElementById("notesTaskBody");

const renameModal = document.getElementById("renameModal");
const renameModalCloseBtn = document.getElementById("renameModalCloseBtn");
const renameModalCancelBtn = document.getElementById("renameModalCancelBtn");
const renameModalSaveBtn = document.getElementById("renameModalSaveBtn");
const renameInput = document.getElementById("renameInput");

const moveModal = document.getElementById("moveModal");
const moveModalCloseBtn = document.getElementById("moveModalCloseBtn");
const moveModalCancelBtn = document.getElementById("moveModalCancelBtn");
const moveModalSaveBtn = document.getElementById("moveModalSaveBtn");
const moveInput = document.getElementById("moveInput");

const addFolderModal = document.getElementById("addFolderModal");
const addFolderModalCloseBtn = document.getElementById("addFolderModalCloseBtn");
const addFolderModalCancelBtn = document.getElementById("addFolderModalCancelBtn");
const addFolderModalSaveBtn = document.getElementById("addFolderModalSaveBtn");
const addFolderInput = document.getElementById("addFolderInput");

const importFilesBtn = document.getElementById("importFilesBtn");
const importFolderBtn = document.getElementById("importFolderBtn");

const talentGrid = document.getElementById("talentGrid");
const addTalentBtn = document.getElementById("addTalentBtn");

const addTalentModal = document.getElementById("addTalentModal");
const addTalentModalCloseBtn = document.getElementById("addTalentModalCloseBtn");
const addTalentCancelBtn = document.getElementById("addTalentCancelBtn");
const addTalentSaveBtn = document.getElementById("addTalentSaveBtn");
const talentNameInput = document.getElementById("talentNameInput");

const TALENT_STORAGE_KEY = "vocalflow_talents_v1";
let talentStore = loadTalents();

let calendarDate = new Date();
let selectedDate = new Date();
let currentProjectPath = "Projects";
let projectPathHistory = [];   // stack of paths for back-button navigation
let currentInboxFilter = "all";
let archiveQuery = "";

let selectedInboxItems = new Set();
let cachedInboxFolders = [];

const TODO_STORAGE_KEY = "vocalflow_todos_v1";
let todoStore = loadTodos();

let cachedAssets = [];
let cachedProjects = [];
const analyticsTotalFiles = document.getElementById("analyticsTotalFiles");
const analyticsAssignmentRate = document.getElementById("analyticsAssignmentRate");
const analyticsArchivedCount = document.getElementById("analyticsArchivedCount");
const dailyTrendChart = document.getElementById("dailyTrendChart");
const weeklyTrendChart = document.getElementById("weeklyTrendChart");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleString();
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function formatBytes(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex += 1;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function showMessage(message) {
  window.alert(message);
}

function getRelativePathFromAbsolute(fullPath) {
  if (!fullPath) return "";
  const normalized = String(fullPath).replaceAll("\\", "/");
  const marker = "/VocalFlow/";
  const idx = normalized.indexOf(marker);
  if (idx === -1) return "";
  return normalized.slice(idx + marker.length);
}

function getAllInboxItems() {
  return [
    ...cachedAssets.map((item) => ({ ...item, is_directory: false })),
    ...cachedInboxFolders
  ];
}

function getSelectedInboxItems() {
  const allItems = [
    ...cachedAssets.map((item) => ({ ...item, is_directory: false })),
    ...cachedInboxFolders
  ];

  return allItems.filter((item) => selectedInboxItems.has(item.relative_path));
}

function updateArchiveActionState() {
  const selected = Array.from(selectedArchiveItems);
  if (archiveSelectionLabel) {
    archiveSelectionLabel.textContent = selected.length
      ? `${selected.length} item(s) selected`
      : "No items selected";
  }
  const hasSelection = selected.length > 0;
  if (archiveActionBar) {
    archiveActionBar.style.display = hasSelection ? 'flex' : 'none';
  }
  if (archiveUnarchiveBtn) {
    archiveUnarchiveBtn.disabled = !hasSelection;
  }
  if (archiveDeleteBtn) {
    archiveDeleteBtn.disabled = !hasSelection;
  }
}

function handleArchiveSelection(path, checked) {
  if (checked) {
    selectedArchiveItems.add(path);
  } else {
    selectedArchiveItems.delete(path);
  }
  updateArchiveActionState();
}

function updateInboxActionState() {
  const selected = getSelectedInboxItems();

  if (inboxSelectionLabel) {
    inboxSelectionLabel.textContent = selected.length
      ? `${selected.length} item(s) selected`
      : "No items selected";
  }

  const hasSelection = selected.length > 0;
  if (inboxActionBar) {
    inboxActionBar.style.display = hasSelection ? 'flex' : 'none';
  }

  [inboxOpenBtn, inboxRenameBtn, inboxMoveBtn, inboxArchiveBtn, inboxDeleteBtn].forEach((btn) => {
    if (btn) btn.disabled = !hasSelection;
  });

  if (inboxRenameBtn) {
    inboxRenameBtn.disabled = selected.length !== 1;
  }
}

function switchSection(sectionId) {
  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.section === sectionId);
  });

  pageSections.forEach((section) => {
    section.classList.toggle("active", section.id === sectionId);
  });
}

function showLogin() {
  loginView?.classList.add("active");
  appView?.classList.remove("active");
}

function showApp() {
  loginView?.classList.remove("active");
  appView?.classList.add("active");
}

function addLog(target, message) {
  if (!target) return;

  const row = document.createElement("div");
  row.className = "log-entry";
  row.innerHTML = `
    <span class="log-time">${new Date().toLocaleTimeString()}</span>
    <span class="log-message">${escapeHtml(message)}</span>
  `;
  target.prepend(row);
}

// addRecentActivity: writes a timestamped entry to both the event log and the
// analytics feed with a semantic label (sorted / inbox / removed / error).
const ACTIVITY_LABEL_CLASS = {
  sorted:  "info",
  inbox:   "success",
  removed: "archived",
  error:   "danger"
};

function addRecentActivity(label, message) {
  if (!eventLog && !analyticsFeed) return;

  const cls   = ACTIVITY_LABEL_CLASS[label] || "info";
  const time  = new Date().toLocaleTimeString();
  const html  = `
    <span class="log-time">${time}</span>
    <span class="mini-tag ${cls}" style="font-size:11px;padding:1px 6px;margin:0 4px;">${escapeHtml(label)}</span>
    <span class="log-message">${escapeHtml(message)}</span>
  `;

  [eventLog, analyticsFeed].forEach(target => {
    if (!target) return;
    const row = document.createElement("div");
    row.className = "log-entry";
    row.innerHTML = html;
    target.prepend(row);
  });
}

function renderActionList(assets) {
  if (!actionList) return;

  const urgentAssets = (assets || [])
    .filter((item) => getInboxStatus(item).label === "Unassigned")
    .slice(0, 8);
  if (!urgentAssets.length) {
    actionList.innerHTML = `<div class="empty-mini">No files currently need review.</div>`;
    return;
  }

  actionList.innerHTML = urgentAssets.map((asset) => {
    const status = getInboxStatus(asset);
    const displayName = asset.is_directory ? asset.name : asset.file_name;
    return `
    <div class="action-row">
      <div class="action-main">
        <strong>${escapeHtml(displayName)}</strong>
        <span>${escapeHtml(asset.project_code || "Unassigned Project")}</span>
      </div>
      <div class="action-tags">
        <span class="mini-tag ${status.className}">
          ${status.label}
        </span>
      </div>
    </div>
  `;
  }).join("");
}

function getInboxStatus(item) {
  // FIX: SQLite returns integers (0/1) not booleans — use truthy checks, not === true.
  if (item.is_deleted) {
    return { label: "Deleted", className: "danger" };
  }

  if (item.is_missing) {
    return { label: "Missing", className: "danger" };
  }

  const filePathLower = (item.file_path || "").toLowerCase();
  const isArchived =
    filePathLower.includes("\\archive\\") ||
    filePathLower.includes("/archive/") ||
    filePathLower.endsWith("\\archive") ||
    filePathLower.endsWith("/archive");

  if (isArchived) {
    return { label: "Archived", className: "archived" };
  }

  if (item.project_code) {
    return { label: "Assigned", className: "info" };
  }

  return { label: "Unassigned", className: "danger" };
}

function renderInboxTables(files, folders) {
  if (!inboxItemsTableBody || !assignedItemsTableBody || !archivedTableBody || !deletedTableBody) return;

  // Combine files and folders into one list
  const allItems = [
    ...files.map(item => ({ ...item, itemType: 'file' })),
    ...folders.map(item => ({ ...item, itemType: 'folder' }))
  ];

  // Sort by updated_at descending
  allItems.sort((a, b) => {
    const aDate = a.updated_at ? new Date(a.updated_at) : new Date(0);
    const bDate = b.updated_at ? new Date(b.updated_at) : new Date(0);
    return bDate - aDate;
  });

  // FIX: Separate active vs assigned, explicitly excluding archived/deleted/missing
  // from the active inbox so they never show up as ghost rows.
  const activeItems = allItems.filter(item => {
    if (item.is_deleted || item.is_missing) return false;
    const s = getInboxStatus(item);
    if (s.className === "archived" || s.className === "danger") return false;
    return !item.project_code;
  });

  const assignedItems = allItems.filter(item => {
    if (item.is_deleted || item.is_missing) return false;
    const s = getInboxStatus(item);
    if (s.className === "archived" || s.className === "danger") return false;
    return !!item.project_code;
  });

  // Helper function to render inbox table rows
  const renderInboxRows = (items, showCheckboxes = true) => {
    return items.map((item) => {
      const status = getInboxStatus(item);
      const name = item.itemType === 'file' ? item.file_name : item.name;
      const type = item.itemType === 'file' ? (item.asset_type || item.extension || "file") : "folder";
      const checkboxCell = showCheckboxes ? `
        <td>
          <input
            class="asset-select"
            type="checkbox"
            ${selectedInboxItems.has(item.relative_path) ? "checked" : ""}
          />
        </td>` : `<td></td>`;
      return `
      <tr class="${selectedInboxItems.has(item.relative_path) ? "selected-row" : ""}" data-path="${escapeHtml(item.relative_path)}">
        ${checkboxCell}
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(type)}</td>
        <td>${formatDate(item.updated_at)}</td>
        <td>
          <span class="status-chip ${status.className}">
            ${status.label}
          </span>
        </td>
        <td class="path-muted">${escapeHtml(item.relative_path)}</td>
      </tr>
    `;
    }).join("");
  };

  // Determine visibility based on filter
  const showActive = true;
  const showAssigned = currentInboxFilter === "all";

  // Get parent panels for active and assigned tables
  const activePanelParent = inboxItemsTableBody.closest(".inbox-panel");
  const assignedPanelParent = assignedItemsTableBody.closest(".inbox-panel");

  if (activePanelParent) activePanelParent.style.display = showActive ? "block" : "none";
  if (assignedPanelParent) assignedPanelParent.style.display = showAssigned ? "block" : "none";

  // Render active items
  if (!activeItems.length) {
    inboxItemsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table">No unassigned items.</td>
      </tr>
    `;
  } else {
    inboxItemsTableBody.innerHTML = renderInboxRows(activeItems, true);
  }

  // Render assigned items
  if (!assignedItems.length) {
    assignedItemsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-table">No assigned items.</td>
      </tr>
    `;
  } else {
    assignedItemsTableBody.innerHTML = renderInboxRows(assignedItems, false);
  }

  const archived = (cachedAssets || []).filter((asset) => {
    const status = getInboxStatus(asset);
    if (status.className !== "archived") return false;
    if (!archiveQuery) return true;
    return [asset.file_name, asset.relative_path]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(archiveQuery));
  });

  const deleted = (cachedAssets || []).filter((asset) => {
    const status = getInboxStatus(asset);
    if (!(status.className === "danger" && status.label === "Deleted")) return false;
    if (!archiveQuery) return true;
    return [asset.file_name, asset.relative_path]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(archiveQuery));
  });

  archivedTableBody.innerHTML = archived.length
    ? archived.map((asset) => {
        const status = getInboxStatus(asset);
        return `
      <tr class="${selectedArchiveItems.has(asset.relative_path) ? "selected-row" : ""}" data-path="${escapeHtml(asset.relative_path)}">
        <td>
          <input
            class="archive-select"
            type="checkbox"
            ${selectedArchiveItems.has(asset.relative_path) ? "checked" : ""}
          />
        </td>
        <td>${escapeHtml(asset.file_name)}</td>
        <td>${formatDateTime(asset.updated_at)}</td>
        <td><span class="status-chip ${status.className}">${status.label}</span></td>
      </tr>
    `;
      }).join("")
    : `
      <tr>
        <td colspan="4" class="empty-table">No archived files.</td>
      </tr>
    `;

  deletedTableBody.innerHTML = deleted.length
    ? deleted.map((asset) => {
        const status = getInboxStatus(asset);
        return `
      <tr>
        <td>${escapeHtml(asset.file_name)}</td>
        <td>${formatDateTime(asset.updated_at)}</td>
        <td><span class="status-chip ${status.className}">${status.label}</span></td>
      </tr>
    `;
      }).join("")
    : `
      <tr>
        <td colspan="3" class="empty-table">No deleted files.</td>
      </tr>
    `;

  updateInboxActionState();

  return { activeItems, assignedItems };
}

function renderBreadcrumbs(relativePath) {
  if (!projectBreadcrumbs) return;

  const cleaned = relativePath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const parts = cleaned ? cleaned.split("/") : [];
  let built = "";

  const crumbs = [];

  for (const part of parts) {
    built = built ? `${built}/${part}` : part;
    crumbs.push(`<span class="crumb-sep">›</span>`);
    crumbs.push(`<button class="crumb-btn" data-path="${escapeHtml(built)}">${escapeHtml(part)}</button>`);
  }

  projectBreadcrumbs.innerHTML = crumbs.join("");

  // Wire up crumb button clicks — also reset history up to the clicked crumb.
  projectBreadcrumbs.querySelectorAll(".crumb-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const targetPath = btn.dataset.path || "Projects";
      // Trim history to only paths that are ancestors of targetPath.
      projectPathHistory = projectPathHistory.filter((p) => {
        const t = (targetPath || "Projects").replace(/\\/g, "/");
        const h = (p || "Projects").replace(/\\/g, "/");
        return h !== t && t.startsWith(h + "/");
      });
      await loadProjectDirectory(targetPath, false);
      updateBackButton();
    });
  });
}

function renderDirectoryItems(items) {
  if (!projectsFolderGrid) return;

  if (!items.length) {
    projectsFolderGrid.innerHTML = `<div class="empty-mini">This folder is empty.</div>`;
    return;
  }

  projectsFolderGrid.innerHTML = items.map((item) => `
    <div class="folder-card" data-path="${escapeHtml(item.relativePath)}" data-dir="${item.isDirectory ? "1" : "0"}">
      <div class="folder-card-main">
        <div class="folder-card-icon">${item.isDirectory ? "🗀" : "📄"}</div>
        <div class="folder-card-meta">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${item.isDirectory ? "Folder" : formatBytes(item.size)}</span>
        </div>
      </div>

      <div class="folder-card-actions">
        <button class="mini-action" data-action="open" type="button">Open</button>
        <button class="mini-action" data-action="rename" type="button">Rename</button>
        <button class="mini-action" data-action="delete" type="button">Delete</button>
      </div>
    </div>
  `).join("");
}

async function loadProjectDirectory(relativePath = "Projects", pushHistory = true) {
  const result = await window.vocalflowAPI.listDirectory(relativePath);

  if (!result.ok) {
    showMessage(result.error || "Failed to load folder.");
    return;
  }

  // Push the previous path onto the history stack before navigating forward.
  if (pushHistory && currentProjectPath !== (result.currentPath || "")) {
    projectPathHistory.push(currentProjectPath);
  }

  currentProjectPath = result.currentPath || "";
  renderBreadcrumbs(currentProjectPath);
  renderDirectoryItems(result.items);
  if (importFilesBtn) {
    importFilesBtn.style.display = "inline-flex";
  }
  const atRootLayer = !currentProjectPath || currentProjectPath === "Projects";
  const summaryPanel = projectsSummaryGrid?.closest(".panel");
  if (summaryPanel) {
    summaryPanel.style.display = atRootLayer ? "block" : "none";
  }
  updateBackButton();
}

function updateBackButton() {
  if (!projectsBackBtn) return;
  // Disable when at the root ("Projects" or "") — nothing to go back to.
  const atRoot = !currentProjectPath || currentProjectPath === "Projects";
  projectsBackBtn.disabled = atRoot || projectPathHistory.length === 0;
}

async function navigateBack() {
  if (projectPathHistory.length === 0) return;
  const prev = projectPathHistory.pop();
  // Navigate without pushing to history (we're going backwards).
  await loadProjectDirectory(prev || "Projects", false);
  updateBackButton();
}

function renderProjectsSummary(clients) {
  if (!projectsSummaryGrid) return;

  if (!clients.length) {
    projectsSummaryGrid.innerHTML =
      `<div class="projects-summary-empty">No client folders found in Projects yet. Create one with "+ Add Folder".</div>`;
    return;
  }

  projectsSummaryGrid.innerHTML = clients.map(client => {
    const projectsList = client.projects.length
      ? client.projects.join(", ")
      : "No subfolders yet";
    const sizeLabel = formatBytes(client.totalBytes);
    const dateLabel = client.lastModified ? formatDate(client.lastModified) : "—";

    return `
      <div class="client-summary-card" data-path="${escapeHtml(client.relativePath)}">
        <div class="client-summary-name" title="${escapeHtml(client.name)}">${escapeHtml(client.name)}</div>
        <div class="client-summary-stats">
          <div class="client-stat">
            <div class="client-stat-num">${client.fileCount}</div>
            <div class="client-stat-label">files</div>
          </div>
          <div class="client-stat">
            <div class="client-stat-num">${client.projectCount}</div>
            <div class="client-stat-label">projects</div>
          </div>
          <div class="client-stat">
            <div class="client-stat-num">${sizeLabel}</div>
            <div class="client-stat-label">total size</div>
          </div>
          <div class="client-stat">
            <div class="client-stat-num">${dateLabel}</div>
            <div class="client-stat-label">last activity</div>
          </div>
        </div>
        <div class="client-summary-projects" title="${escapeHtml(projectsList)}">
          ${escapeHtml(projectsList)}
        </div>
      </div>
    `;
  }).join("");

  // Clicking a client card navigates into that folder
  projectsSummaryGrid.querySelectorAll(".client-summary-card").forEach(card => {
    card.addEventListener("click", () => {
      loadProjectDirectory(card.dataset.path);
    });
  });

  loadProjectDirectory(currentProjectPath).catch(err => {
    console.error("Directory load error:", err);
  });
}

async function loadPaths() {
  if (!pathsContainer || !window.vocalflowAPI?.getPaths) return;

  try {
    console.log("Calling getPaths");
    const paths = await window.vocalflowAPI.getPaths();
    console.log("Paths received:", paths);
    pathsContainer.innerHTML = `
      <div class="path-item"><span>App Root</span><code>${escapeHtml(paths.appRoot)}</code></div>
      <div class="path-item"><span>Intake</span><code>${escapeHtml(paths.intakeDir)}</code></div>
      <div class="path-item"><span>Projects</span><code>${escapeHtml(paths.projectsDir)}</code></div>
      <div class="path-item"><span>Archive</span><code>${escapeHtml(paths.archiveDir)}</code></div>
      <div class="path-item"><span>Extracted</span><code>${escapeHtml(paths.extractedDir)}</code></div>
    `;
  } catch (error) {
    console.error("loadPaths error:", error);
    throw error;
  }
}

async function loadStats() {
  if (!window.vocalflowAPI?.getDashboardStats) return;

  try {
    const [stats, analytics] = await Promise.all([
      window.vocalflowAPI.getDashboardStats(),
      window.vocalflowAPI.getAnalyticsOverview?.() ?? {}
    ]);

    const totalAssets   = document.getElementById("statTotalAssets");
    const missingAssets = document.getElementById("statMissingAssets");

    const activeUnassignedCount =
      (cachedAssets || []).filter(a => !a.is_missing && !a.is_deleted && !a.project_code).length +
      (cachedInboxFolders || []).filter(f => !f.is_missing && !f.is_deleted && !f.project_code).length;

    if (totalAssets)   totalAssets.textContent   = activeUnassignedCount;
    if (missingAssets) missingAssets.textContent = analytics.archived_count ?? stats.deleted_assets ?? 0;
  } catch (error) {
    console.error("loadStats error:", error);
    throw error;
  }
}

async function loadData() {
  if (!window.vocalflowAPI?.listAssets || !window.vocalflowAPI?.listProjects) return;

  try {
    console.log("Calling listIntakeAssets");
    // FIX: Only load assets physically in VocalFlow_Intake for the inbox.
    // Files sorted into Projects/ are not pending review — exclude them.
    cachedAssets = await window.vocalflowAPI.listIntakeAssets?.()
      ?? await window.vocalflowAPI.listAssets();
    console.log("Intake assets received:", cachedAssets?.length);
    console.log("Calling listProjects");
    cachedProjects = await window.vocalflowAPI.listProjects();
    console.log("Projects received:", cachedProjects?.length);
    console.log("Calling listIntakeFolders");
    cachedInboxFolders = await window.vocalflowAPI.listIntakeFolders();
    console.log("Folders received:", cachedInboxFolders?.length);

    // Load folder-based client summary
    const clientSummary = await window.vocalflowAPI.getProjectsFolderSummary?.() || [];

    applyInboxFilters();
    renderProjectsSummary(clientSummary);
    updateInboxBadge();
  } catch (error) {
    console.error("loadData error:", error);
    throw error;
  }
}

function updateInboxBadge() {
  if (!inboxBadge) return;

  // Count active intakes: unassigned files that are not missing + not archived + unassigned folders
  // FIX: Exclude ghost/missing/deleted rows from the badge count.
  const activeFiles = (cachedAssets || []).filter((item) => {
    if (item.is_missing || item.is_deleted) return false;
    const status = getInboxStatus(item);
    return status.className === "success" && !item.project_code;
  }).length;

  const activeFolders = (cachedInboxFolders || []).filter((item) => {
    if (item.is_missing || item.is_deleted) return false;
    const status = getInboxStatus(item);
    return status.className === "success" && !item.project_code;
  }).length;
  const totalActive = activeFiles + activeFolders;

  if (totalActive > 0) {
    inboxBadge.textContent = totalActive;
    inboxBadge.style.display = 'inline-block';
  } else {
    inboxBadge.style.display = 'none';
  }
}

async function refreshAll() {
  await loadData();
  await loadStats();
  await loadPaths();
  await loadAnalytics();
}

function handleInboxSelection(path, checked) {
  if (!path) return;

  if (checked) {
    selectedInboxItems.add(path);
  } else {
    selectedInboxItems.delete(path);
  }

  applyInboxFilters();
}

function openTaskModal() {
  if (!taskModal || !modalTaskTitle || !modalTaskNotes || !modalTaskDate) return;

  modalTaskTitle.value = "";
  modalTaskNotes.value = "";
  modalTaskDate.value = formatLongDate(selectedDate);
  taskModal.classList.add("active");

  setTimeout(() => {
    modalTaskTitle.focus();
  }, 50);
}

function closeTaskModal() {
  taskModal?.classList.remove("active");
}

function openNotesModal(todo) {
  if (!taskNotesModal || !notesTaskTitle || !notesTaskBody) return;

  notesTaskTitle.textContent = todo.text || "";
  notesTaskBody.textContent = todo.notes || "No notes available.";
  taskNotesModal.classList.add("active");
}

function closeNotesModal() {
  taskNotesModal?.classList.remove("active");
}

function openRenameModal(currentName, callback) {
  if (!renameModal || !renameInput) return;

  renameInput.value = currentName;
  renameModal.classList.add("active");

  setTimeout(() => {
    renameInput.focus();
    renameInput.select();
  }, 50);

  // Store the callback
  renameModal.callback = callback;
}

function closeRenameModal() {
  renameModal?.classList.remove("active");
  if (renameInput) renameInput.value = "";
}

function openMoveModal(callback) {
  if (!moveModal || !moveInput) return;

  moveInput.value = "Projects/";
  moveModal.classList.add("active");

  setTimeout(() => {
    moveInput.focus();
    moveInput.setSelectionRange(9, 9); // Select after "Projects/"
  }, 50);

  // Store the callback
  moveModal.callback = callback;
}

function closeMoveModal() {
  moveModal?.classList.remove("active");
  if (moveInput) moveInput.value = "";
}

function openAddFolderModal(callback) {
  if (!addFolderModal || !addFolderInput) return;

  addFolderInput.value = "";
  addFolderModal.classList.add("active");

  setTimeout(() => {
    addFolderInput.focus();
  }, 50);

  // Store the callback
  addFolderModal.callback = callback;
}

function closeAddFolderModal() {
  addFolderModal?.classList.remove("active");
  if (addFolderInput) addFolderInput.value = "";
}

function loadTodos() {
  try {
    const raw = localStorage.getItem(TODO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTodos() {
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todoStore));
}

function getTodosForDate(date) {
  const key = formatDateKey(date);
  return todoStore[key] || [];
}

function setTodosForDate(date, todos) {
  const key = formatDateKey(date);
  if (!todos.length) {
    delete todoStore[key];
  } else {
    todoStore[key] = todos;
  }
  saveTodos();
}

function renderTodoList() {
  if (!todoList || !todoDateLabel) return;

  const todos = getTodosForDate(selectedDate);
  todoDateLabel.textContent = `Tasks for ${formatLongDate(selectedDate)}`;

  if (!todos.length) {
    todoList.innerHTML = `
      <div class="todo-empty">
        No tasks for this date yet. Add one above.
      </div>
    `;
    return;
  }

  todoList.innerHTML = todos.map((todo) => `
    <div class="todo-item ${todo.completed ? "completed" : ""}" data-id="${todo.id}">
      <input
        type="checkbox"
        class="todo-checkbox"
        ${todo.completed ? "checked" : ""}
      />

      <div class="todo-content">
        <div class="todo-text">${escapeHtml(todo.text)}</div>
        ${todo.notes ? `<div class="todo-note-indicator">Has notes</div>` : ""}
      </div>

      <div class="todo-actions">
        ${todo.notes ? `<button class="todo-view-notes" data-action="view-notes" type="button">View Notes</button>` : ""}
        <button class="todo-delete" data-action="delete" type="button">Remove</button>
      </div>
    </div>
  `).join("");
}

function toggleTodoForSelectedDate(todoId) {
  const todos = getTodosForDate(selectedDate).map((todo) =>
    todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
  );

  setTodosForDate(selectedDate, todos);
  renderTodoList();
  renderCalendar(calendarDate);
}

function deleteTodoForSelectedDate(todoId) {
  const todos = getTodosForDate(selectedDate).filter((todo) => todo.id !== todoId);
  setTodosForDate(selectedDate, todos);
  renderTodoList();
  renderCalendar(calendarDate);
}

function renderCalendar(date) {
  if (!calendarGrid || !calendarMonthLabel) return;

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  const selectedKey = formatDateKey(selectedDate);

  calendarMonthLabel.textContent = firstDay.toLocaleString("en-US", {
    month: "long",
    year: "numeric"
  });

  const cells = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(`<div class="calendar-day empty"></div>`);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(year, month, day);
    const cellKey = formatDateKey(cellDate);

    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;

    const isSelected = cellKey === selectedKey;
    const hasEvent = (todoStore[cellKey] || []).length > 0;

    cells.push(`
      <button
        class="calendar-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${hasEvent ? "has-event" : ""}"
        data-date="${cellKey}"
        type="button"
      >
        <span>${day}</span>
      </button>
    `);
  }

  while (cells.length % 7 !== 0) {
    cells.push(`<div class="calendar-day empty"></div>`);
  }

  calendarGrid.innerHTML = cells.join("");

  calendarGrid.querySelectorAll(".calendar-day[data-date]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [y, m, d] = btn.dataset.date.split("-").map(Number);
      selectedDate = new Date(y, m - 1, d);
      renderCalendar(calendarDate);
      renderTodoList();
    });
  });
}

function applyInboxFilters() {
  const query = (inboxSearch?.value || "").toLowerCase().trim();

  let files = [...cachedAssets].map((item) => ({ ...item, is_directory: false }));
  let folders = [...cachedInboxFolders];

  if (query) {
    files = files.filter((item) =>
      [item.file_name, item.file_path, item.relative_path, item.asset_type]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query))
    );

    folders = folders.filter((item) =>
      [item.name, item.file_path, item.relative_path]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query))
    );
  }

  // Filter by type
  if (currentInboxFilter === "files") {
    folders = [];
  } else if (currentInboxFilter === "folders") {
    files = [];
  } else if (currentInboxFilter === "unassigned") {
    files = files.filter((item) => !item.project_code);
    folders = folders.filter((item) => !item.project_code);
  }

  const visiblePaths = new Set([
    ...files.map((item) => item.relative_path),
    ...folders.map((item) => item.relative_path)
  ]);

  selectedInboxItems = new Set(
    [...selectedInboxItems].filter((path) => visiblePaths.has(path))
  );

  // Render inbox and drive Action Needed from the same filtered dataset
  const result = renderInboxTables(files, folders);
  const activeItems = result?.activeItems || [];
  renderActionList(activeItems);
}

function toggleInboxFilterMenu() {
  inboxFilterMenu?.classList.toggle("active");
}

function closeInboxFilterMenu() {
  inboxFilterMenu?.classList.remove("active");
}

function bindSearch() {
  if (inboxSearch) {
    inboxSearch.addEventListener("input", () => {
      applyInboxFilters();
    });

    inboxSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyInboxFilters();
      }
    });
  }

  archiveSearch?.addEventListener("input", (e) => {
    archiveQuery = String(e.target.value || "").toLowerCase().trim();
    applyInboxFilters();
  });

  inboxFilterBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleInboxFilterMenu();
  });

  inboxFilterOptions.forEach((option) => {
    option.addEventListener("click", () => {
      currentInboxFilter = option.dataset.filter || "all";
      applyInboxFilters();
      closeInboxFilterMenu();
    });
  });

  inboxTabs?.querySelectorAll(".inbox-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      currentInboxFilter = tab.dataset.filter || "all";
      inboxTabs.querySelectorAll(".inbox-tab").forEach((btn) => btn.classList.remove("active"));
      tab.classList.add("active");
      applyInboxFilters();
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".filter-dropdown-wrap")) {
      closeInboxFilterMenu();
    }
  });

  if (projectsSearch) {
    let _searchTimer = null;
    projectsSearch.addEventListener("input", (e) => {
      clearTimeout(_searchTimer);
      const q = e.target.value.toLowerCase().trim();

      if (!q) {
        loadProjectDirectory(currentProjectPath);
        return;
      }

      _searchTimer = setTimeout(async () => {
        const matches = [];

        async function walkSearch(relativePath) {
          const res = await window.vocalflowAPI.listDirectory(relativePath);
          if (!res?.ok) return;
          for (const item of res.items) {
            if (item.name.toLowerCase().includes(q)) {
              matches.push(item);
            }
            if (item.isDirectory) {
              await walkSearch(item.relativePath);
            }
          }
        }

        await walkSearch("Projects");

        if (!projectsFolderGrid) return;

        if (!matches.length) {
          projectsFolderGrid.innerHTML = `<div class="empty-mini">No results for "${escapeHtml(q)}".</div>`;
          return;
        }

        projectsFolderGrid.innerHTML = matches.map((item) => `
          <div class="folder-card" data-path="${escapeHtml(item.relativePath)}" data-dir="${item.isDirectory ? "1" : "0"}">
            <div class="folder-card-main">
              <div class="folder-card-icon">${item.isDirectory ? "🗀" : "📄"}</div>
              <div class="folder-card-meta">
                <strong>${escapeHtml(item.name)}</strong>
                <span style="font-size:11px;opacity:0.6">${escapeHtml(item.relativePath)}</span>
              </div>
            </div>
            <div class="folder-card-actions">
              <button class="mini-action" data-action="open" type="button">Open</button>
              <button class="mini-action" data-action="rename" type="button">Rename</button>
              <button class="mini-action" data-action="delete" type="button">Delete</button>
            </div>
          </div>
        `).join("");
      }, 300);
    });
  }
}

function loadTalents() {
  try {
    const raw = localStorage.getItem(TALENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTalents() {
  localStorage.setItem(TALENT_STORAGE_KEY, JSON.stringify(talentStore));
}

function renderTalents() {
  if (!talentGrid) return;

  if (!talentStore.length) {
    talentGrid.innerHTML = `<div class="empty-mini">No talents yet.</div>`;
    return;
  }

  talentGrid.innerHTML = talentStore.map(talent => `
    <article class="talent-card">
      <div class="talent-avatar"></div>
      <h3>${escapeHtml(talent.name)}</h3>
      <button class="btn btn-primary btn-small">See Details</button>
    </article>
  `).join("");
}

function drawSimpleBarChart(canvas, points, valueKey, labelKey) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.clientWidth || 400;
  const height = canvas.clientHeight || 220;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  if (!points.length) return;
  const maxValue = Math.max(1, ...points.map((p) => Number(p[valueKey] || 0)));
  const barWidth = Math.max(12, Math.floor((width - 24) / points.length) - 6);
  const gap = 6;
  points.forEach((p, idx) => {
    const value = Number(p[valueKey] || 0);
    const x = 12 + idx * (barWidth + gap);
    const barHeight = Math.round((value / maxValue) * (height - 42));
    const y = height - 24 - barHeight;
    ctx.fillStyle = "#1f6feb";
    ctx.fillRect(x, y, barWidth, barHeight);
    if (idx % Math.ceil(points.length / 8) === 0) {
      ctx.fillStyle = "#6b7280";
      ctx.font = "10px Segoe UI";
      ctx.fillText(String(p[labelKey] || ""), x, height - 8);
    }
  });
}

async function loadAnalytics() {
  if (!window.vocalflowAPI?.getAnalyticsOverview) return;
  const analytics = await window.vocalflowAPI.getAnalyticsOverview();
  if (analyticsTotalFiles) analyticsTotalFiles.textContent = analytics.total_files_processed ?? 0;
  if (analyticsAssignmentRate) analyticsAssignmentRate.textContent = `${analytics.assignment_rate ?? 0}%`;
  if (analyticsArchivedCount) analyticsArchivedCount.textContent = analytics.archived_count ?? 0;
  drawSimpleBarChart(dailyTrendChart, analytics.daily_trend || [], "count", "day");
  drawSimpleBarChart(weeklyTrendChart, analytics.weekly_trend || [], "count", "week");
}

function openAddTalentModal() {
  talentNameInput.value = "";
  addTalentModal.classList.add("active");

  setTimeout(() => {
    talentNameInput.focus();
  }, 50);
}

function closeAddTalentModal() {
  addTalentModal.classList.remove("active");
}

async function moveSelectedInboxItems(targetRelativeFolder) {
  const selected = getSelectedInboxItems();

  if (!selected.length) {
    showMessage("Select at least one file or folder first.");
    return;
  }

  const relativePaths = selected.map((item) => item.relative_path);

  const result = await window.vocalflowAPI.moveItems(
    relativePaths,
    targetRelativeFolder
  );

  if (!result?.ok) {
    showMessage(result?.error || "Move failed.");
    return;
  }

  selectedInboxItems.clear();

  const movedCount = result.moved?.length || relativePaths.length;
  (result.moved || []).forEach((move) => {
    const fileName = move.oldRelativePath?.split("/").pop() || move.oldRelativePath;
    addRecentActivity("sorted", `${fileName} has been assigned to ${move.newRelativePath}`);
  });

  if (targetRelativeFolder === "Archive") {
    alert(`${movedCount} item(s) moved to Archive.`);
  } else {
    const openNow = confirm(
      `${movedCount} item(s) moved to ${targetRelativeFolder}.\n\nOpen that folder now?`
    );

    if (openNow) {
      await window.vocalflowAPI.openItemInExplorer(targetRelativeFolder);
    }
  }

  await refreshAll();
  await loadProjectDirectory("Projects");
}

async function deleteSelectedInboxItems() {
  const selected = getSelectedInboxItems();

  if (!selected.length) {
    showMessage("Select at least one file or folder first.");
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete ${selected.length} item(s)? This action cannot be undone.`);

  if (!confirmed) return;

  // FIX: Split selected items into "on disk" vs "ghost" (already moved/missing).
  // Ghost files cannot be moved to Archive/Deleted because they no longer exist
  // on disk — fs:move-items would throw. Call deleteItems for those instead,
  // which now gracefully purges just the DB row.
  const onDisk = selected.filter(item => !item.is_missing && !item.is_deleted);
  const ghosts = selected.filter(item => item.is_missing || item.is_deleted);

  const onDiskPaths = onDisk.map(item => item.relative_path);
  const ghostPaths  = ghosts.map(item => item.relative_path);

  let deletedCount = 0;
  let anyError = null;

  if (onDiskPaths.length) {
    const result = await window.vocalflowAPI.moveItems(onDiskPaths, "Archive/Deleted");
    if (!result?.ok) {
      anyError = result?.error || "Move to deleted failed.";
    } else {
      deletedCount += result.moved?.length || onDiskPaths.length;
    }
  }

  if (ghostPaths.length) {
    const result = await window.vocalflowAPI.deleteItems(ghostPaths);
    if (!result?.ok) {
      anyError = anyError || result?.error || "Ghost purge failed.";
    } else {
      deletedCount += result.deleted?.length || ghostPaths.length;
    }
  }

  if (anyError) {
    showMessage(anyError);
  }

  selectedInboxItems.clear();

  if (deletedCount) {
    alert(`${deletedCount} item(s) removed from inbox.`);
  }

  await refreshAll();
  await loadProjectDirectory("Projects");
}

//move button

inboxMoveBtn?.addEventListener("click", async () => {
  const result = await window.vocalflowAPI.selectTargetFolder();

  if (!result?.ok) {
    if (!result?.canceled) {
      showMessage(result?.error || "Failed to select folder.");
    }
    return;
  }

  await moveSelectedInboxItems(result.relativePath);
});

//archive
inboxArchiveBtn?.addEventListener("click", async () => {
  await moveSelectedInboxItems("Archive");
});

//delete
inboxDeleteBtn?.addEventListener("click", async () => {
  await deleteSelectedInboxItems();
});

//unarchive
archiveUnarchiveBtn?.addEventListener("click", async () => {
  if (selectedArchiveItems.size === 0) {
    alert("Please select items to unarchive.");
    return;
  }

  const itemsToUnarchive = Array.from(selectedArchiveItems);
  const confirmed = confirm(`Unarchive ${itemsToUnarchive.length} item(s)? This will move them back to Intake.`);
  if (!confirmed) return;

  try {
    const result = await window.vocalflowAPI.moveItems(
      itemsToUnarchive,
      "" // Intake is the root
    );

    if (result?.ok) {
      alert(`Successfully unarchived ${itemsToUnarchive.length} item(s).`);
      selectedArchiveItems.clear();
      updateArchiveActionState();
      await refreshAll();
    } else {
      alert(`Failed to unarchive items: ${result?.error}`);
    }
  } catch (error) {
    console.error("Unarchive error:", error);
    alert("An error occurred while unarchiving items.");
  }
});

archiveDeleteBtn?.addEventListener("click", async () => {
  if (selectedArchiveItems.size === 0) {
    alert("Please select archived items to delete.");
    return;
  }
  const itemsToDelete = Array.from(selectedArchiveItems);
  const confirmed = confirm(`Delete ${itemsToDelete.length} archived item(s) permanently?`);
  if (!confirmed) return;
  const result = await window.vocalflowAPI.moveItems(itemsToDelete, "Archive/Deleted");
  if (!result?.ok) {
    alert(result?.error || "Delete failed.");
    return;
  }
  selectedArchiveItems.clear();
  updateArchiveActionState();
  await refreshAll();
});

// Theme functions
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateLogos(theme);
}

function updateLogos(theme) {
  const logos = document.querySelectorAll('.login-logo, .brand-logo');
  const logoSrc = theme === 'dark' ? './assets/logo_nightmode.png' : './assets/creativoices-logo.png';
  logos.forEach(logo => logo.src = logoSrc);
}

function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
  themeToggle.checked = savedTheme === 'dark';
}

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    showApp();
    loadTheme();
    console.log("About to refreshAll");
    await refreshAll();
    console.log("refreshAll done");
    addLog(eventLog, "User session started.");
    addLog(analyticsFeed, "Dashboard initialized.");
  } catch (error) {
    console.error("Login/init error:", error);
    console.error("Error stack:", error.stack);
    alert("Dashboard failed to initialize. Check the console.");
  }
});

logoutBtn?.addEventListener("click", () => {
  showLogin();
});

themeToggle?.addEventListener("change", () => {
  const theme = themeToggle.checked ? 'dark' : 'light';
  setTheme(theme);
});

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    switchSection(item.dataset.section);
  });
});

viewArchiveBtn?.addEventListener("click", () => {
  switchSection("archive");
});

assignFilesBtn?.addEventListener("click", () => {
  switchSection("inbox");
  currentInboxFilter = "unassigned";
  inboxTabs?.querySelectorAll(".inbox-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === "unassigned");
  });
  applyInboxFilters();
});

inboxToggleSelectAllBtn?.addEventListener("click", () => {
  const visible = getAllInboxItems().filter((item) => {
    const status = getInboxStatus(item);
    if (status.className === "archived" || status.className === "danger") return false;
    if (currentInboxFilter === "files" && item.is_directory) return false;
    if (currentInboxFilter === "folders" && !item.is_directory) return false;
    if (currentInboxFilter === "unassigned" && item.project_code) return false;
    const query = (inboxSearch?.value || "").toLowerCase().trim();
    if (!query) return true;
    const values = item.is_directory
      ? [item.name, item.relative_path, item.file_path]
      : [item.file_name, item.relative_path, item.file_path, item.asset_type];
    return values.filter(Boolean).some((v) => String(v).toLowerCase().includes(query));
  });
  const allSelected = visible.length > 0 && visible.every((item) => selectedInboxItems.has(item.relative_path));
  if (allSelected) {
    visible.forEach((item) => selectedInboxItems.delete(item.relative_path));
  } else {
    visible.forEach((item) => selectedInboxItems.add(item.relative_path));
  }
  inboxToggleSelectAllBtn.textContent = allSelected ? "Select All" : "Unselect All";
  applyInboxFilters();
});

archiveToggleSelectAllBtn?.addEventListener("click", () => {
  const archivedRows = Array.from(document.querySelectorAll("#archivedTableBody tr[data-path]"));
  const paths = archivedRows.map((row) => row.dataset.path).filter(Boolean);
  const allSelected = paths.length > 0 && paths.every((p) => selectedArchiveItems.has(p));
  if (allSelected) {
    paths.forEach((p) => selectedArchiveItems.delete(p));
  } else {
    paths.forEach((p) => selectedArchiveItems.add(p));
  }
  archiveToggleSelectAllBtn.textContent = allSelected ? "Select All" : "Unselect All";
  updateArchiveActionState();
  applyInboxFilters();
});

viewDeletedBtn?.addEventListener("click", () => {
  deletedFilesModal?.classList.add("active");
});
deletedFilesModalCloseBtn?.addEventListener("click", () => deletedFilesModal?.classList.remove("active"));
deletedFilesModalDoneBtn?.addEventListener("click", () => deletedFilesModal?.classList.remove("active"));
deletedFilesModal?.addEventListener("click", (e) => {
  if (e.target === deletedFilesModal) deletedFilesModal.classList.remove("active");
});

rescanBtn?.addEventListener("click", async () => {
  addLog(eventLog, "Manual rescan triggered.");
  addLog(analyticsFeed, "Manual intake rescan requested.");

  try {
    await window.vocalflowAPI?.rescanIntake?.();
    await refreshAll();
  } catch (error) {
    console.error("Rescan error:", error);
  }
});

prevMonthBtn?.addEventListener("click", () => {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
  renderCalendar(calendarDate);
});

nextMonthBtn?.addEventListener("click", () => {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
  renderCalendar(calendarDate);
});

todoComposer?.addEventListener("click", () => {
  openTaskModal();
});

modalSaveBtn?.addEventListener("click", () => {
  const title = modalTaskTitle?.value.trim() || "";
  const notes = modalTaskNotes?.value.trim() || "";

  if (!title) return;

  const todos = getTodosForDate(selectedDate);
  todos.push({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text: title,
    notes,
    completed: false
  });

  setTodosForDate(selectedDate, todos);
  renderTodoList();
  renderCalendar(calendarDate);
  closeTaskModal();
});

modalCloseBtn?.addEventListener("click", closeTaskModal);
modalCancelBtn?.addEventListener("click", closeTaskModal);
notesModalCloseBtn?.addEventListener("click", closeNotesModal);
notesModalDoneBtn?.addEventListener("click", closeNotesModal);

taskModal?.addEventListener("click", (e) => {
  if (e.target === taskModal) closeTaskModal();
});

taskNotesModal?.addEventListener("click", (e) => {
  if (e.target === taskNotesModal) closeNotesModal();
});

renameModalCloseBtn?.addEventListener("click", closeRenameModal);
renameModalCancelBtn?.addEventListener("click", closeRenameModal);
renameModalSaveBtn?.addEventListener("click", () => {
  const newName = renameInput?.value.trim();
  if (!newName) return;

  if (renameModal.callback) {
    renameModal.callback(newName);
  }
  closeRenameModal();
});

renameModal?.addEventListener("click", (e) => {
  if (e.target === renameModal) closeRenameModal();
});

moveModalCloseBtn?.addEventListener("click", closeMoveModal);
moveModalCancelBtn?.addEventListener("click", closeMoveModal);
moveModalSaveBtn?.addEventListener("click", () => {
  const target = moveInput?.value.trim();
  if (!target) return;

  if (moveModal.callback) {
    moveModal.callback(target);
  }
  closeMoveModal();
});

moveModal?.addEventListener("click", (e) => {
  if (e.target === moveModal) closeMoveModal();
});

addFolderModalCloseBtn?.addEventListener("click", closeAddFolderModal);
addFolderModalCancelBtn?.addEventListener("click", closeAddFolderModal);
addFolderModalSaveBtn?.addEventListener("click", () => {
  const folderName = addFolderInput?.value.trim();
  if (!folderName) return;

  if (addFolderModal.callback) {
    addFolderModal.callback(folderName);
  }
  closeAddFolderModal();
});

addFolderModal?.addEventListener("click", (e) => {
  if (e.target === addFolderModal) closeAddFolderModal();
});

// Load theme on startup
loadTheme();

modalTaskTitle?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    modalSaveBtn?.click();
  }
});

todoList?.addEventListener("click", (e) => {
  const todoItem = e.target.closest(".todo-item");
  if (!todoItem) return;

  const todoId = todoItem.dataset.id;
  if (!todoId) return;

  const todos = getTodosForDate(selectedDate);
  const todo = todos.find((item) => item.id === todoId);
  if (!todo) return;

  if (e.target.matches(".todo-delete")) {
    deleteTodoForSelectedDate(todoId);
    return;
  }

  if (e.target.matches(".todo-view-notes")) {
    openNotesModal(todo);
  }
});

todoList?.addEventListener("change", (e) => {
  const todoItem = e.target.closest(".todo-item");
  if (!todoItem) return;

  const todoId = todoItem.dataset.id;
  if (!todoId) return;

  if (e.target.matches(".todo-checkbox")) {
    toggleTodoForSelectedDate(todoId);
  }
});

inboxOpenBtn?.addEventListener("click", async () => {
  const selected = getSelectedInboxItems();
  if (!selected.length) return;

  const relativePaths = selected.map((item) => item.relative_path);
  const result = await window.vocalflowAPI.openItemsInExplorer(relativePaths);

  if (!result?.ok) {
    showMessage(result?.error || "Open failed.");
  }
});

inboxRenameBtn?.addEventListener("click", async () => {
  const selected = getSelectedInboxItems();

  if (selected.length !== 1) {
    showMessage("Please select exactly one item to rename.");
    return;
  }

  const item = selected[0];

  const currentName =
    item.is_directory
      ? item.name || item.relative_path.split("/").pop()
      : item.file_name || item.relative_path.split("/").pop();

  openRenameModal(currentName, async (newName) => {
    const relativePath = item.relative_path;

    const result = await window.vocalflowAPI.renameItem(relativePath, newName.trim());

    if (!result?.ok) {
      showMessage(result?.error || "Rename failed.");
      return;
    }

    selectedInboxItems.clear();

    alert(`Renamed "${currentName}" to "${newName.trim()}".`);

    await refreshAll();
    await loadProjectDirectory("Projects");
  });
});

[inboxItemsTableBody].forEach((tableBody) => {
  tableBody?.addEventListener("click", (e) => {
    const row = e.target.closest("tr[data-path]");
    if (!row) return;

    if (!e.target.matches(".asset-select")) {
      const path = row.dataset.path;
      const isSelected = selectedInboxItems.has(path);

      handleInboxSelection(path, !isSelected);
    }
  });

  tableBody?.addEventListener("change", (e) => {
    const row = e.target.closest("tr[data-path]");
    if (!row) return;

    if (e.target.matches(".asset-select")) {
      handleInboxSelection(row.dataset.path, e.target.checked);
    }
  });
});

[archivedTableBody].forEach((tableBody) => {
  tableBody?.addEventListener("click", (e) => {
    const row = e.target.closest("tr[data-path]");
    if (!row) return;

    if (!e.target.matches(".archive-select")) {
      const path = row.dataset.path;
      const isSelected = selectedArchiveItems.has(path);

      handleArchiveSelection(path, !isSelected);
    }
  });

  tableBody?.addEventListener("change", (e) => {
    const row = e.target.closest("tr[data-path]");
    if (!row) return;

    if (e.target.matches(".archive-select")) {
      handleArchiveSelection(row.dataset.path, e.target.checked);
    }
  });
});

projectsFolderGrid?.addEventListener("click", async (e) => {
  const card = e.target.closest(".folder-card");
  if (!card) return;

  const relativePath = card.dataset.path;
  const isDirectory = card.dataset.dir === "1";
  const action = e.target.dataset.action;

  if (!action) {
    if (isDirectory) {
      await loadProjectDirectory(relativePath);
    }
    return;
  }

  if (action === "open") {
    if (isDirectory) {
      await loadProjectDirectory(relativePath);
    } else {
      await window.vocalflowAPI.openItemInExplorer(relativePath);
    }
    return;
  }

  if (action === "rename") {
    const currentName = relativePath.split("/").pop();

    openRenameModal(currentName, async (newName) => {
      const result = await window.vocalflowAPI.renameItem(relativePath, newName);

      if (!result.ok) {
        showMessage(result.error || "Rename failed.");
        return;
      }

      await loadProjectDirectory(currentProjectPath);
    });
    return;
  }

  if (action === "delete") {
    const confirmed = confirm(`Delete "${relativePath}"?`);

    if (!confirmed) return;

    const result = await window.vocalflowAPI.deleteItem(relativePath);

    if (!result.ok) {
      showMessage(result.error || "Delete failed.");
      return;
    }

    await loadProjectDirectory(currentProjectPath);
  }
});

//add talent button

addTalentBtn?.addEventListener("click", () => {
  openAddTalentModal();
});

//save talent 
addTalentSaveBtn?.addEventListener("click", () => {
  const name = talentNameInput.value.trim();
  if (!name) return;

  talentStore.push({
    id: Date.now(),
    name
  });

  saveTalents();
  renderTalents();
  closeAddTalentModal();
});

//close modal events
addTalentModalCloseBtn?.addEventListener("click", closeAddTalentModal);
addTalentCancelBtn?.addEventListener("click", closeAddTalentModal);

addTalentModal?.addEventListener("click", (e) => {
  if (e.target === addTalentModal) closeAddTalentModal();
});

//create folder
projectsBackBtn?.addEventListener("click", async () => {
  await navigateBack();
});

addFolderBtn?.addEventListener("click", async () => {
  openAddFolderModal(async (folderName) => {
    const result = await window.vocalflowAPI.createFolder(
      currentProjectPath,
      folderName
    );

    if (!result.ok) {
      showMessage(result.error || "Failed to create folder.");
      return;
    }

    await loadProjectDirectory(currentProjectPath);
  });
});


window.vocalflowAPI?.onDatabaseUpdated?.(async (payload) => {
  addLog(eventLog, `Database updated for ${payload.filePath}`);
  addLog(analyticsFeed, `Watcher sync updated ${payload.filePath}`);
  await refreshAll();
});

//import files
importFilesBtn?.addEventListener("click", async () => {
  const result = await window.vocalflowAPI.importFiles();

  if (!result?.ok) {
    if (!result?.canceled) {
      alert(result?.error || "Import files failed.");
    }
    return;
  }

  const outcomes = result.outcomes || [];
  const errors   = result.errors   || [];

  // Log each file's sort outcome to Recent Activity immediately.
  outcomes.forEach(o => {
    addRecentActivity(o.activity.label, o.activity.message);
  });
  errors.forEach(e => {
    addRecentActivity("error", `"${e.file}" skipped — ${e.error}`);
  });

  // Build a summary for the user.
  const sorted   = outcomes.filter(o => o.recognized).length;
  const inbox    = outcomes.filter(o => !o.recognized).length;
  const errCount = errors.length;

  let msg = `${outcomes.length} file(s) imported.`;
  if (sorted)   msg += `\n• ${sorted} sorted to project folder(s).`;
  if (inbox)    msg += `\n• ${inbox} placed in inbox for review.`;
  if (errCount) msg += `\n• ${errCount} skipped (already exist).`;
  alert(msg);

  await refreshAll();
});

//import folder
importFolderBtn?.addEventListener("click", async () => {
  const result = await window.vocalflowAPI.importFolder();

  if (!result?.ok) {
    if (!result?.canceled) {
      alert(result?.error || "Import folder failed.");
    }
    return;
  }

  const outcomes = result.outcomes || [];

  // Log each file's sort outcome to Recent Activity.
  outcomes.forEach(o => {
    addRecentActivity(o.activity.label, o.activity.message);
  });

  if (!outcomes.length) {
    addRecentActivity("inbox", `Folder imported — no files to sort`);
  }

  const sorted = outcomes.filter(o => o.recognized).length;
  const inbox  = outcomes.filter(o => !o.recognized).length;

  let msg = `Folder imported (${outcomes.length} file(s)).`;
  if (sorted) msg += `\n• ${sorted} sorted to project folder(s).`;
  if (inbox)  msg += `\n• ${inbox} placed in inbox for review.`;
  alert(msg);

  await refreshAll();
});

window.vocalflowAPI?.onZipExtracted?.(async (payload) => {
  addLog(eventLog, `ZIP extracted: ${payload.zipPath}`);
  addLog(analyticsFeed, `ZIP unpacked to ${payload.extractedTo}`);
  await refreshAll();
});

window.vocalflowAPI?.onFilesystemChanged?.(async (payload) => {
  const type = payload?.type || "update";

  // For import events, outcomes are already logged by the button handler above.
  // For watcher-driven events (sorter moved a file autonomously), log them here.
  if (type === "file-added") {
    addRecentActivity("sorted", `${payload.relativePath || "A file"} has been automatically moved and indexed.`);
  } else if (type === "file-removed") {
    addRecentActivity("removed", `File removed: ${payload.relativePath || ""}`);
  } else if (type === "file-changed") {
    addRecentActivity("sorted", `File updated: ${payload.relativePath || ""}`);
  } else if (type === "directory-added") {
    addRecentActivity("sorted", `Folder created: ${payload.relativePath || ""}`);
  } else if (type === "items-moved") {
    const moves = payload.moved || [];
    moves.forEach(m => {
      addRecentActivity("sorted", `${m.oldRelativePath} has been automatically moved to ${m.newRelativePath}`);
    });
  } else if (type === "items-deleted" || type === "item-deleted") {
    const items = payload.deleted || (payload.relativePath ? [payload.relativePath] : []);
    items.forEach(p => addRecentActivity("removed", `Deleted: ${p}`));
  } else {
    addLog(analyticsFeed, `Filesystem changed: ${type}`);
  }

  await refreshAll();
  await loadProjectDirectory(currentProjectPath || "Projects");
});

bindSearch();
renderCalendar(calendarDate);
renderTodoList();
updateInboxActionState();
showLogin();
renderTalents();