const { app, shell, Menu, dialog, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const os = require('os')
class menu {
    // constructor(window) {
    //   this.window = window;
    // }
    createMenu = (window) => {
        const isMac = process.platform === 'darwin'
        const template = [
            // { role: 'appMenu' }
            ...(isMac
                ? [
                      {
                          label: app.name,
                          submenu: [
                              { role: 'about' },
                              { type: 'separator' },
                              { role: 'services' },
                              { type: 'separator' },
                              { role: 'hide' },
                              { role: 'hideOthers' },
                              { role: 'unhide' },
                              { type: 'separator' },
                              { role: 'quit' },
                          ],
                      },
                  ]
                : []),
            // { role: 'fileMenu' }
            {
                label: 'File',
                submenu: [
                    {
                        label: 'New Note',
                        accelerator:
                            process.platform === 'darwin' ? 'Cmd+N' : 'Ctrl+N',
                        // click: () => this.createNewFile(window),
                        click: () => {
                            window.webContents.executeJavaScript(
                                'window.api.setContent("Hello World!")'
                            )
                            console.log('new note')
                            window.webContents.send('set-editor-title', 'NOTER')
                        },
                    },
                    {
                        // TODO: complete this
                        label: 'Open Note',
                        accelerator:
                            process.platform === 'darwin' ? 'Cmd+O' : 'Ctrl+O',
                        click: async () =>
                            dialog
                                .showOpenDialog(window, {
                                    properties: ['openFile'],
                                })
                                .then((result) => {
                                    const filePath = result.filePaths[0]
                                    if (result.canceled) return

                                    let content = fs.readFileSync(
                                        filePath,
                                        'utf8'
                                    )
                                    window.webContents.send(
                                        'set-editor-content',
                                        content
                                    )
                                    window.webContents.send(
                                        'set-editor-title',
                                        path.basename(filePath)
                                    )
                                }),
                    },
                    {
                        // TODO: complete this
                        label: 'Save Note',
                        accelerator:
                            process.platform === 'darwin' ? 'Cmd+S' : 'Ctrl+S',
                        click: async () => {
                            const { filePath } = await dialog.showSaveDialog(
                                window,
                                {
                                    title: 'Save',
                                    defaultPath: path.join(
                                        os.homedir(),
                                        'Desktop',
                                        'newfile.txt'
                                    ),
                                    filters: [
                                        {
                                            name: 'Markdown',
                                            extensions: ['md'],
                                        },
                                        {
                                            name: 'Text Files',
                                            extensions: ['txt'],
                                        },
                                        {
                                            name: 'All Files',
                                            extensions: ['*'],
                                        },
                                    ],
                                }
                            )
                            if (filePath) {
                                const content =
                                    await window.webContents.executeJavaScript(
                                        'window.api.getContent()'
                                    )
                                // console.log('saving content: ', content)
                                // console.log('file path: ', filePath)
                                fs.writeFile(filePath, content, (err) => {
                                    if (err) {
                                        console.error('Error saving file:', err)
                                        return 'Error saving file.'
                                    } else {
                                        return 'File saved successfully!'
                                    }
                                })
                            }
                        },
                    },
                    { type: 'separator' },
                    {
                        // TODO: complete this
                        label: 'Quit',
                        accelerator:
                            process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                        click: async () => {
                            app.quit()
                        },
                    },
                    // isMac ? [{ role: "close" }] : [{ role: "quit" }],
                ],
            },
            // { role: 'editMenu' }
            {
                label: 'Edit',
                submenu: [
                    { role: 'undo' },
                    { role: 'redo' },
                    { type: 'separator' },
                    { role: 'cut' },
                    { role: 'copy' },
                    { role: 'paste' },
                    ...(isMac
                        ? [
                              { role: 'pasteAndMatchStyle' },
                              { role: 'delete' },
                              { role: 'selectAll' },
                              { type: 'separator' },
                              {
                                  label: 'Speech',
                                  submenu: [
                                      { role: 'startSpeaking' },
                                      { role: 'stopSpeaking' },
                                  ],
                              },
                          ]
                        : [
                              { role: 'delete' },
                              { type: 'separator' },
                              { role: 'selectAll' },
                          ]),
                ],
            },
            // { role: 'viewMenu' }
            {
                label: 'View',
                submenu: [
                    { role: 'reload' },
                    { role: 'forceReload' },
                    { role: 'toggleDevTools' },
                    { type: 'separator' },
                    { role: 'resetZoom' },
                    { role: 'zoomIn' },
                    { role: 'zoomOut' },
                    { type: 'separator' },
                    { role: 'togglefullscreen' },
                ],
            },
            // { role: 'windowMenu' }
            {
                label: 'Window',
                submenu: [
                    { role: 'minimize' },
                    { role: 'zoom' },
                    { role: 'toggleDevTools' },
                    ...(isMac
                        ? [
                              { type: 'separator' },
                              { role: 'front' },
                              { type: 'separator' },
                              { role: 'window' },
                          ]
                        : [{ role: 'close' }]),
                ],
            },
            {
                role: 'help',
                submenu: [
                    {
                        label: 'Learn More',
                        click: async () => {
                            await shell.openExternal('https://supernoter.xyz')
                        },
                    },
                ],
            },
        ]

        const menu = Menu.buildFromTemplate(template)
        Menu.setApplicationMenu(menu)
    }
}

module.exports = new menu()
