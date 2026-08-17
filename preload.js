/**
 * preload.js — the only bridge between the renderer and the main process.
 *
 * Keep this file small on purpose: everything exposed here is reachable by
 * page code, so it is the security boundary of the app. Four methods, each
 * a thin wrapper over one IPC channel. No fs, no path, no ipcRenderer itself.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  saveScenario: (data) => ipcRenderer.invoke('save-scenario', data),
  loadScenarios: () => ipcRenderer.invoke('load-scenarios'),
  deleteScenario: (id) => ipcRenderer.invoke('delete-scenario', id),
  exportPDF: () => ipcRenderer.invoke('export-pdf')
});
