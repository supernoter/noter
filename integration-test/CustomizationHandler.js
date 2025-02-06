const path = require("path");
const configurationInterface = require("./ConfigurationInterface");

// todo: document methods

class CustomizationHandler {

    constructor() {
        const {window, font, background} = configurationInterface.getConfigurationData();
        
        this.window = window;
        this.font = font;
        this.background = background;
    }

    // apply customizations to the editor 
    applyCustomizationsToEditor() {
        window.addEventListener("DOMContentLoaded", () => {
            const content = document.getElementById('content');

            content.style.color = this.font["colour"];
            content.style.fontSize = this.font["size"];
            content.style.fontFamily = this.font["family"];

            content.style.backgroundColor = this.background["colour"];
            content.style.opacity = this.background["opacity"];
        });
    }

    // generates a window object with configurations set by the user
    getWindowOptions() {
        return {
            width: this.window["width"], 
            height: this.window["height"],
            transparent: true,
            opacity: this.window["opacity"],
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, "preload.js")
            }
        };
    }

}

module.exports = new CustomizationHandler();