const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");

const navItems = document.querySelectorAll(".nav-item[data-section]");
const pageSections = document.querySelectorAll(".page-section");

const assetsTableBody = document.getElementById("assetsTableBody");
const projectsTableBody = document.getElementById("projectsTableBody");
const archiveTableBody = document.getElementById("archiveTableBody");
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

const inboxSelectionLabel = document.getElementById("inboxSelectionLabel");
const inboxOpenBtn = document.getElementById("inboxOpenBtn");
const inboxRenameBtn = document.getElementById("inboxRenameBtn");
const inboxMoveBtn = document.getElementById("inboxMoveBtn");
const inboxArchiveBtn = document.getElementById("inboxArchiveBtn");
const inboxDeleteBtn = document.getElementById("inboxDeleteBtn");

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

const importFilesBtn = document.getElementById("importFilesBtn");
const importFolderBtn = document.getElementById("importFolderBtn");

let calendarDate = new Date();
let selectedDate = new Date();
let currentProjectPath = "Projects";
let currentInboxFilter = "all";
let selectedInboxAssetPath = null;

const TODO_STORAGE_KEY = "vocalflow_todos_v1";
let todoStore = loadTodos();

let cachedAssets = [];
let cachedProjects = [];

const demoProjectFolders = [
  "Media Links",
  "Gachiclub",
  "CCJL",
  "Kajiu No. 8",
  "Solo Leveling"
];

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

function getSelectedInboxAsset() {
  return cachedAssets.find((asset) => asset.file_path === selectedInboxAssetPath) || null;
}

function updateInboxActionState() {
  const selected = getSelectedInboxAsset();
  if (inboxSelectionLabel) {
    inboxSelectionLabel.textContent = selected
      ? `Selected: ${selected.file_name}`
      : "No file selected";
  }

  const disabled = !selected;
  [inboxOpenBtn, inboxRenameBtn, inboxMoveBtn, inboxArchiveBtn, inboxDeleteBtn].forEach((btn) => {
    if (btn) btn.disabled = disabled;
  });
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

  actionList.innerHTML = urgentAssets.map((asset) => `
    <div class="action-row">
      <div class="action-main">
        <strong>${escapeHtml(asset.file_name)}</strong>
        <span>${escapeHtml(asset.project_code || "Unassigned Project")}</span>
      </div>
      <div class="action-tags">
        <span class="mini-tag ${asset.is_missing ? "danger" : "primary"}">
          ${asset.is_missing ? "Needs Review" : "Active"}
        </span>
      </div>
    </div>
  `).join("");
}

function renderAssets(assets) {
  if (!assetsTableBody || !archiveTableBody) return;

  if (!assets.length) {
    assetsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table">No files found.</td>
      </tr>
    `;
  } else {
    assetsTableBody.innerHTML = assets.map((asset) => `
      <tr class="${asset.file_path === selectedInboxAssetPath ? "selected-row" : ""}" data-path="${escapeHtml(asset.file_path)}">
        <td>
          <input
            class="asset-select"
            type="radio"
            name="selectedInboxAsset"
            ${asset.file_path === selectedInboxAssetPath ? "checked" : ""}
          />
        </td>
        <td>${escapeHtml(asset.file_name)}</td>
        <td>${escapeHtml(asset.project_code || "-")}</td>
        <td>${escapeHtml(asset.episode_number || "-")}</td>
        <td>${formatDate(asset.updated_at)}</td>
        <td>
          <span class="status-chip ${asset.is_missing ? "danger" : "success"}">
            ${asset.is_missing ? "Missing" : "Active"}
          </span>
        </td>
        <td class="path-muted">${escapeHtml(asset.relative_path || asset.file_path)}</td>
      </tr>
    `).join("");
  }

  const archived = assets.filter((asset) => asset.is_missing);
  archiveTableBody.innerHTML = archived.length
    ? archived.map((asset) => `
      <tr>
        <td>${escapeHtml(asset.file_name)}</td>
        <td>${escapeHtml(asset.project_code || "-")}</td>
        <td>${formatDate(asset.updated_at)}</td>
        <td><span class="status-chip danger">Archived / Missing</span></td>
      </tr>
    `).join("")
    : `
      <tr>
        <td colspan="4" class="empty-table">No archived or missing files.</td>
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

  const paths = await window.vocalflowAPI.getPaths();
  pathsContainer.innerHTML = `
    <div class="path-item"><span>App Root</span><code>${escapeHtml(paths.appRoot)}</code></div>
    <div class="path-item"><span>Intake</span><code>${escapeHtml(paths.intakeDir)}</code></div>
    <div class="path-item"><span>Projects</span><code>${escapeHtml(paths.projectsDir)}</code></div>
    <div class="path-item"><span>Archive</span><code>${escapeHtml(paths.archiveDir)}</code></div>
    <div class="path-item"><span>Extracted</span><code>${escapeHtml(paths.extractedDir)}</code></div>
  `;
}

async function loadStats() {
  if (!window.vocalflowAPI?.getDashboardStats) return;

  const stats = await window.vocalflowAPI.getDashboardStats();
  const totalAssets = document.getElementById("statTotalAssets");
  const missingAssets = document.getElementById("statMissingAssets");

  if (totalAssets) totalAssets.textContent = stats.total_assets ?? 0;
  if (missingAssets) missingAssets.textContent = stats.missing_assets ?? 0;
}

async function loadData() {
  if (!window.vocalflowAPI?.listAssets || !window.vocalflowAPI?.listProjects) return;

  cachedAssets = await window.vocalflowAPI.listAssets();
  cachedProjects = await window.vocalflowAPI.listProjects();

  const stillExists = cachedAssets.some((asset) => asset.file_path === selectedInboxAssetPath);
  if (!stillExists) {
    selectedInboxAssetPath = null;
  }

  applyInboxFilters();
  renderProjects(cachedProjects);
  renderActionList(cachedAssets);
}

async function refreshAll() {
  await Promise.all([loadStats(), loadData(), loadPaths()]);
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
  let filtered = [...cachedAssets];

  if (query) {
    filtered = filtered.filter((asset) =>
      [
        asset.file_name,
        asset.project_code,
        asset.episode_number,
        asset.file_path,
        asset.asset_type
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query))
    );
  }

  if (currentInboxFilter === "active") {
    filtered = filtered.filter((asset) => !asset.is_missing);
  } else if (currentInboxFilter === "missing") {
    filtered = filtered.filter((asset) => asset.is_missing);
  } else if (currentInboxFilter === "audio") {
    filtered = filtered.filter((asset) => asset.asset_type === "audio");
  } else if (currentInboxFilter === "document") {
    filtered = filtered.filter((asset) => asset.asset_type === "document");
  }

  const selectedStillVisible = filtered.some((asset) => asset.file_path === selectedInboxAssetPath);
  if (!selectedStillVisible) {
    selectedInboxAssetPath = null;
  }

  renderAssets(filtered);
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

async function moveSelectedInboxAsset(targetRelativeFolder) {
  const selected = getSelectedInboxAsset();
  if (!selected) {
    showMessage("Select a file first.");
    return;
  }

  const sourceRelativePath = getRelativePathFromAbsolute(selected.file_path);
  if (!sourceRelativePath) {
    showMessage("Unable to resolve source file path.");
    return;
  }

  const result = await window.vocalflowAPI.moveItem(sourceRelativePath, targetRelativeFolder);
  if (!result.ok) {
    showMessage(result.error || "Move failed.");
    return;
  }

  addLog(eventLog, `Moved ${selected.file_name} to ${targetRelativeFolder}`);
  await refreshAll();
}

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    showApp();
    await refreshAll();
    addLog(eventLog, "User session started.");
    addLog(analyticsFeed, "Dashboard initialized.");
  } catch (error) {
    console.error("Login/init error:", error);
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

assetsTableBody?.addEventListener("click", (e) => {
  const row = e.target.closest("tr[data-path]");
  if (!row) return;

  selectedInboxAssetPath = row.dataset.path;
  applyInboxFilters();
});

assetsTableBody?.addEventListener("change", (e) => {
  const row = e.target.closest("tr[data-path]");
  if (!row) return;

  if (e.target.matches(".asset-select")) {
    selectedInboxAssetPath = row.dataset.path;
    applyInboxFilters();
  }
});

inboxOpenBtn?.addEventListener("click", async () => {
  const selected = getSelectedInboxAsset();
  if (!selected) return;

  const relativePath = getRelativePathFromAbsolute(selected.file_path);
  if (!relativePath) {
    showMessage("Unable to resolve file path.");
    return;
  }

  await window.vocalflowAPI.openItemInExplorer(relativePath);
});

inboxRenameBtn?.addEventListener("click", async () => {
  const selected = getSelectedInboxAsset();
  if (!selected) return;

  const relativePath = getRelativePathFromAbsolute(selected.file_path);
  if (!relativePath) {
    showMessage("Unable to resolve file path.");
    return;
  }

  const currentName = selected.file_name;
  const newName = window.prompt("Enter a new name:", currentName);
  if (!newName) return;

  const result = await window.vocalflowAPI.renameItem(relativePath, newName);
  if (!result.ok) {
    showMessage(result.error || "Rename failed.");
    return;
  }

  await refreshAll();
});

inboxMoveBtn?.addEventListener("click", async () => {
  const target = window.prompt("Move selected file to which project folder?\nExample: Projects/MyClient");
  if (!target) return;
  await moveSelectedInboxAsset(target);
});

inboxArchiveBtn?.addEventListener("click", async () => {
  await moveSelectedInboxAsset("Archive");
});

inboxDeleteBtn?.addEventListener("click", async () => {
  const selected = getSelectedInboxAsset();
  if (!selected) return;

  const confirmed = window.confirm(`Delete "${selected.file_name}"? This cannot be undone.`);
  if (!confirmed) return;

  const relativePath = getRelativePathFromAbsolute(selected.file_path);
  if (!relativePath) {
    showMessage("Unable to resolve file path.");
    return;
  }

  const result = await window.vocalflowAPI.deleteItem(relativePath);
  if (!result.ok) {
    showMessage(result.error || "Delete failed.");
    return;
  }

  selectedInboxAssetPath = null;
  await refreshAll();
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
    const currentName = relativePath.split(/[/\\]/).pop();
    const newName = window.prompt("Enter a new name:", currentName);
    if (!newName) return;

    const result = await window.vocalflowAPI.renameItem(relativePath, newName);
    if (!result.ok) {
      showMessage(result.error || "Rename failed.");
      return;
    }

    await loadProjectDirectory(currentProjectPath);
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm(`Delete "${relativePath}"? This cannot be undone.`);
    if (!confirmed) return;

    const result = await window.vocalflowAPI.deleteItem(relativePath);
    if (!result.ok) {
      showMessage(result.error || "Delete failed.");
      return;
    }

    await loadProjectDirectory(currentProjectPath);
  }
});

projectBreadcrumbs?.addEventListener("click", async (e) => {
  const btn = e.target.closest(".crumb-btn");
  if (!btn) return;

  const relativePath = btn.dataset.path || "";
  await loadProjectDirectory(relativePath);
});

addFolderBtn?.addEventListener("click", async () => {
  const folderName = window.prompt("New folder name:");
  if (!folderName) return;

  const result = await window.vocalflowAPI.createFolder(currentProjectPath, folderName);
  if (!result.ok) {
    showMessage(result.error || "Failed to create folder.");
    return;
  }

  await loadProjectDirectory(currentProjectPath);
});

window.vocalflowAPI?.onDatabaseUpdated?.(async (payload) => {
  addLog(eventLog, `Database updated for ${payload.filePath}`);
  addLog(analyticsFeed, `Watcher sync updated ${payload.filePath}`);
  await refreshAll();
});

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

importFolderBtn?.addEventListener("click", async () => {
  const result = await window.vocalflowAPI.importFolder();

  if (!result?.ok) {
    if (!result?.canceled) {
      alert(result?.error || "Import folder failed.");
    }
    return;
  }

  alert("Folder imported successfully.");
  await refreshAll();
});

window.vocalflowAPI?.onZipExtracted?.(async (payload) => {
  addLog(eventLog, `ZIP extracted: ${payload.zipPath}`);
  addLog(analyticsFeed, `ZIP unpacked to ${payload.extractedTo}`);
  await refreshAll();
});

bindSearch();
renderCalendar(calendarDate);
renderTodoList();
updateInboxActionState();
showLogin();