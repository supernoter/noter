const { app, BrowserWindow } = require("electron/main");
const windowHandler = require("./WindowHandler");

// Many of Electron's core modules are Node.js event emitters that adhere to
// Node's asynchronous event-driven architecture. The app module is one of
// these emitters.

app.whenReady().then(() => {
  let window = windowHandler.createWindow();
  window.loadFile("./index.html");
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      window = windowHandler.createWindow();
      window.loadFile("./index.html");
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "Darwin") {
    app.quit();
  }
});
