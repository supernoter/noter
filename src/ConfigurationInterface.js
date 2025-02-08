const fileSystem = require("fs");

class ConfigurationInterface {
  /**
   * PRIVATE FIELDS
   */

  #filePath = "./config.json";

  #defaultConfiguration = {
    window: { opacity: 1, width: 900, height: 550 },
    font: { colour: "blue", size: "25px", family: "Arial" },
    background: {
      colour: "white",
      gradient: null,
      image: null,
      opacity: "100%",
    },
    "status-bar": {
      font: { colour: "black", size: "15px", family: "Arial" },
      background: { colour: "white" },
    },
    preview: {
      font: { colour: "black", size: "20px", family: "Arial" },
      background: { colour: "blue" },
    },
  };

  /**
   * PUBLIC METHODS
   */

  // retrieves the configuration data object
  getConfigurationData() {
    this.#ensureConfigurationFileExistence();
    const configurationDataObject = this.#loadConfigurations();
    return configurationDataObject;
  }

  /**
   * PRIVATE METHODS
   */

  // opens a configuration file and returns its data
  #openConfigurationFile(filePath) {
    // const fileSystem = require("fs");

    const fileData = fileSystem.readFileSync(
      filePath,
      "binary",
      (error, fileData) => {
        if (error) {
          console.error("Error trying to read the file: ", error);
          return null;
        }

        return fileData;
      },
    );

    return fileData;
  }

  // receives a JS object as a string and converts it to a JSON
  #parseFileData(fileData) {
    if (fileData == null || fileData.trim() === "") {
      console.error("The file data is empty.");
      return;
    }

    return JSON.parse(fileData);
  }

  // opens the configuration file and returns its data as an object
  #loadConfigurations() {
    const fileData = this.#openConfigurationFile(this.#filePath);
    return this.#parseFileData(fileData);
  }

  // verifies if the configuration file exists in the specified path
  // if not, it'll be created there
  #ensureConfigurationFileExistence() {
    if (!fileSystem.existsSync(this.#filePath)) {
      fileSystem.writeFileSync(
        this.#filePath,
        JSON.stringify(this.#defaultConfiguration, null, 2),
      );
    }
  }
}

module.exports = new ConfigurationInterface();
