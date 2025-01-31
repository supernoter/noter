const { app, BrowserWindow, ipcMain } = require("electron/main");
const fs = require("fs");
const path = require("path");

// app, which controls your application's event lifecycle.
// BrowserWindow, which creates and manages app windows.
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false,
    },
  });
  win.loadFile("index.html");
};


// const notesDir = path.join(app.getPath("userData"), "notes");
const notesDir = path.join("/Users", "gioriz", "Desktop", "noter", "src", "user-notes");

ipcMain.handle("get-notes", async () => {
  if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir);
  }
  return fs.readdirSync(notesDir); // Returns filenames
  
});

ipcMain.handle("read-note", async (event, filename) => {
  const filePath = path.join(notesDir, filename);
  if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf8"); // Return note content
  }
  return "";
});


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
