const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('botwDesktop', {
  discoverSlots: (rootDirectory) => ipcRenderer.invoke('save:discover', rootDirectory),
  getRecentRoots: () => ipcRenderer.invoke('save:recent-roots'),
  useRoot: (rootDirectory) => ipcRenderer.invoke('save:use-root', rootDirectory),
  forgetRoot: (rootDirectory) => ipcRenderer.invoke('save:forget-root', rootDirectory),
  chooseRoot: () => ipcRenderer.invoke('save:choose-root'),
  chooseFile: () => ipcRenderer.invoke('save:choose-file'),
  readSave: (filePath) => ipcRenderer.invoke('save:read', filePath),
  writeSave: (filePath, data) => ipcRenderer.invoke('save:write', { filePath, data }),
  listBackups: (filePath) => ipcRenderer.invoke('save:list-backups', filePath),
  restoreBackup: (filePath, backupPath) => ipcRenderer.invoke('save:restore-backup', { filePath, backupPath }),
  showInFolder: (filePath) => ipcRenderer.invoke('save:show-in-folder', filePath),
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
  close: () => ipcRenderer.send('window:close')
})
