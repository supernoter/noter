const { ipcRenderer } = require("electron");

class Trigger {
  constructor() {
    this.textarea = document.getElementById("note-textarea");
  }
}

const trigger = new Trigger();
