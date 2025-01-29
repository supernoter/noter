const {BrowserWindow} = require('electron');
const customizationHandler = require("./CustomizationHandler");

class WindowHandler {
    createWindow() {
        const mainWindow = new BrowserWindow(
            customizationHandler.getWindowOptions()
        );
        return mainWindow;
    }
}

module.exports = new WindowHandler();