const { app, Menu } = require("electron");
const fs = require("fs");
const os = require("os");
const path = require("path");

class menuItem {
  createMenu = () => {
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
            label: "New File...",
            click: this.openNewFile(),
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
  openNewFile = () => {
    const deskTopPath = os.homedir();
    const filePath = path.join(deskTopPath, "New Document.txt");
    let data = "Hello World";

    // Open the save dialog with the default path set to the desktop
    // filePath = dialog.showSaveDialog(mainWindow, {
    //   title: "Save File",
    //   defaultPath: defaultFilePath,
    //   buttonLabel: "Save",
    //   filters: [
    //     { name: "Text Files", extensions: ["txt"] },
    //     { name: "All Files", extensions: ["*"] },
    //   ],
    // });

    fs.open(filePath, "w+", (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(`File created at: ${filePath}`);
    });
  };
}

module.exports = new menuItem();
