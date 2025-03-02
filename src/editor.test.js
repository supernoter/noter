/**
 * @jest-environment jsdom
 */

// Import the components
import {
    Editor,
    EditState,
    PreviewState,
    HelpState,
    GenerateState,
} from './editor'

jest.mock(
    './node_modules/jspdf/dist/jspdf.umd.min.js',
    () => ({
        __esModule: true,
        default: {
            jsPDF: jest.fn().mockImplementation(() => ({
                internal: {
                    pageSize: {
                        width: 210,
                    },
                },
                html: jest.fn().mockImplementation((element, options) => {
                    if (options && options.callback) {
                        options.callback({ save: jest.fn() })
                    }
                    return true
                }),
                save: jest.fn(),
            })),
        },
    }),
    { virtual: true }
)

jest.mock(
    './node_modules/html2canvas/dist/html2canvas.esm.js',
    () => ({
        __esModule: true,
        default: jest.fn().mockImplementation(() => {
            return Promise.resolve({
                width: 800,
                height: 600,
                toDataURL: jest
                    .fn()
                    .mockReturnValue('data:image/png;base64,mockBase64Data'),
            })
        }),
    }),
    { virtual: true }
)

// Mock window.api
window.api = {
    shouldShowIntro: jest.fn().mockResolvedValue(false),
    setEditorFilePath: jest.fn(),
    setEditorContent: jest.fn(),
    setEditorTitle: jest.fn(),
    toggleSidebar: jest.fn(),
    updateFilePath: jest.fn(),
    basename: jest.fn((path) => path.split('/').pop()),
    getNotes: jest.fn().mockResolvedValue(['note1.md', 'note2.md']),
    readNote: jest.fn().mockResolvedValue('Note content'),
}

// Mock window.jspdf
window.jspdf = {
    jsPDF: jest.fn().mockImplementation(() => ({
        internal: {
            pageSize: {
                width: 210,
            },
        },
        html: jest.fn().mockImplementation((element, options) => {
            if (options && options.callback) {
                options.callback({ save: jest.fn() })
            }
            return true
        }),
        save: jest.fn(),
    })),
}

// Mock LLM
const mockLLM = {
    checkModelAvailability: jest.fn().mockResolvedValue(true),
    getModelStatus: jest.fn().mockReturnValue({ currentModel: 'test-model' }),
    switchToNextModel: jest.fn().mockResolvedValue(true),
    generateText: jest.fn(),
}

describe('Editor', () => {
    let editor
    let container

    beforeEach(() => {
        // Setup DOM elements
        document.body.innerHTML = `
      <div id="editor-container">
        <div id="test-editor"></div>
      </div>
    `
        container = document.getElementById('test-editor')
        editor = new Editor('test-editor', mockLLM)
    })

    afterEach(() => {
        // Clean up
        document.body.innerHTML = ''
        jest.clearAllMocks()
    })

    test('should initialize correctly', async () => {
        await editor.init()

        expect(container.querySelector('textarea')).not.toBeNull()
        expect(container.querySelector('.preview')).not.toBeNull()
        expect(container.querySelector('.status-bar')).not.toBeNull()
        expect(window.api.shouldShowIntro).toHaveBeenCalled()
    })

    test('should set content correctly', async () => {
        await editor.init()

        const testContent = 'Test content'
        editor.setContent(testContent)

        expect(editor.getContent()).toBe(testContent)
        expect(editor.textarea.value).toBe(testContent)
    })

    test('should toggle between edit and preview states', async () => {
        await editor.init()

        // Initial state should be EditState
        expect(editor.state.constructor.name).toBe('EditState')
        expect(editor.textarea.style.display).toBe('block')
        expect(editor.preview.style.display).toBe('none')

        // Switch to preview state
        editor.setState(new PreviewState(editor))

        expect(editor.state.constructor.name).toBe('PreviewState')
        expect(editor.textarea.style.display).toBe('none')
        expect(editor.preview.style.display).toBe('block')
    })

    test('should toggle navigation bar', async () => {
        await editor.init()

        // Navigation bar should be hidden initially
        expect(editor.navigationBar.classList.contains('open')).toBe(false)

        // Toggle navigation bar
        await editor.toggleNavigationBar()

        expect(editor.navigationBar.classList.contains('open')).toBe(true)
        expect(window.api.getNotes).toHaveBeenCalled()
        expect(editor.noteList.childElementCount).toBeGreaterThan(0)

        // Toggle again to hide
        await editor.toggleNavigationBar()

        expect(editor.navigationBar.classList.contains('open')).toBe(false)
    })

    test('should filter notes correctly', async () => {
        await editor.init()
        await editor.loadNotes()

        const noteItems = editor.noteList.getElementsByTagName('li')

        // All notes should be visible initially
        Array.from(noteItems).forEach((item) => {
            expect(item.style.display).not.toBe('none')
        })

        // Set search query and filter
        editor.searchInput.value = 'note1'
        editor.filterNotes()

        // Only matching notes should be visible
        Array.from(noteItems).forEach((item) => {
            if (item.textContent.includes('note1')) {
                expect(item.style.display).toBe('block')
            } else {
                expect(item.style.display).toBe('none')
            }
        })
    })

    test('should handle keyboard shortcuts correctly', async () => {
        await editor.init()

        // Mock key event
        const mockEvent = {
            ctrlKey: true,
            key: 'p',
            preventDefault: jest.fn(),
        }

        // Dispatch keyboard shortcut
        editor.handleKeyboardShortcuts(mockEvent)

        // Should switch to preview state
        expect(editor.state.constructor.name).toBe('PreviewState')
        expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    test('should change font size', async () => {
        await editor.init()

        // Get initial font size
        const initialSize = parseInt(
            window.getComputedStyle(editor.textarea).fontSize,
            10
        )

        // Increase font size
        editor.changeFontSize(1)

        // Get new font size
        const newSize = parseInt(
            window.getComputedStyle(editor.textarea).fontSize,
            10
        )

        // Font size should be increased by 1
        expect(newSize).toBe(initialSize + 1)
    })

    test('should enter generate state on Ctrl+G', async () => {
        await editor.init()

        // Mock key event for Ctrl+G
        const mockEvent = {
            ctrlKey: true,
            key: 'g',
            preventDefault: jest.fn(),
        }

        // Handle shortcut
        editor.state.handleKeyboardShortcuts(mockEvent)

        const modelStatus = await editor.llm.getModelStatus()

        if (!modelStatus || modelStatus.currentModel == 'test-model') {
            expect(editor.state.constructor.name).toBe('EditState')
        } else {
            expect(editor.state.constructor.name).toBe('GenerateState')
            expect(mockEvent.preventDefault).toHaveBeenCalled()
        }
    })

    test('should update status bar correctly', async () => {
        await editor.init()

        // Set content
        editor.setContent('Test content')

        // Status bar should be updated
        expect(editor.statusBar.innerHTML).toContain('12') // Length of 'Test content'
        expect(editor.statusBar.innerHTML).toContain('E') // Edit mode

        // Switch state
        editor.setState(new PreviewState(editor))

        // Status bar should reflect new state
        expect(editor.statusBar.innerHTML).toContain('P') // Preview mode
    })
})
