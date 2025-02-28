const { app, BrowserWindow, ipcMain } = require('electron/main')
const process = require('process')
const fs = require('fs')
const path = require('path')
const menu = require('./menu')
const createWindowHandler = require('./WindowHandler')
const createConfigurationInterface = require('./ConfigurationInterface')

// Parse command line arguments
const argv = process.argv.slice(1) // Remove the first element (path to electron executable)
// showIntro is a boolean flag; if set, no intro text animation is shown
const showIntro = !argv.includes('--no-intro')

// Reference to main window
let mainWindow
// Reference to window handler
let windowHandler
// Reference to configuration interface
let configInterface

// Create path for all the user notes
const notesDir = path.join(app.getPath('documents'), 'noter')

// Content for the first note.
const WELCOME_NOTE_TEXT = `# Welcome to NOTER!
Noter is a simple, yet powerful markdown editor that we hope you will enjoy using.
Find out more at [supernoter.xyz](https://supernoter.xyz) and on GitHub at
[supernoter/noter](https://github.com/supernoter/noter).
`

// Set up IPC handlers
function setupIpcHandlers() {
    // Respond to request to get all notes in the default directory.
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
    // Respond to renderer request to read a single note from a file.
    ipcMain.handle('read-note', async (event, filename) => {
        const filePath = path.join(notesDir, filename)
        if (fs.existsSync(filePath)) {
            // Emit event to set editor filepath.
            mainWindow.webContents.send('set-editor-filepath', filePath)
            return fs.readFileSync(filePath, 'utf8') // Return note content
        }
        return ''
    })
    // Respond to renderer request whether to show the intro sequence.
    ipcMain.handle('should-show-intro', () => {
        return showIntro
    })
    //
    // Respond to renderer request to get configuration data.
    ipcMain.handle('get-config', () => {
        return configInterface.getConfigurationData()
    })
}

// createInitialWindow creates a window, set the menu and loads our application
// HTML. If started with DEBUG=1 environment variable, show developer tools
// directly on startup.
function createInitialWindow() {
    mainWindow = windowHandler.createWindow()
    menu.createMenu(mainWindow)
    mainWindow.loadFile('./index.html')
    if (process.env.DEBUG) {
        mainWindow.webContents.openDevTools()
    }
}

// Initialize the application
app.whenReady().then(() => {
    // Initialize configuration interface with app object
    configInterface = createConfigurationInterface(app)

    // Initialize window handler with app object
    windowHandler = createWindowHandler(app)

    // Set up IPC handlers
    setupIpcHandlers()

    // Create the main window
    createInitialWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createInitialWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
