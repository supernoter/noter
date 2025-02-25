const { app, BrowserWindow, ipcMain } = require('electron/main')
const windowHandler = require('./WindowHandler')
const menu = require('./menu')
const process = require('process')
const fs = require('fs')
const path = require('path')

// Parse command line arguments
const argv = process.argv.slice(1) // Remove the first element (path to electron executable)
const showIntro = !argv.includes('--no-intro')

// Create path for all the user notes
const notesDir = path.join(app.getPath('documents'), 'noter')

const WELCOME_NOTE_TEXT = `# Welcome to NOTER!

Noter is a simple, yet powerful markdown editor that we hope you will enjoy using.

Find out more at [supernoter.xyz](https://supernoter.xyz) and on GitHub at
[supernoter/noter](https://github.com/supernoter/noter).
`

let mainWindow // reference to main window

ipcMain.handle('get-notes', async () => {
    if (!fs.existsSync(notesDir)) {
        fs.mkdirSync(notesDir, { recursive: true })
        // create a welcome note
        const welcomeNote = path.join(notesDir, 'Welcome.md')
        fs.writeFileSync(welcomeNote, WELCOME_NOTE_TEXT, 'utf-8')
    }
    const files = fs
        .readdirSync(notesDir)
        .map((filename) => ({
            name: filename,
            path: path.join(notesDir, filename),
            mtime: fs.statSync(path.join(notesDir, filename)).mtime,
        }))
        .sort((a, b) => b.mtime - a.mtime)
        .map((file) => file.name)
    return files
})

ipcMain.handle('read-note', async (event, filename) => {
    const filePath = path.join(notesDir, filename)
    if (fs.existsSync(filePath)) {
        mainWindow.webContents.send('set-editor-filepath', filePath)
        return fs.readFileSync(filePath, 'utf8') // Return note content
    }
    return ''
})

// Add a new IPC handler to check if intro should be shown
ipcMain.handle('should-show-intro', () => {
    return showIntro
})

// createInitialWindow creates a window, set the menu and loads our application
// HTML.
createInitialWindow = () => {
    mainWindow = windowHandler.createWindow()
    menu.createMenu(mainWindow)
    mainWindow.loadFile('./index.html')
    // Check if DEBUG environment variable is set
    if (process.env.DEBUG) {
        mainWindow.webContents.openDevTools()
    }
}

// Many of Electron's core modules are Node.js event emitters that adhere to
// Node's asynchronous event-driven architecture. The app module is one of
// these emitters.

app.whenReady().then(() => {
    createInitialWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createInitialWindow()
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
