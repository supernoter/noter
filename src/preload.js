const { contextBridge, ipcRenderer } = require('electron')
const path = require('path')

// CustomizationHandler for renderer process
class CustomizationHandler {
    constructor() {
        // Load the configuration via IPC
        this.window = { opacity: 1, width: 900, height: 550 }
        this.font = { colour: 'blue', size: '25px', family: 'Arial' }
        this.background = {
            colour: 'white',
            gradient: null,
            image: null,
            opacity: '100%',
        }
        this.statusBar = {
            font: { colour: 'black', size: '15px', family: 'Arial' },
            background: { colour: 'white' },
        }
        this.preview = {
            font: { colour: 'black', size: '20px', family: 'Arial' },
            background: { colour: 'blue' },
        }
        this.ollama_host = 'http://localhost:11434'
        this.ollama_model_name = 'gemma'
        this.loadConfig()
    }

    async loadConfig() {
        try {
            const config = await ipcRenderer.invoke('get-config')
            if (config) {
                this.window = config.window || this.window
                this.font = config.font || this.font
                this.background = config.background || this.background
                this.statusBar = config['status-bar'] || this.statusBar
                this.preview = config.preview || this.preview
                this.ollama_host = config.ollama_host || this.ollama_host
                this.ollama_model_name =
                    config.ollama_model_name || this.ollama_model_name
            }
        } catch (error) {
            console.error('error loading config in preload:', error)
        }
    }

    // Get the current configuration
    getConfig() {
        return {
            window: this.window,
            font: this.font,
            background: this.background,
            statusBar: this.statusBar,
            preview: this.preview,
            ollama_host: this.ollama_host,
            ollama_model_name: this.ollama_model_name,
        }
    }

    applyCustomizationsToEditor() {
        window.addEventListener('NoterEditorElementsLoaded', () => {
            const content = document.querySelector('#note-textarea') // editor
            if (!content) {
                console.error('editor element (#note-textarea) not found')
                return
            }
            // Apply font styles
            content.style.color = this.font['colour']
            content.style.fontSize = this.font['size']
            content.style.fontFamily = this.font['family']
            // Apply background
            if (this.background['image']) {
                // If there's a background image, use it
                console.log(
                    'setting background image:',
                    this.background['image']
                )
                content.style.backgroundImage = `url('${this.background['image']}')`
                content.style.backgroundSize = 'cover'
                content.style.backgroundPosition = 'center'
                content.style.backgroundRepeat = 'no-repeat'
            } else if (this.background['gradient']) {
                // If there's a gradient, use it
                content.style.backgroundImage = this.background['gradient']
                content.style.backgroundSize = 'cover'
            } else {
                // Otherwise just use the background color
                content.style.backgroundImage = 'none'
                content.style.backgroundColor = this.background['colour']
            }
            // Apply opacity
            content.style.opacity = this.background['opacity']
            // Status bar styling
            const statusBar = document.querySelector('.status-bar')
            if (statusBar) {
                statusBar.style.backgroundColor =
                    this.statusBar['background']['colour']
                statusBar.style.color = this.statusBar['font']['colour']
                statusBar.style.fontSize = this.statusBar['font']['size']
                statusBar.style.fontFamily = this.statusBar['font']['family']
            } else {
                console.error('status bar element (.status-bar) not found')
            }
            // Preview styling
            const preview = document.querySelector('#preview')
            if (preview) {
                preview.style.backgroundColor =
                    this.preview['background']['colour']
                preview.style.color = this.preview['font']['colour']
                preview.style.fontSize = this.preview['font']['size']
                preview.style.fontFamily = this.preview['font']['family']
            } else {
                console.error('preview element (#preview) not found')
            }
            console.log('applied customizations to editor')
        })
    }
}

// Create an instance of our renderer-compatible CustomizationHandler
const customizationHandler = new CustomizationHandler()

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

    getConfig: () => customizationHandler.getConfig(),
    updateConfig: (newConfig) => ipcRenderer.invoke('update-config', newConfig),
    reloadConfig: async () => {
        await customizationHandler.loadConfig()
        return customizationHandler.getConfig()
    },
    // Subscribe to configuration updates
    onConfigUpdate: (callback) => {
        ipcRenderer.on('config-updated', (_, updatedConfig) => {
            Object.assign(customizationHandler, {
                window: updatedConfig.window || customizationHandler.window,
                font: updatedConfig.font || customizationHandler.font,
                background:
                    updatedConfig.background || customizationHandler.background,
                statusBar:
                    updatedConfig['status-bar'] ||
                    customizationHandler.statusBar,
                preview: updatedConfig.preview || customizationHandler.preview,
                ollama_host: updatedConfig.ollama_host || customizationHandler.ollama_host,
                ollama_model_name: updatedConfig.ollama_model_name || customizationHandler.ollama_model_name
            })
            callback(updatedConfig)
        })
    },
})

ipcRenderer.on('change-theme', (event, themeName) => {
    // document.body.className = themeName;
    console.log(`You chose ${themeName}'s theme! Great choice!`)
})

// Apply customizations to the editor
customizationHandler.applyCustomizationsToEditor()
