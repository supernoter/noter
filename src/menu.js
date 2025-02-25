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
                            window.webContents.send('set-editor-filepath', '')
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
                                    window.webContents.send(
                                        'set-editor-filepath',
                                        filePath
                                    )
                                }),
                    },
                    {
                        label: 'Save Note',
                        accelerator:
                            process.platform === 'darwin' ? 'Cmd+S' : 'Ctrl+S',
                        click: async () => {
                            try {
                                const currentFilePath =
                                    await window.webContents.executeJavaScript(
                                        'window.api.getEditorFilePath()'
                                    )
                                let targetFilePath = currentFilePath
                                // Show save dialog if no existing file
                                if (
                                    typeof currentFilePath !== 'string' ||
                                    !currentFilePath.trim()
                                ) {
                                    const defaultPath = path.join(
                                        app.getPath('documents'),
                                        'noter',
                                        getCurrentFormattedTimestamp() + '.md'
                                    )
                                    const dialogResult =
                                        await dialog.showSaveDialog(window, {
                                            title: 'Save',
                                            defaultPath,
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

                                    targetFilePath = dialogResult.filePath
                                }

                                // Exit if no file path selected
                                if (!targetFilePath) {
                                    return
                                }

                                // Get and save content
                                const content =
                                    await window.webContents.executeJavaScript(
                                        'window.api.getContent()'
                                    )

                                await fs.promises.writeFile(
                                    targetFilePath,
                                    content
                                )
                                console.log(`file saved: ${targetFilePath}`)
                                await window.webContents.send(
                                    'set-editor-filepath',
                                    targetFilePath
                                )
                            } catch (error) {
                                console.error('failed to save file: ', error)
                                dialog.showErrorDialog(window, {
                                    title: 'Save Error',
                                    message: 'Failed to save file',
                                    detail: error.message,
                                })
                            }
                        },
                    },
                    {
                        label: 'Save Note As ...',
                        accelerator:
                            process.platform === 'darwin'
                                ? 'Cmd+Shift+S'
                                : 'Ctrl+Shift+S',
                        click: async () => {
                            let targetFilePath = undefined
                            const defaultPath = path.join(
                                app.getPath('documents'),
                                'noter',
                                getCurrentFormattedTimestamp() + '.md'
                            )
                            const dialogResult = await dialog.showSaveDialog(
                                window,
                                {
                                    title: 'Save',
                                    defaultPath,
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
                                }
                            )

                            targetFilePath = dialogResult.filePath

                            // Exit if no file path selected
                            if (!targetFilePath) {
                                return
                            }

                            // Get and save content
                            const content =
                                await window.webContents.executeJavaScript(
                                    'window.api.getContent()'
                                )

                            await fs.promises.writeFile(targetFilePath, content)
                            console.log(`file saved: ${targetFilePath}`)

                            // Update the editor's file path reference
                            await window.webContents.send(
                                'set-editor-filepath',
                                targetFilePath
                            )
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
                role: 'Help',
                submenu: [
                    {
                        label: 'Learn More',
                        click: async () => {
                            await shell.openExternal(HOMEPAGE)
                        },
                    },
                ],
            },
            {
                // menu button for theme selector
                label: 'Theme',
                submenu: [
                    {
                        label: 'chombe',
                        click: () => {
                            window.webContents.send('change-theme', 'chombe')
                        },
                    },
                    {
                        label: 'czygan',
                        click: () => {
                            window.webContents.send('change-theme', 'czygan')
                        },
                    },
                    {
                        label: 'dennis',
                        click: () => {
                            window.webContents.send('change-theme', 'dennis')
                        },
                    },
                    {
                        label: 'rizzo',
                        click: () => {
                            window.webContents.send('change-theme', 'rizzo')
                        },
                    },
                    {
                        label: 'marinho',
                        click: () => {
                            window.webContents.send('change-theme', 'marinho')
                        },
                    },
                ],
            },
        ]
        const menu = Menu.buildFromTemplate(template)
        Menu.setApplicationMenu(menu)
    }
}

const getCurrentFormattedTimestamp = () => {
    const now = new Date()
    return (
        now.getFullYear().toString().slice(-2) +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        '-' +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0')
    )
}

module.exports = new menu()
