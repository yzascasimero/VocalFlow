const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("vocalflowAPI", {
  // Dashboard
  getPaths: () => ipcRenderer.invoke("app:get-paths"),
  getDashboardStats: () => ipcRenderer.invoke("dashboard:get-stats"),
  listAssets: () => ipcRenderer.invoke("assets:list"),
  listProjects: () => ipcRenderer.invoke("projects:list"),

  // Intake
  rescanIntake: () => ipcRenderer.invoke("intake:rescan"),

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

  importFiles: () =>
    ipcRenderer.invoke("fs:import-files"),

  importFolder: () =>
    ipcRenderer.invoke("fs:import-folder"),

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