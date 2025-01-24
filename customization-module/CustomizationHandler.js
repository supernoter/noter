const path = require("path");

// todo: document methods
// todo: integrate with the configuration interface

class CustomizationHandler {

    applyCustomizationsToDOM() {
        window.addEventListener("DOMContentLoaded", () => {
            const mainTitle = document.getElementById('main-title');

            mainTitle.style.color = 'blue';
            mainTitle.style.fontSize = '30px';
            mainTitle.style.fontFamily = 'Arial';
        });
    }

    getWindowOptions() {
        return {
            width: 1000, 
            height: 500,
            transparent: true,
            opacity: 0.8,
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, "preload.js")
            }
        };
    }

}

module.exports = new CustomizationHandler();