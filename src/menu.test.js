const { app, Menu, dialog, shell } = require('electron')
const fs = require('fs')
const path = require('path')
const menuModule = require('./menu')
const utils = require('./utils.js')

// Mock the electron modules
jest.mock('electron', () => {
    return {
        app: {
            name: 'SuperNoter',
            getPath: jest.fn().mockReturnValue('/mock/documents'),
            quit: jest.fn(),
        },
        shell: {
            openExternal: jest.fn().mockResolvedValue(undefined),
        },
        dialog: {
            showOpenDialog: jest.fn(),
            showSaveDialog: jest.fn(),
            showErrorDialog: jest.fn(),
        },
        Menu: {
            buildFromTemplate: jest.fn().mockReturnValue({}),
            setApplicationMenu: jest.fn(),
        },
        ipcMain: {
            on: jest.fn(),
        },
    }
})

jest.mock('fs', () => {
    return {
        readFileSync: jest.fn().mockReturnValue('mock content'),
        promises: {
            writeFile: jest.fn().mockResolvedValue(undefined),
        },
    }
})

jest.mock('path', () => {
    return {
        join: jest.fn((...args) => args.join('/')),
        basename: jest.fn((filePath) => filePath.split('/').pop()),
    }
})

jest.mock('./utils.js', () => {
    return {
        getCurrentFormattedTimestamp: jest.fn().mockReturnValue('2025-03-02'),
        generatePronounceableName: jest.fn().mockReturnValue('testname'),
    }
})

describe('Menu Module', () => {
    let mockWindow

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks()

        // Create a mock window object
        mockWindow = {
            webContents: {
                executeJavaScript: jest.fn(),
                send: jest.fn(),
            },
        }

        // Mock specific return values for executeJavaScript calls
        mockWindow.webContents.executeJavaScript.mockImplementation(
            (script) => {
                if (script === 'window.api.getContent()') {
                    return Promise.resolve('Test content')
                } else if (script === 'window.api.getEditorFilePath()') {
                    return Promise.resolve('')
                }
                return Promise.resolve()
            }
        )
    })

    test('createMenu should build and set application menu', () => {
        menuModule.createMenu(mockWindow)

        expect(Menu.buildFromTemplate).toHaveBeenCalled()
        expect(Menu.setApplicationMenu).toHaveBeenCalled()
    })

    test('New Note menu item should reset editor content and title', async () => {
        menuModule.createMenu(mockWindow)

        // Extract the New Note click handler
        const fileMenuItems = Menu.buildFromTemplate.mock.calls[0][0].find(
            (item) => item.label === 'File'
        ).submenu
        const newNoteItem = fileMenuItems.find(
            (item) => item.label === 'New Note'
        )

        // Call the click handler
        await newNoteItem.click()

        expect(mockWindow.webContents.executeJavaScript).toHaveBeenCalledWith(
            'window.api.setContent("Hello World!")'
        )
        expect(mockWindow.webContents.send).toHaveBeenCalledWith(
            'set-editor-title',
            'NOTER'
        )
        expect(mockWindow.webContents.send).toHaveBeenCalledWith(
            'set-editor-filepath',
            ''
        )
    })

    test('Open Note menu item should open file dialog and load file content', async () => {
        // Setup mock return for dialog
        dialog.showOpenDialog.mockResolvedValue({
            canceled: false,
            filePaths: ['/path/to/test.md'],
        })

        menuModule.createMenu(mockWindow)

        // Extract the Open Note click handler
        const fileMenuItems = Menu.buildFromTemplate.mock.calls[0][0].find(
            (item) => item.label === 'File'
        ).submenu
        const openNoteItem = fileMenuItems.find(
            (item) => item.label === 'Open Note'
        )

        // Call the click handler
        await openNoteItem.click()

        expect(dialog.showOpenDialog).toHaveBeenCalled()
        expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/test.md', 'utf8')
        expect(mockWindow.webContents.send).toHaveBeenCalledWith(
            'set-editor-content',
            'mock content'
        )
        expect(mockWindow.webContents.send).toHaveBeenCalledWith(
            'set-editor-title',
            'test.md'
        )
        expect(mockWindow.webContents.send).toHaveBeenCalledWith(
            'set-editor-filepath',
            '/path/to/test.md'
        )
    })

    test('Save Note menu item should save content to file when no current filepath', async () => {
        // Mock for empty file path
        mockWindow.webContents.executeJavaScript.mockImplementation(
            (script) => {
                if (script === 'window.api.getEditorFilePath()') {
                    return Promise.resolve('')
                } else if (script === 'window.api.getContent()') {
                    return Promise.resolve('Test content')
                }
                return Promise.resolve()
            }
        )

        // Setup mock return for dialog
        dialog.showSaveDialog.mockResolvedValue({
            canceled: false,
            filePath: '/path/to/new-test.md',
        })

        menuModule.createMenu(mockWindow)

        // Extract the Save Note click handler
        const fileMenuItems = Menu.buildFromTemplate.mock.calls[0][0].find(
            (item) => item.label === 'File'
        ).submenu
        const saveNoteItem = fileMenuItems.find(
            (item) => item.label === 'Save Note'
        )

        // Call the click handler
        await saveNoteItem.click()

        expect(dialog.showSaveDialog).toHaveBeenCalled()
        expect(fs.promises.writeFile).toHaveBeenCalledWith(
            '/path/to/new-test.md',
            'Test content'
        )
        expect(mockWindow.webContents.send).toHaveBeenCalledWith(
            'set-editor-filepath',
            '/path/to/new-test.md'
        )
    })

    test('Save Note menu item should save to existing file when filepath exists', async () => {
        // Mock for existing file path
        mockWindow.webContents.executeJavaScript.mockImplementation(
            (script) => {
                if (script === 'window.api.getEditorFilePath()') {
                    return Promise.resolve('/path/to/existing.md')
                } else if (script === 'window.api.getContent()') {
                    return Promise.resolve('Updated content')
                }
                return Promise.resolve()
            }
        )

        menuModule.createMenu(mockWindow)

        // Extract the Save Note click handler
        const fileMenuItems = Menu.buildFromTemplate.mock.calls[0][0].find(
            (item) => item.label === 'File'
        ).submenu
        const saveNoteItem = fileMenuItems.find(
            (item) => item.label === 'Save Note'
        )

        // Call the click handler
        await saveNoteItem.click()

        // Should not show dialog for existing file
        expect(dialog.showSaveDialog).not.toHaveBeenCalled()
        expect(fs.promises.writeFile).toHaveBeenCalledWith(
            '/path/to/existing.md',
            'Updated content'
        )
        expect(mockWindow.webContents.send).toHaveBeenCalledWith(
            'set-editor-filepath',
            '/path/to/existing.md'
        )
    })

    test('Toggle Sidebar menu item should send toggle event', () => {
        menuModule.createMenu(mockWindow)

        // Extract the Toggle Sidebar click handler
        const viewMenuItems = Menu.buildFromTemplate.mock.calls[0][0].find(
            (item) => item.label === 'View'
        ).submenu
        const toggleSidebarItem = viewMenuItems.find(
            (item) => item.label === 'Toggle Sidebar'
        )

        // Call the click handler
        toggleSidebarItem.click()

        expect(mockWindow.webContents.send).toHaveBeenCalledWith(
            'toggle-sidebar'
        )
    })

    test('Learn More menu item should open external URL', async () => {
        menuModule.createMenu(mockWindow)

        // Extract the Learn More click handler
        const helpMenuItems = Menu.buildFromTemplate.mock.calls[0][0].find(
            (item) => item.role === 'Help'
        ).submenu
        const learnMoreItem = helpMenuItems.find(
            (item) => item.label === 'Learn More'
        )

        // Call the click handler
        await learnMoreItem.click()

        expect(shell.openExternal).toHaveBeenCalledWith(
            'https://supernoter.xyz/?src=app'
        )
    })
})
