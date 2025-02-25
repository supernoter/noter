const { contextBridge, ipcRenderer } = require('electron')
const customizationHandler = require('./CustomizationHandler')

contextBridge.exposeInMainWorld('api', {
    hey: 'greetings from preload.js', // just a dummy string
    OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
    NOTER_OLLAMA_MODEL: process.env.NOTER_OLLAMA_MODEL || 'gemma',
    getNotes: () => ipcRenderer.invoke('get-notes'),
    readNote: (filename) => ipcRenderer.invoke('read-note', filename),
    // Testing access to textarea, TODO: test and improve
    getContent: () => document.querySelector('textarea').value,
    setContent: (value) => (document.querySelector('textarea').value = value),

    setEditorContent: (callback) => {
        ipcRenderer.on('set-editor-content', (e, v) => callback(v))
    },
    setEditorTitle: (callback) => {
        ipcRenderer.on('set-editor-title', (e, v) => callback(v))
    },
    toggleSidebar: (callback) => {
        ipcRenderer.on('toggle-sidebar', (e) => callback())
    },
})

ipcRenderer.on('change-theme', (event, themeName) => {
    // document.body.className = themeName;

    console.log(`You chose ${themeName}'s theme! Great choice!`);
});

customizationHandler.applyCustomizationsToEditor()
