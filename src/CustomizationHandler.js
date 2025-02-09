const path = require('path')
const { screen } = require('electron/main')
const configurationInterface = require('./ConfigurationInterface')

// todo: document methods

class CustomizationHandler {
    constructor() {
        const { window, font, background, statusbar, preview } =
            configurationInterface.getConfigurationData()

        this.window = window
        this.font = font
        this.background = background
        this.statusBar = statusbar
        this.preview = preview
    }

    // apply customizations to the editor
    applyCustomizationsToEditor() {
        window.addEventListener('DOMContentLoaded', () => {
            const content = document.querySelector('#note-textarea') // editor
            content.style.color = this.font['colour']
            content.style.fontSize = this.font['size']
            content.style.fontFamily = this.font['family']
            content.style.backgroundColor = this.background['colour']
            content.style.opacity = this.background['opacity']

            const statusBar = document.querySelector('.status-bar') // status bar
            statusBar.style.backgroundColor =
                this.statusBar['background']['colour']
            statusBar.style.color = this.statusBar['font']['colour']
            statusBar.style.fontSize = this.statusBar['font']['size']
            statusBar.style.fontFamily = this.statusBar['font']['family']

            const preview = document.querySelector('#preview') // preview mode
            preview.style.backgroundColor = this.preview['background']['colour']
            preview.style.color = this.preview['font']['colour']
            preview.style.fontSize = this.preview['font']['size']
            preview.style.fontFamily = this.preview['font']['family']
        })
    }

    // generates a window object with configurations set by the user
    getWindowOptions() {
        return {
            width: this.window['width'],
            height: this.window['height'],
            transparent: this.window['opacity'] < 1,
            opacity: this.window['opacity'],
            webPreferences: {
                // TODO: check if we need all these options
                nodeIntegration: true,
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                enableRemoteModule: false,
                sandbox: false,
            },
        }
    }
}

module.exports = new CustomizationHandler()
