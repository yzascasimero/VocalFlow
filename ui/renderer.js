const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");

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
const projectBreadcrumbs = document.getElementById("projectBreadcrumbs");
const rescanBtn = document.getElementById("rescanBtn");
const addFolderBtn = document.getElementById("addFolderBtn");

const inboxSearch = document.getElementById("inboxSearch");
const inboxSearchBtn = document.getElementById("inboxSearchBtn");
const inboxFilterBtn = document.getElementById("inboxFilterBtn");
const inboxFilterMenu = document.getElementById("inboxFilterMenu");
const inboxFilterOptions = document.querySelectorAll(".filter-option");
const projectsSearch = document.getElementById("projectsSearch");

const viewArchiveBtn = document.getElementById("viewArchiveBtn");

let selectedArchiveItems = new Set();

const archiveSelectionLabel = document.getElementById("archiveSelectionLabel");
const archiveUnarchiveBtn = document.getElementById("archiveUnarchiveBtn");
const archiveActionBar = document.querySelector(".archive-action-bar");
const inboxSelectionLabel = document.getElementById("inboxSelectionLabel");
const inboxOpenBtn = document.getElementById("inboxOpenBtn");
const inboxRenameBtn = document.getElementById("inboxRenameBtn");
const inboxMoveBtn = document.getElementById("inboxMoveBtn");
const inboxArchiveBtn = document.getElementById("inboxArchiveBtn");
const inboxDeleteBtn = document.getElementById("inboxDeleteBtn");

const inboxActionBar = document.querySelector(".inbox-action-bar");

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
let calendarDate = new Date();
let selectedDate = new Date();
let currentProjectPath = "Projects";
let currentInboxFilter = "active";

let selectedInboxItems = new Set();
let cachedInboxFolders = [];

const TODO_STORAGE_KEY = "vocalflow_todos_v1";
let todoStore = loadTodos();

let cachedAssets = [];
let cachedProjects = [];

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

function renderActionList(assets) {
  if (!actionList) return;

  const urgentAssets = assets.slice(0, 5);
  if (!urgentAssets.length) {
    actionList.innerHTML = `<div class="empty-mini">No files currently need review.</div>`;
    return;
  }

  actionList.innerHTML = urgentAssets.map((asset) => {
    const status = getInboxStatus(asset);
    return `
    <div class="action-row">
      <div class="action-main">
        <strong>${escapeHtml(asset.file_name)}</strong>
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
  if (item.is_deleted === true) {
    return { label: "Deleted", className: "danger" };
  }

  if (item.is_missing === true) {
    return { label: "Missing", className: "danger" };
  }

  // Check if the file is in the Archive folder by looking at the file_path
  const filePathLower = (item.file_path || "").toLowerCase();
  const isArchived = filePathLower.includes("\\archive\\") || filePathLower.includes("/archive/") || filePathLower.endsWith("\\archive") || filePathLower.endsWith("/archive");

  if (isArchived) {
    return { label: "Archived", className: "archived" };
  }

  const isAssigned = item.project_code ? true : false;
  if (isAssigned) {
    return { label: "Assigned", className: "info" };
  }
  return { label: "Unassigned", className: "success" };
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

  // Separate active (unassigned) and assigned items
  const activeItems = allItems.filter(item => !item.project_code);
  const assignedItems = allItems.filter(item => item.project_code);

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
  const showActive = currentInboxFilter === "all" || currentInboxFilter === "active" || currentInboxFilter === "files" || currentInboxFilter === "folders" || currentInboxFilter === "missing";
  const showAssigned = currentInboxFilter === "all" || currentInboxFilter === "assigned";

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
    return status.className === "archived";
  });

  const deleted = (cachedAssets || []).filter((asset) => {
    const status = getInboxStatus(asset);
    return status.className === "danger" && status.label === "Deleted";
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
        <td>${formatDate(asset.updated_at)}</td>
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
      <tr class="${selectedArchiveItems.has(asset.relative_path) ? "selected-row" : ""}" data-path="${escapeHtml(asset.relative_path)}">
        <td>
          <input
            class="archive-select"
            type="checkbox"
            ${selectedArchiveItems.has(asset.relative_path) ? "checked" : ""}
          />
        </td>
        <td>${escapeHtml(asset.file_name)}</td>
        <td>${formatDate(asset.updated_at)}</td>
        <td><span class="status-chip ${status.className}">${status.label}</span></td>
      </tr>
    `;
      }).join("")
    : `
      <tr>
        <td colspan="4" class="empty-table">No deleted files.</td>
      </tr>
    `;

  updateInboxActionState();
}

function renderBreadcrumbs(relativePath) {
  if (!projectBreadcrumbs) return;

  const cleaned = relativePath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const parts = cleaned ? cleaned.split("/") : [];
  let built = "";

  const crumbs = [`<button class="crumb-btn" data-path="">Home</button>`];

  for (const part of parts) {
    built = built ? `${built}/${part}` : part;
    crumbs.push(`<span class="crumb-sep">›</span>`);
    crumbs.push(`<button class="crumb-btn" data-path="${escapeHtml(built)}">${escapeHtml(part)}</button>`);
  }

  projectBreadcrumbs.innerHTML = crumbs.join("");
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

async function loadProjectDirectory(relativePath = "Projects") {
  const result = await window.vocalflowAPI.listDirectory(relativePath);

  if (!result.ok) {
    showMessage(result.error || "Failed to load folder.");
    return;
  }

  currentProjectPath = result.currentPath || "";
  renderBreadcrumbs(currentProjectPath);
  renderDirectoryItems(result.items);
}

function renderProjects(projects) {
  if (!projectsTableBody) return;

  if (!projects.length) {
    projectsTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-table">No projects detected yet.</td>
      </tr>
    `;
  } else {
    projectsTableBody.innerHTML = projects.map((project) => `
      <tr>
        <td>${escapeHtml(project.project_code)}</td>
        <td>${escapeHtml(project.project_name || "-")}</td>
        <td>${escapeHtml(project.status)}</td>
        <td>${escapeHtml(project.asset_count)}</td>
        <td>${formatDate(project.updated_at)}</td>
      </tr>
    `).join("");
  }

  loadProjectDirectory(currentProjectPath).catch((error) => {
    console.error("Directory load error:", error);
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
    console.log("Calling getDashboardStats");
    const stats = await window.vocalflowAPI.getDashboardStats();
    console.log("Stats received:", stats);
    const totalAssets = document.getElementById("statTotalAssets");
    const missingAssets = document.getElementById("statMissingAssets");

    // Count active unassigned intakes from cached data
    const activeUnassignedCount = ((cachedAssets || []).filter((asset) => {
      const status = getInboxStatus(asset);
      return status.className === "success" && !asset.project_code;
    }).length) + ((cachedInboxFolders || []).filter((folder) => {
      const status = getInboxStatus(folder);
      return status.className === "success" && !folder.project_code;
    }).length);

    if (totalAssets) totalAssets.textContent = activeUnassignedCount;
    if (missingAssets) missingAssets.textContent = stats.missing_assets ?? 0;
  } catch (error) {
    console.error("loadStats error:", error);
    throw error;
  }
}

async function loadData() {
  if (!window.vocalflowAPI?.listAssets || !window.vocalflowAPI?.listProjects) return;

  try {
    console.log("Calling listAssets");
    cachedAssets = await window.vocalflowAPI.listAssets();
    console.log("Assets received:", cachedAssets?.length);
    console.log("Calling listProjects");
    cachedProjects = await window.vocalflowAPI.listProjects();
    console.log("Projects received:", cachedProjects?.length);
    console.log("Calling listIntakeFolders");
    cachedInboxFolders = await window.vocalflowAPI.listIntakeFolders();
    console.log("Folders received:", cachedInboxFolders?.length);

    applyInboxFilters();
    renderProjects(cachedProjects);
    renderActionList(cachedAssets);
    updateInboxBadge();
  } catch (error) {
    console.error("loadData error:", error);
    throw error;
  }
}

function updateInboxBadge() {
  if (!inboxBadge) return;

  // Count active intakes: unassigned files that are not missing + not archived + unassigned folders
  const activeFiles = (cachedAssets || []).filter((item) => {
    const status = getInboxStatus(item);
    return status.className === "success" && !item.project_code;
  }).length;

  const activeFolders = (cachedInboxFolders || []).filter((item) => {
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
  } else if (currentInboxFilter === "missing") {
    folders = [];
    files = files.filter((item) => item.is_missing === true && item.is_deleted !== true);
  }

  const visiblePaths = new Set([
    ...files.map((item) => item.relative_path),
    ...folders.map((item) => item.relative_path)
  ]);

  selectedInboxItems = new Set(
    [...selectedInboxItems].filter((path) => visiblePaths.has(path))
  );

  // Pass all items to renderInboxTables - it will separate active/assigned and apply filter display
  renderInboxTables(files, folders);
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

  inboxSearchBtn?.addEventListener("click", () => {
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

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".filter-dropdown-wrap")) {
      closeInboxFilterMenu();
    }
  });

  if (projectsSearch) {
    projectsSearch.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();

      const filtered = !q
        ? cachedProjects
        : cachedProjects.filter((project) =>
            [project.project_code, project.project_name, project.status]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(q))
          );

      renderProjects(filtered);
    });
  }
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

  const relativePaths = selected.map((item) => item.relative_path);

  // Move to Archive/Deleted instead of deleting
  const result = await window.vocalflowAPI.moveItems(relativePaths, "Archive/Deleted");

  if (!result?.ok) {
    showMessage(result?.error || "Delete failed.");
    return;
  }

  selectedInboxItems.clear();

  const deletedCount = result.moved?.length || relativePaths.length;

  alert(`${deletedCount} item(s) moved to deleted.`);

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
      await loadArchiveData();
    } else {
      alert(`Failed to unarchive items: ${result?.error}`);
    }
  } catch (error) {
    console.error("Unarchive error:", error);
    alert("An error occurred while unarchiving items.");
  }
});

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    showApp();
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

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    switchSection(item.dataset.section);
  });
});

viewArchiveBtn?.addEventListener("click", () => {
  switchSection("archive");
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

[archivedTableBody, deletedTableBody].forEach((tableBody) => {
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

//breadcrumbs
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

//create folder
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

  alert(`Imported ${result.files.length} file(s).`);

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

  alert(`Imported folder successfully.`);

  await refreshAll();
});

window.vocalflowAPI?.onZipExtracted?.(async (payload) => {
  addLog(eventLog, `ZIP extracted: ${payload.zipPath}`);
  addLog(analyticsFeed, `ZIP unpacked to ${payload.extractedTo}`);
  await refreshAll();
});

window.vocalflowAPI?.onFilesystemChanged?.(async (payload) => {
  addLog(analyticsFeed, `Filesystem changed: ${payload?.type || "update"}`);

  await refreshAll();
  await loadProjectDirectory(currentProjectPath || "Projects");
});

bindSearch();
renderCalendar(calendarDate);
renderTodoList();
updateInboxActionState();
showLogin();