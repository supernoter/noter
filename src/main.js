const { app, BrowserWindow, ipcMain } = require('electron/main')
const windowHandler = require('./WindowHandler')
const menu = require('./menu')
const process = require('process')
const fs = require('fs')
const path = require('path')

// Create path for all the user notes
const notesDir = path.join(app.getPath('userData'), 'user-notes')

ipcMain.handle('get-notes', async () => {
    if (!fs.existsSync(notesDir)) {
        fs.mkdirSync(notesDir, { recursive: true })

        // Create an example markdown file
        const defaultNotePath1 = path.join(notesDir, 'First note.md')
        const defaultNotePath2 = path.join(notesDir, 'Second note.md')
        const exampleNote1 = 'Hello, this is your first note!'
        const exampleNote2 = 'This is your second note!'

        fs.writeFileSync(defaultNotePath1, exampleNote1, 'utf-8')
        fs.writeFileSync(defaultNotePath2, exampleNote2, 'utf-8')
    }
    return fs.readdirSync(notesDir)
})

ipcMain.handle('read-note', async (event, filename) => {
    const filePath = path.join(notesDir, filename)
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8') // Return note content
    }
    return ''
})

// createInitialWindow creates a window, set the menu and loads our application
// HTML.
createInitialWindow = () => {
    const window = windowHandler.createWindow()
    menu.createMenu(window)
    window.loadFile('./index.html')
    // Check if DEBUG environment variable is set
    if (process.env.DEBUG) {
        window.webContents.openDevTools()
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
