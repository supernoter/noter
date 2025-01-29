const {app} = require('electron');
const windowHandler = require("./WindowHandler");

let window;

app.on("ready", () => {
    window = windowHandler.createWindow();  
    window.loadFile("./index.html");
});
