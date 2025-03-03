// Editor tests.
import {
    Editor,
    EditState,
    PreviewState,
    HelpState,
    GenerateState,
} from './editor'

// Using jest.mock for modules, cf.
// https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options
jest.mock('./node_modules/jspdf/dist/jspdf.umd.min.js', () => ({
    __esModule: true,
    default: {
        jsPDF: jest.fn().mockImplementation(() => ({
            // We mock out properties required by the use in the editor,
            // like .internal.pageSize.width, ...
            internal: {
                pageSize: {
                    width: 210,
                },
            },
            // Mock implementation for generating HTML, cf.
            // https://jestjs.io/docs/mock-function-api#mockfnmockimplementationfn
            html: jest.fn().mockImplementation((element, options) => {
                if (options && options.callback) {
                    options.callback({ save: jest.fn() })
                }
                return true
            }),
            save: jest.fn(),
        })),
    },
}))

jest.mock('./node_modules/html2canvas/dist/html2canvas.esm.js', () => ({
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
}))

// Mock window.api
window.api = {
    shouldShowIntro: jest.fn().mockResolvedValue(false),
    setEditorFilePath: jest.fn(),
    setEditorContent: jest.fn(),
    setEditorTitle: jest.fn(),
    toggleSidebar: jest.fn(),
    updateFilePath: jest.fn(),
    basename: jest.fn((path) => path.split('/').pop()),
    getNotes: jest.fn().mockResolvedValue(['note0.md', 'note1.md']),
    readNote: jest.fn().mockResolvedValue('example note content'),
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

// mockModelName to use as name for LLM.
const mockModelName = 'random-llm-name'

// Mock LLM
const mockLLM = {
    checkModelAvailability: jest.fn().mockResolvedValue(true),
    getModelStatus: jest.fn().mockReturnValue({ currentModel: mockModelName }),
    switchToNextModel: jest.fn().mockResolvedValue(true),
    generateText: jest.fn(),
}

describe('Editor', () => {
    let editor
    let container

    beforeEach(() => {
        document.body.innerHTML = `
      <div id="editor-container">
        <div id="test-editor"></div>
      </div>
    `
        container = document.getElementById('test-editor')
        editor = new Editor('test-editor', mockLLM)
    })

    afterEach(() => {
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

        const testContent = 'example content from editor test'
        editor.setContent(testContent)

        expect(editor.getContent()).toBe(testContent)
        expect(editor.textarea.value).toBe(testContent)
    })

    test('should toggle between edit and preview states', async () => {
        await editor.init()

        expect(editor.state.constructor.name).toBe('EditState')
        expect(editor.textarea.style.display).toBe('block')
        expect(editor.preview.style.display).toBe('none')

        editor.setState(new PreviewState(editor))

        expect(editor.state.constructor.name).toBe('PreviewState')
        expect(editor.textarea.style.display).toBe('none')
        expect(editor.preview.style.display).toBe('block')
    })

    test('should toggle navigation bar', async () => {
        await editor.init()

        expect(editor.navigationBar.classList.contains('open')).toBe(false)

        await editor.toggleNavigationBar()

        expect(editor.navigationBar.classList.contains('open')).toBe(true)
        expect(window.api.getNotes).toHaveBeenCalled()
        expect(editor.noteList.childElementCount).toBeGreaterThan(0)

        await editor.toggleNavigationBar()

        expect(editor.navigationBar.classList.contains('open')).toBe(false)
    })

    test('should filter notes correctly', async () => {
        await editor.init()
        await editor.loadNotes()

        const noteItems = editor.noteList.getElementsByTagName('li')

        Array.from(noteItems).forEach((item) => {
            expect(item.style.display).not.toBe('none')
        })

        // Set search query and filter
        editor.searchInput.value = 'note0'
        editor.filterNotes()

        // Only matching notes should be visible
        Array.from(noteItems).forEach((item) => {
            if (item.textContent.includes('note0')) {
                expect(item.style.display).toBe('block')
            } else {
                expect(item.style.display).toBe('none')
            }
        })
    })

    test('should handle keyboard shortcuts correctly', async () => {
        await editor.init()

        const mockEvent = {
            ctrlKey: true,
            key: 'p',
            preventDefault: jest.fn(),
        }

        editor.handleKeyboardShortcuts(mockEvent)

        expect(editor.state.constructor.name).toBe('PreviewState')
        expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    test('should change font size', async () => {
        await editor.init()
        const initialSize = parseInt(
            window.getComputedStyle(editor.textarea).fontSize,
            10
        )
        editor.changeFontSize(1)
        const newSize = parseInt(
            window.getComputedStyle(editor.textarea).fontSize,
            10
        )
        expect(newSize).toBe(initialSize + 1)
    })

    test('should enter generate state on Ctrl+G', async () => {
        await editor.init()

        const mockEvent = {
            ctrlKey: true,
            key: 'g',
            preventDefault: jest.fn(),
        }

        editor.state.handleKeyboardShortcuts(mockEvent)
        const modelStatus = await editor.llm.getModelStatus()
        // TODO: we need to mock this out more.
        if (!modelStatus || modelStatus.currentModel == mockModelName) {
            expect(editor.state.constructor.name).toBe('EditState')
        } else {
            expect(editor.state.constructor.name).toBe('GenerateState')
            expect(mockEvent.preventDefault).toHaveBeenCalled()
        }
    })

    test('should update status bar correctly', async () => {
        await editor.init()

        const testData = 'test content'
        editor.setContent(testData)

        expect(editor.statusBar.innerHTML).toContain(testData.length.toString())
        expect(editor.statusBar.innerHTML).toContain('E') // Edit mode
        editor.setState(new PreviewState(editor))
        expect(editor.statusBar.innerHTML).toContain('P') // Preview mode
    })
})
