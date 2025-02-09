const { BrowserWindow } = require('electron')
const customizationHandler = require('./CustomizationHandler')

// wrapper class for creating a window with the proper configurations
// set by the user
class WindowHandler {
    createWindow() {
        const mainWindow = new BrowserWindow(
            customizationHandler.getWindowOptions()
        )
        return mainWindow
    }
}

module.exports = new WindowHandler()
