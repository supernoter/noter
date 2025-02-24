const { app, shell, Menu, dialog, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const os = require('os')

const HOMEPAGE = 'https://supernoter.xyz/?src=app'

class menu {
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
                        click: () => {
                            window.webContents.executeJavaScript(
                                'window.api.setContent("Hello World!")'
                            )
                            window.webContents.send('set-editor-title', 'NOTER')
                        },
                    },
                    {
                        label: 'Open Note',
                        accelerator:
                            process.platform === 'darwin' ? 'Cmd+O' : 'Ctrl+O',
                        click: async () =>
                            dialog
                                .showOpenDialog(window, {
                                    defaultPath: path.join(
                                        app.getPath('documents'),
                                        'noter'
                                    ),
                                    properties: ['openFile'],
                                    filters: [
                                        {
                                            name: 'Markdown',
                                            extensions: ['md'],
                                        },
                                        {
                                            name: 'All Files',
                                            extensions: ['*'],
                                        },
                                    ],
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
                ],
            },
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
                    {
                        label: 'Toggle Sidebar',
                        accelerator:
                            process.platform === 'darwin' ? 'Cmd+B' : 'Ctrl+B',
                        click: () => {
                            window.webContents.send('toggle-sidebar')
                        },
                    },
                ],
            },
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
                            await shell.openExternal(HOMEPAGE)
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
