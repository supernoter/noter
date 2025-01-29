class ConfigurationInterface
{

    // ==================
    // | PRIVATE FIELDS | 
    // ==================

    #filePath = "./config.json";
    #configurationData = {};

    // ==================
    // | PUBLIC METHODS | 
    // ==================

    /**
     * retrieves the configuration data  
     */  
    getConfigurationData(){
        this.#loadConfigurations();
        return this.#configurationData;
    }

    // ===================
    // | PRIVATE METHODS | 
    // ===================
    
    /**
     * opens the configuration file and retrieves its data
     * @param {String} filePath
     * @returns {String} fileData
     */
    #openConfigurationFile(filePath) {
        const fileSystem = require("fs");

        const fileData = fileSystem.readFileSync(filePath, "binary", (error, fileData) => {

            if (error) {
                console.error("Error trying to read the file: ", error);
                return null;
            }

            return fileData;
        });

        return fileData;
    }

    /**
     * parses the file data into an object
     * @param {String} fileData 
     * @returns {JSON} configurationData
     */
    #parseFileData(fileData) {
        if (fileData == null || fileData.trim() === "") {
            console.error("The file data is empty.");
            return;
        }

        return JSON.parse(fileData);
    }
    
    /**
     * loads the configuration data
     * (i.e.) opens and parses the file into an object
     */
    #loadConfigurations() {
        const fileData = this.#openConfigurationFile(this.#filePath);
        this.#configurationData = this.#parseFileData(fileData);
    }

    // TODO: CREATE A METHOD TO VERIFY THE JSON FILE EXISTANCE AND STRUCTURE

}

module.exports = new ConfigurationInterface();