const { contextBridge, ipcRenderer } = require("electron");
const customizationHandler = require("./CustomizationHandler");

contextBridge.exposeInMainWorld("api", {
  hey: "greetings from preload.js", // just a dummy string
});

customizationHandler.applyCustomizationsToEditor();
