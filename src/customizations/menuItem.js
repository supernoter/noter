const { app, Menu, dialog } = require("electron");
const fs = require("fs");
const os = require("os");
const path = require("path");

class menuItem {
  // constructor(window) {
  //   this.window = window;
  // }
  createMenu = (window) => {
    const isMac = process.platform === "darwin";
    const template = [
      // { role: 'appMenu' }
      ...(isMac
        ? [
            {
              label: app.name,
              submenu: [
                { role: "about" },
                { type: "separator" },
                { role: "services" },
                { type: "separator" },
                { role: "hide" },
                { role: "hideOthers" },
                { role: "unhide" },
                { type: "separator" },
                { role: "quit" },
              ],
            },
          ]
        : []),
      // { role: 'fileMenu' }
      {
        label: "File",
        submenu: [
          {
            label: "Create new file",
            click: () => this.openNewFile(window),
          },
          // isMac ? [{ role: "close" }] : [{ role: "quit" }],
        ],
      },
      // { role: 'editMenu' }
      {
        label: "Edit",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          ...(isMac
            ? [
                { role: "pasteAndMatchStyle" },
                { role: "delete" },
                { role: "selectAll" },
                { type: "separator" },
                {
                  label: "Speech",
                  submenu: [
                    { role: "startSpeaking" },
                    { role: "stopSpeaking" },
                  ],
                },
              ]
            : [
                { role: "delete" },
                { type: "separator" },
                { role: "selectAll" },
              ]),
        ],
      },
      // { role: 'viewMenu' }
      {
        label: "View",
        submenu: [
          { role: "reload" },
          { role: "forceReload" },
          { role: "toggleDevTools" },
          { type: "separator" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" },
        ],
      },
      // { role: 'windowMenu' }
      {
        label: "Window",
        submenu: [
          { role: "minimize" },
          { role: "zoom" },
          { role: "toggleDevTools" },
          ...(isMac
            ? [
                { type: "separator" },
                { role: "front" },
                { type: "separator" },
                { role: "window" },
              ]
            : [{ role: "close" }]),
        ],
      },
      {
        role: "help",
        submenu: [
          {
            label: "Learn More",
            click: async () => {
              const { shell } = require("electron");
              await shell.openExternal("https://electronjs.org");
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  };

  // Function to create a new file in the user's desktop directory.
  openNewFile = async (window) => {
    //open save dialog from electron.
    dialog
      .showSaveDialog(window, {
        //set default file path to the download folder and default file name to Untitled.
        defaultPath: path.join(app.getPath("downloads"), "Untitled.txt"),
        filters: [
          { name: "Text Files", extensions: ["txt"] },
          { name: "All Files", extensions: ["*"] },
        ],
      })
      .then((result) => {
        //If user selects cancel return.
        if (result.canceled) return;
        //set file path.
        const filePath = result.filePath;
        //write the file with the name the user has selected.
        fs.writeFile(filePath, "", (err) => {
          if (err) {
            console.error("Failed to create file:", err);
            dialog.showErrorBox("Error", "Could not create the file.");
          } else {
            //message dialoge showing where the user has saved the file.
            dialog.showMessageBox(
              window,
              {
                type: "info",
                title: "File Created",
                message: `File created at: ${filePath}`,
              },
              () => {}
            );
          }
        });
      });
  };
}

module.exports = new menuItem();
