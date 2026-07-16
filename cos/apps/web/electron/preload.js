const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getPlatform: () => ipcRenderer.invoke("get-platform"),
  getPaths: () => ipcRenderer.invoke("get-paths"),
  selectFile: (filters) => ipcRenderer.invoke("select-file", filters),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  showSaveDialog: (options) => ipcRenderer.invoke("show-save-dialog", options),
  onMenuAction: (callback) => ipcRenderer.on("menu-action", (_, action) => callback(action)),
})
