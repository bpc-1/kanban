const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, minimal API to the renderer (kanban.html).
// contextIsolation + sandbox means the renderer cannot access Node.js directly.
contextBridge.exposeInMainWorld('electronAPI', {
  saveDialog : (defaultName)       => ipcRenderer.invoke('dialog:save', defaultName),
  openDialog : ()                  => ipcRenderer.invoke('dialog:open'),
  writeFile  : (filePath, bytes)   => ipcRenderer.invoke('fs:write',  filePath, bytes),
  readFile   : (filePath)          => ipcRenderer.invoke('fs:read',   filePath),
});
