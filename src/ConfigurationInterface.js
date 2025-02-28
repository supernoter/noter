const fileSystem = require('fs')
const path = require('path')

/**
 * Creates a ConfigurationInterface with the specified Electron app
 * @param {Object} app - The Electron app object
 * @returns {ConfigurationInterface} - An instance of ConfigurationInterface
 */
function createConfigurationInterface(app) {
    class ConfigurationInterface {
        /**
         * PRIVATE FIELDS
         */
        #filePath = null
        #defaultConfiguration = {
            window: { opacity: 1, width: 900, height: 550 },
            font: { colour: 'blue', size: '25px', family: 'Arial' },
            background: {
                colour: 'white',
                gradient: null,
                image: null,
                opacity: '100%',
            },
            'status-bar': {
                font: { colour: 'black', size: '15px', family: 'Arial' },
                background: { colour: 'white' },
            },
            preview: {
                font: { colour: 'black', size: '20px', family: 'Arial' },
                background: { colour: 'blue' },
            },
            ollama_host: 'http://localhost:11434',
            ollama_model_name: 'gemma',
        }

        constructor() {
            // Set the configuration file path using app.getPath. This allows
            // us to use platform specific path, e.g. on Linux the default
            // location will be ~/.config/noter/config.json
            // https://www.electronjs.org/docs/latest/api/app#appgetpathname
            if (app) {
                this.#filePath = path.join(
                    app.getPath('userData'),
                    'config.json'
                )
            } else {
                // Fallback to local path if app is not provided
                this.#filePath = './config.json'
            }
        }

        /**
         * PUBLIC METHODS
         */
        // retrieves the configuration data object
        getConfigurationData() {
            this.#ensureConfigurationFileExistence()
            const configurationDataObject = this.#loadConfigurations()
            return configurationDataObject
        }

        /**
         * Saves the provided configuration data to the configuration file
         * @param {Object} configData - The configuration data to save
         * @returns {boolean} - True if the save was successful, false otherwise
         */
        saveConfigurationData(configData) {
            try {
                // Ensure the directory exists
                const dirPath = path.dirname(this.#filePath)
                if (!fileSystem.existsSync(dirPath)) {
                    fileSystem.mkdirSync(dirPath, { recursive: true })
                }

                // Validate the config data (optional but recommended)
                const validatedConfig = this.#validateConfigData(configData)

                // Write the configuration to file
                fileSystem.writeFileSync(
                    this.#filePath,
                    JSON.stringify(validatedConfig, null, 2)
                )

                return true
            } catch (error) {
                console.error('Error saving configuration file:', error)
                return false
            }
        }

        /**
         * PRIVATE METHODS
         */
        // opens a configuration file and returns its data
        #openConfigurationFile(filePath) {
            const fileData = fileSystem.readFileSync(
                filePath,
                'binary',
                (error, fileData) => {
                    if (error) {
                        console.error('error reading file: ', error)
                        return null
                    }
                    return fileData
                }
            )
            return fileData
        }

        // receives a JS object as a string and converts it to a JSON
        #parseFileData(fileData) {
            if (fileData == null || fileData.trim() === '') {
                console.error('empty config file')
                return this.#defaultConfiguration
            }
            try {
                return JSON.parse(fileData)
            } catch (error) {
                console.error('error parsing configuration file:', error)
                return this.#defaultConfiguration
            }
        }

        // opens the configuration file and returns its data as an object
        #loadConfigurations() {
            try {
                const fileData = this.#openConfigurationFile(this.#filePath)
                return this.#parseFileData(fileData)
            } catch (error) {
                console.error('error loading configurations:', error)
                return this.#defaultConfiguration
            }
        }

        // verifies if the configuration file exists in the specified path
        // if not, it'll be created there
        #ensureConfigurationFileExistence() {
            if (!fileSystem.existsSync(this.#filePath)) {
                try {
                    // Ensure the directory exists
                    const dirPath = path.dirname(this.#filePath)
                    if (!fileSystem.existsSync(dirPath)) {
                        fileSystem.mkdirSync(dirPath, { recursive: true })
                    }
                    // Write the default configuration
                    fileSystem.writeFileSync(
                        this.#filePath,
                        JSON.stringify(this.#defaultConfiguration, null, 2)
                    )
                } catch (error) {
                    console.error('error creating configuration file:', error)
                }
            }
        }

        /**
         * Validates and sanitizes configuration data
         * @param {Object} configData - The configuration data to validate
         * @returns {Object} - The validated configuration data
         */
        #validateConfigData(configData) {
            const currentConfig = this.getConfigurationData()
            const validatedConfig = JSON.parse(JSON.stringify(currentConfig))
            // Merge and update configuration values.
            if (configData) {
                Object.keys(configData).forEach((key) => {
                    if (validatedConfig.hasOwnProperty(key)) {
                        if (
                            typeof configData[key] === 'object' &&
                            configData[key] !== null
                        ) {
                            validatedConfig[key] = {
                                ...validatedConfig[key],
                                ...configData[key],
                            }
                        } else {
                            validatedConfig[key] = configData[key]
                        }
                    } else {
                        validatedConfig[key] = configData[key]
                    }
                })
            }
            return validatedConfig
        }
    }
    return new ConfigurationInterface()
}

module.exports = createConfigurationInterface
