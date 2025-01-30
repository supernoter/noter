const { app, BrowserWindow } = require("electron");
const menuitem = require("./customizations/menuItem.js");
// const menuitem = new menuItem();

let window;

const createWindow = () => {
  window = new BrowserWindow({
    width: 800,
    height: 600,
  });
  menuitem.createMenu(window);
  window.loadFile("index.html");
};

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
