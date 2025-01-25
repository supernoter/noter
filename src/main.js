const { app, BrowserWindow, Menu } = require("electron/main");
const fs = require("fs");
const os = require("os");
// const path = require("path");
// app, which controls your application's event lifecycle.
// BrowserWindow, which creates and manages app windows.
let win;

const createWindow = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  //setting for mac menu items
  const isMac = process.platform === "darwin";
  //create template array for menu items
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
      label: "&File",
      submenu: [
        { label: "New File" },
        { label: "New Window" },
        { type: "separator" },
        {
          label: "Open",
          click: () => {
            console.log("open file");
          },
        },
        { label: "Open Folder" },
        { type: "separator" },
        { label: "Save" },
        { label: "Save As..." },
        { type: "separator" },
        { label: "Print" },
        ...(isMac ? [{ role: "close" }] : [{ role: "quit" }]),
      ],
    },
    // { role: 'editMenu' }
    {
      label: "&Edit",
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
                submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
              },
            ]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: "&View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
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
      label: "&Window",
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
    // {
    //   role: "&help",
    //   submenu: [
    //     {
    //       label: "Learn More",
    //       click: async () => {
    //         const { shell } = require("electron");
    //         await shell.openExternal("https://electronjs.org");
    //       },
    //     },
    //   ],
    // },
  ];
  //set each window's top menu
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  win.loadFile("index.html");
};

// Many of Electron's core modules are Node.js event emitters that adhere to
// Node's asynchronous event-driven architecture. The app module is one of
// these emitters.

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "Darwin") {
    app.quit();
  }
});

// You might have noticed the capitalization difference between the app and
// BrowserWindow modules. Electron follows typical JavaScript conventions here,
// where PascalCase modules are instantiable class constructors (e.g.
// BrowserWindow, Tray, Notification) whereas camelCase modules are not
// instantiable (e.g. app, ipcRenderer, webContents).
