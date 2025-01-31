const { app, BrowserWindow, ipcMain } = require('electron/main')
const windowHandler = require('./WindowHandler')
const process = require('process')
const fs = require('fs')
const path = require('path')

const notesDir = path.join(
    '/Users',
    'gioriz',
    'Desktop',
    'noter',
    'src',
    'user-notes'
)

ipcMain.handle('get-notes', async () => {
    if (!fs.existsSync(notesDir)) {
        fs.mkdirSync(notesDir)
    }
    return fs.readdirSync(notesDir) // Returns filenames
})

ipcMain.handle('read-note', async (event, filename) => {
    const filePath = path.join(notesDir, filename)
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8') // Return note content
    }
    return ''
})

// Create path for all the user notes
const notesDir = path.join(app.getPath("userData"), "user-notes");

ipcMain.handle("get-notes", async () => {
  if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });

    // Create an example markdown file
    const defaultNotePath1 = path.join(notesDir, "First note.md");
    const defaultNotePath2 = path.join(notesDir, "Second note.md");
    const exampleNote1 = "Hello, this is your first note!";
    const exampleNote2 = "This is your second note!";

    fs.writeFileSync(defaultNotePath1, exampleNote1, "utf-8");
    fs.writeFileSync(defaultNotePath2, exampleNote2, "utf-8");
  }
  return fs.readdirSync(notesDir);
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
    let window = windowHandler.createWindow()
    window.loadFile('./index.html')
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            window = windowHandler.createWindow()
            window.loadFile('./index.html')
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'Darwin') {
        app.quit()
    }
})

// You might have noticed the capitalization difference between the app and
// BrowserWindow modules. Electron follows typical JavaScript conventions here,
// where PascalCase modules are instantiable class constructors (e.g.
// BrowserWindow, Tray, Notification) whereas camelCase modules are not
// instantiable (e.g. app, ipcRenderer, webContents).
