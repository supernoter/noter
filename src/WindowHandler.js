const path = require('path')
const { BrowserWindow, screen } = require('electron/main')
const createCustomizationHandler = require('./CustomizationHandler')

/**
 * Create a WindowHandler with the specified app object
 * @param {Object} app - The Electron app object
 * @returns {WindowHandler} - An instance of WindowHandler
 */
function createWindowHandler(app) {
    // Create customization handler
    const customizationHandler = createCustomizationHandler(app)

    class WindowHandler {
        createWindow() {
            const windowOptions = customizationHandler.getWindowOptions()
            return new BrowserWindow(windowOptions)
        }
    }

    return new WindowHandler()
}

module.exports = createWindowHandler
