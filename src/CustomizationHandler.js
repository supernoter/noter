const path = require('path')
const { screen } = require('electron/main')
const createConfigurationInterface = require('./ConfigurationInterface')

/**
 * Create a CustomizationHandler with the specified app object
 * @param {Object} app - The Electron app object
 * @returns {CustomizationHandler} - An instance of CustomizationHandler
 */
function createCustomizationHandler(app) {
    // Create the configuration interface with the app object
    const configurationInterface = createConfigurationInterface(app)

    class CustomizationHandler {
        constructor() {
            const {
                window,
                font,
                background,
                'status-bar': statusbar,
                preview,
            } = configurationInterface.getConfigurationData()
            this.window = window
            this.font = font
            this.background = background
            this.statusBar = statusbar
            this.preview = preview
        }

        // apply customizations to the editor
        applyCustomizationsToEditor() {
            window.addEventListener('NoterEditorElementsLoaded', () => {
                const content = document.querySelector('#note-textarea') // editor
                console.log('content ' + content)

                // Apply font styles
                content.style.color = this.font['colour']
                content.style.fontSize = this.font['size']
                content.style.fontFamily = this.font['family']

                // Apply background
                if (this.background['image']) {
                    // If there's a background image, use it
                    console.log(
                        'Setting background image:',
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
                const statusBar = document.querySelector('.status-bar') // status bar
                statusBar.style.backgroundColor =
                    this.statusBar['background']['colour']
                statusBar.style.color = this.statusBar['font']['colour']
                statusBar.style.fontSize = this.statusBar['font']['size']
                statusBar.style.fontFamily = this.statusBar['font']['family']

                // Preview styling
                const preview = document.querySelector('#preview') // preview mode
                preview.style.backgroundColor =
                    this.preview['background']['colour']
                preview.style.color = this.preview['font']['colour']
                preview.style.fontSize = this.preview['font']['size']
                preview.style.fontFamily = this.preview['font']['family']

                console.log('applied customizations to editor')
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

    return new CustomizationHandler()
}

module.exports = createCustomizationHandler
