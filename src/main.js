const { app, BrowserWindow } = require("electron/main");
const fs = require("fs");
const path = require("path");

let window;

const createWindow = () => {
  window = new BrowserWindow({
    width: 800,
    height: 600,
  });
  menuitem.createMenu(window);
  window.loadFile("index.html");
};

// Many of Electron's core modules are Node.js event emitters that adhere to
// Node's asynchronous event-driven architecture. The app module is one of
// these emitters.

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "Darwin") {
    app.quit();
  }
});

// You might have noticed the capitalization difference between the app and
// BrowserWindow modules. Electron follows typical JavaScript conventions here,
// where PascalCase modules are instantiable class constructors (e.g.
// BrowserWindow, Tray, Notification) whereas camelCase modules are not
// instantiable (e.g. app, ipcRenderer, webContents).
