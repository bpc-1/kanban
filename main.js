const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const fs = require('fs').promises;
const path = require('path');

// ── Window ────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Kanban Board',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadFile(path.join(__dirname, 'kanban.html'));

  // Hide default menu bar (app has its own UI)
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── File dialogs ──────────────────────────────────────────────────
ipcMain.handle('dialog:save', async (_event, defaultName) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: defaultName || 'my-board.kanban',
    filters: [{ name: 'Kanban Board', extensions: ['kanban'] }],
    properties: ['createDirectory', 'showOverwriteConfirmation'],
  });
  return canceled ? null : filePath;
});

ipcMain.handle('dialog:open', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog({
    filters: [{ name: 'Kanban Board', extensions: ['kanban'] }],
    properties: ['openFile'],
  });
  return (canceled || !filePaths.length) ? null : filePaths[0];
});

// ── File I/O ──────────────────────────────────────────────────────
ipcMain.handle('fs:write', async (_event, filePath, bytes) => {
  await fs.writeFile(filePath, Buffer.from(bytes));
  return true;
});

ipcMain.handle('fs:read', async (_event, filePath) => {
  const buf = await fs.readFile(filePath);
  return Array.from(buf);
});
