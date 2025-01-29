const path = require("path");
const configurationInterface = require("./ConfigurationInterface");

// todo: document methods

class CustomizationHandler {

    constructor() {
        const {window, font, background} = configurationInterface.getConfigurationData();
        [
            this.window,
            this.font,
            this.background
        ] =  [
            window,
            font,
            background
        ];
    }

    applyCustomizationsToDOM() {
        window.addEventListener("DOMContentLoaded", () => {
            const content = document.getElementById('content');

            content.style.color = this.font["colour"];
            content.style.fontSize = this.font["size"];
            content.style.fontFamily = this.font["family"];

            // todo: handle image and gradient (define a priority order)
            // should be part of configuration module?
            content.style.backgroundColor = this.background["colour"];
            content.style.opacity = this.background["opacity"];
        });
    }

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