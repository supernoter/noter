const { contextBridge, ipcRenderer } = require('electron')
const path = require('path')
const customizationHandler = require('./CustomizationHandler')

// storedFilePath keeps the absolute path of the last loaded or saved file. If
// this value is set, then CTRL-s will save the current contents to this file.
let storedFilePath = ''

contextBridge.exposeInMainWorld('api', {
    hey: 'greetings from preload.js', // just a dummy string
    OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
    NOTER_OLLAMA_MODEL: process.env.NOTER_OLLAMA_MODEL || 'gemma',
    getNotes: () => ipcRenderer.invoke('get-notes'),
    readNote: (filename) => ipcRenderer.invoke('read-note', filename),
    shouldShowIntro: () => ipcRenderer.invoke('should-show-intro'),
    // Testing access to textarea, TODO: test and improve
    getContent: () => document.querySelector('textarea').value,
    setContent: (value) => (document.querySelector('textarea').value = value),
    getEditorFilePath: () => {
        return storedFilePath
    },
    setEditorFilePath: (callback) => {
        // Listen for the event from main
        ipcRenderer.on('set-editor-filepath', (e, filePath) => {
            // Store the value in our preload scope
            storedFilePath = filePath
            // Then call the callback
            callback(filePath)
        })
    },
    updateFilePath: (filePath) => {
        storedFilePath = filePath
    },
    setEditorContent: (callback) => {
        ipcRenderer.on('set-editor-content', (e, v) => callback(v))
    },
    setEditorTitle: (callback) => {
        ipcRenderer.on('set-editor-title', (e, v) => callback(v))
    },
    toggleSidebar: (callback) => {
        ipcRenderer.on('toggle-sidebar', (e) => callback())
    },
    basename: (filePath, ext) => path.basename(filePath, ext),
})

ipcRenderer.on('change-theme', (event, themeName) => {
    // document.body.className = themeName;

    console.log(`You chose ${themeName}'s theme! Great choice!`)
})

customizationHandler.applyCustomizationsToEditor()
