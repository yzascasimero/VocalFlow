const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("vocalflowAPI", {
  // Dashboard
  getPaths: () => ipcRenderer.invoke("app:get-paths"),
  getDashboardStats: () => ipcRenderer.invoke("dashboard:get-stats"),
  getAnalyticsOverview: () => ipcRenderer.invoke("analytics:get-overview"),
  listAssets: () => ipcRenderer.invoke("assets:list"),
  listIntakeAssets: () => ipcRenderer.invoke("assets:list-intake"),
  listProjects: () => ipcRenderer.invoke("projects:list"),
  getProjectsFolderSummary: () => ipcRenderer.invoke("projects:folder-summary"),

  // Intake
  rescanIntake: () => ipcRenderer.invoke("intake:rescan"),
  listIntakeFolders: () => ipcRenderer.invoke("intake:list-folders"),
  
  // File system
  listDirectory: (relativePath = "") =>
    ipcRenderer.invoke("fs:list-directory", { relativePath }),

  createFolder: (parentRelativePath, folderName) =>
    ipcRenderer.invoke("fs:create-folder", { parentRelativePath, folderName }),

  renameItem: (relativePath, newName) =>
    ipcRenderer.invoke("fs:rename-item", { relativePath, newName }),

  moveItem: (sourceRelativePath, targetParentRelativePath) =>
    ipcRenderer.invoke("fs:move-item", {
      sourceRelativePath,
      targetParentRelativePath
    }),

  deleteItem: (relativePath) =>
    ipcRenderer.invoke("fs:delete-item", { relativePath }),

  openItemInExplorer: (relativePath) =>
    ipcRenderer.invoke("fs:open-item", { relativePath }),

  moveItems: (items, targetParentRelativePath) =>
  ipcRenderer.invoke("fs:move-items", { items, targetParentRelativePath }),

  deleteItems: (items) =>
  ipcRenderer.invoke("fs:delete-items", { items }),

  openItemsInExplorer: (items) =>
  ipcRenderer.invoke("fs:open-items", { items }),

  importFiles: () =>
    ipcRenderer.invoke("fs:import-files"),

  importFolder: () =>
    ipcRenderer.invoke("fs:import-folder"),

  selectTargetFolder: () =>
    ipcRenderer.invoke("fs:select-target-folder"),

  // Events
  onDatabaseUpdated: (callback) => {
    ipcRenderer.on("db:updated", (_event, payload) => callback(payload));
  },

  onZipExtracted: (callback) => {
    ipcRenderer.on("intake:zip-extracted", (_event, payload) => callback(payload));
  },

  onFilesystemChanged: (callback) => {
    ipcRenderer.on("fs:changed", (_event, payload) => callback(payload));
  }
});