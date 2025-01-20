const { contextBridge } = require('electron')
const customizationHandler = require('./CustomizationHandler')

contextBridge.exposeInMainWorld('api', {
    hey: 'greetings from preload.js', // just a dummy string
    OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
    NOTER_OLLAMA_MODEL: process.env.NOTER_OLLAMA_MODEL || 'gemma',
})

customizationHandler.applyCustomizationsToEditor()
