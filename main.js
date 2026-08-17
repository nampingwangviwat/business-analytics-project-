/**
 * main.js — Electron main process.
 *
 * Owns the window and the file system. No business logic, no UI code.
 * The renderer reaches this file only through the four channels below,
 * which preload.js exposes as window.api.
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow = null;

/**
 * Where scenarios live.
 * In development that's ./data/scenarios.json next to the source, so it is
 * easy to inspect. In a packaged app the install folder is read-only on
 * Windows and macOS, so we write to the per-user app-data folder instead.
 */
function dataFile() {
  const dir = app.isPackaged ? app.getPath('userData') : path.join(__dirname, 'data');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'scenarios.json');
}

function readAll() {
  const file = dataFile();
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // A corrupt file should not take the app down — start clean and say so.
    console.error('scenarios.json could not be read:', err.message);
    return [];
  }
}

function writeAll(scenarios) {
  fs.writeFileSync(dataFile(), JSON.stringify(scenarios, null, 2), 'utf-8');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 680,
    backgroundColor: '#f5f7fb',
    title: 'OIKOS — Dealership Profit Analyzer',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

/* ── IPC ──────────────────────────────────────────────────── */

ipcMain.handle('save-scenario', (_event, scenario) => {
  try {
    const scenarios = readAll();
    const existing = scenarios.findIndex((s) => s.id === scenario.id);
    if (existing > -1) scenarios[existing] = scenario;
    else scenarios.push(scenario);
    writeAll(scenarios);
    return { ok: true, scenario };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('load-scenarios', () => readAll());

ipcMain.handle('delete-scenario', (_event, id) => {
  try {
    writeAll(readAll().filter((s) => s.id !== id));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Registered now so the channel exists; the UI button stays disabled
// until the export build (spec §6).
ipcMain.handle('export-pdf', async () => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'break-even-report.pdf',
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });
    if (canceled || !filePath) return { ok: false, canceled: true };

    const pdf = await mainWindow.webContents.printToPDF({ printBackground: true, landscape: true });
    fs.writeFileSync(filePath, pdf);
    return { ok: true, filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

/* ── Lifecycle ────────────────────────────────────────────── */

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
