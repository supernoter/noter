const { contextBridge, ipcRenderer } = require("electron");

const fs = require("fs");
const path = require("path");
const os = require("os");

contextBridge.exposeInMainWorld("api", {
  getNotes: () => ipcRenderer.invoke("get-notes"),
  readNote: (filename) => ipcRenderer.invoke("read-note", filename),
});
