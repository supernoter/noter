import { marked } from './node_modules/marked/lib/marked.esm.js'
import * as jsPDF from './node_modules/jspdf/dist/jspdf.umd.min.js'
import * as html2canvas from './node_modules/html2canvas/dist/html2canvas.esm.js'

// PLACEHOLDER is the textarea placeholder text
const PLACEHOLDER = `Let's go … and type CTRL-P to toggle preview, and CTRL-H for help`

// HELP is the inline help contents of NOTER, accessed by CTRL-h or F1.
const HELP = `# NOTER Help

NOTER is a markdown editor with PDF export and LLM support. Learn more at [supernoter.xyz](https://supernoter.xyz).

## Text generation with LLM

To invoke LLM text generation use a specific prefix (">>"), write the prompt
(anything up to the next newline) and hit CTRL-G.

Example:

    >> This text is sent to the LLM.

## Keyboard Shortcuts

### File handline

* **CTRL-N**: Create a New file
* **CTRL-O**: Open a file
* **CTRL-S**: Save the file
* **CTRL-SHIFT-s**: Save to a new file
* **CTRL-E**: Export notes to PDF

### Other

* **CTRL-B**: Open Navigation Sidebar
* **CTRL-G**: Generate text for editor prompts
* **CTRL-H** or **F1**: Toggle this help view
* **CTRL-P**: Toggle preview mode
* **CTRL-I**: Switch to next available LLM model
* **CTRL-+**: Increase font size
* **CTRL--**: Decrease font size

## Markdown Tips

* Use # for headers
* Use * or - for bullet points
* Use ** for bold text
* Use * for italic text
* Use \`code\` for inline code
* Use \`\`\` for code blocks

## Status Bar

The status bar shows:

* Current character count in editor
* Cursor position (row:column)
* Number of characters written by a human (H) and machine (M)
* The currently connected LLM name (e.g. "gemma") or "no model" if no LLM is available
* Current font size
* The current editor mode (E=edit, P=preview, G=generate)
`
// EditorState encapsulates the different modes the editor can be in, like edit,
// preview, help and potentially others.
class EditorState {
    constructor(editor) {
        this.editor = editor
    }
    enterState() {}
    exitState() {}
    handleKeyboardShortcuts(e) {}
    getName() {
        return 'X' // unknown state, should never happen
    }
}

// GenerateState is entered when the user requests LLM text
class GenerateState extends EditorState {
    constructor(editor) {
        super(editor)
        this.isGenerating = false
    }

    getName() {
        return this.errorMessage ? '❌' : '⚡'
    }

    enterState() {
        console.log('mode: generate')
        this.editor.textarea.style.display = 'block'
        this.editor.preview.style.display = 'none'
        this.cursorPosition = this.editor.textarea.selectionStart
        this.errorMessage = null
        this.isGenerating = true

        // Start generation
        this.generateResponses().catch((error) => {
            console.error('Generation failed:', error)
            this.handleError(error)
        })
    }

    exitState() {
        this.isGenerating = false
        this.errorMessage = null
    }

    handleError(error) {
        this.errorMessage = error.message
        this.editor.updateStatusBar()
        setTimeout(() => {
            this.editor.setState(new EditState(this.editor))
        }, 2000) // Show error for 2 seconds before returning to edit mode
    }

    getStatusText() {
        const baseStatus = this.editor.getBaseStatus()
        if (this.errorMessage) {
            return `${baseStatus} · error: ${this.errorMessage} · ${this.getName()}`
        }
        return `${baseStatus} · ${this.getName()}`
    }

    async generateResponses() {
        if (!this.editor.llm) {
            throw new Error('LLM not configured')
        }

        const lines = this.editor.textarea.value.split('\n')
        let modified = false

        try {
            for (let i = 0; i < lines.length; i++) {
                if (!this.isGenerating) {
                    console.log('Generation cancelled by user')
                    break
                }

                if (lines[i].startsWith(this.editor.llmTriggerPrefix)) {
                    const prompt = lines[i].substring(3)
                    let hasResponse = false

                    // Check for existing responses
                    for (let j = i + 1; j < lines.length; j++) {
                        if (
                            lines[j].startsWith(this.editor.llmResponsePrefix)
                        ) {
                            hasResponse = true
                            break
                        }
                        if (lines[j].startsWith(this.editor.llmTriggerPrefix)) {
                            break
                        }
                    }

                    if (!hasResponse) {
                        modified = true
                        let generatedText = ''

                        try {
                            await this.editor.llm.generateText(
                                prompt,
                                (token) => {
                                    if (!this.isGenerating) return

                                    this.editor.llmCharCount += token.length
                                    generatedText += token
                                    lines[i] =
                                        `${this.editor.llmTriggerPrefix}${prompt}\n\n> ${
                                            generatedText
                                        }`
                                    this.editor.setContent(lines.join('\n'))
                                }
                            )
                        } catch (error) {
                            if (this.isGenerating) {
                                lines[i] = `${this.editor.llmTriggerPrefix}${
                                    prompt
                                }\n\n> error: ${error.message}`
                                throw error
                            }
                        }
                    }
                }
            }
        } finally {
            if (modified) {
                this.editor.setContent(lines.join('\n'))
            }
            this.editor.setState(new EditState(this.editor))
        }
    }

    handleKeyboardShortcuts(e) {
        if (e.key === 'Escape') {
            e.preventDefault()
            this.isGenerating = false
            this.editor.updateStatusBar() // Provide immediate feedback
            return true
        }
        return false
    }
}

// EditState: the user sees the textarea and can type text
class EditState extends EditorState {
    getName() {
        return 'E'
    }
    enterState() {
        console.log('mode: edit')
        this.editor.textarea.style.display = 'block'
        this.editor.preview.style.display = 'none'
        this.editor.textarea.focus()
    }
    async handleKeyboardShortcuts(e) {
        if (e.ctrlKey && e.key === 'g') {
            e.preventDefault()
            this.editor.setState(new GenerateState(this.editor))
            return true
        }
        if (e.ctrlKey && e.key == 'p') {
            e.preventDefault()
            this.editor.setState(new PreviewState(this.editor))
            return true
        }
        if (e.ctrlKey && e.key == 'e') {
            e.preventDefault()
            this.editor.exportMarkdown()
            return true
        }
        if ((e.ctrlKey && e.key == 'h') || e.key == 'F1') {
            e.preventDefault()
            this.editor.setState(new HelpState(this.editor))
            return true
        }
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault()
            this.editor.toggleNavigationBar()
            return true
        }
        if (e.ctrlKey && e.key === 'j') {
            e.preventDefault()
            this.editor.switchModel()
            return true
        }
        // Only count single alphanumeric keystrokes
        if (
            !e.ctrlKey &&
            !e.altKey &&
            e.key.length === 1 &&
            /[\w\s]/.test(e.key)
        ) {
            this.editor.keystrokeCount++
        }
        return false
    }
}

// PreviewState: the user sees a rendering of the markdown content
class PreviewState extends EditorState {
    getName() {
        return 'P'
    }
    enterState() {
        console.log(
            `mode: preview (compiling and rendering ${
                this.editor.textarea.value.length
            } bytes)`
        )
        this.editor.textarea.style.display = 'none'
        this.editor.preview.style.display = 'block'
        this.editor.preview.innerHTML = marked.parse(this.editor.textarea.value)
    }
    handleKeyboardShortcuts(e) {
        if ((e.ctrlKey && e.key == 'p') || e.key == 'Escape') {
            e.preventDefault()
            this.editor.setState(new EditState(this.editor))
            return true
        }
        if (e.ctrlKey && e.key == 'e') {
            e.preventDefault()
            this.editor.exportMarkdown()
            return true
        }
        if ((e.ctrlKey && e.key == 'h') || e.key == 'F1') {
            e.preventDefault()
            this.editor.setState(new HelpState(this.editor))
            return true
        }
        return false
    }
}

// HelpState: where the user sees a rendered help text
class HelpState extends EditorState {
    getName() {
        return 'H'
    }
    enterState() {
        console.log('mode: help')
        this.savedContent = this.editor.textarea.value
        this.editor.textarea.style.display = 'none'
        this.editor.preview.style.display = 'block'
        // TODO: apply some custom nice looking stylesheet for help
        this.editor.preview.innerHTML = marked.parse(this.editor.helpText)
    }
    exitState() {
        this.editor.textarea.value = this.savedContent
    }
    handleKeyboardShortcuts(e) {
        if ((e.ctrlKey && e.key === 'h') || e.key === 'Escape') {
            e.preventDefault()
            this.editor.setState(new EditState(this.editor))
            return true
        }
        return false
    }
}

// Editor implements the basic editing function for NOTER.
class Editor {
    // XXX: the jsPDF cannot handle non-english words, like jap, kor, cn
    #pdf_doc = null
    #pdf_font_style = null
    #pdf_page_width = null

    constructor(containerId, llm = null) {
        this.container = document.getElementById(containerId)
        // Store original textarea content when help is shown (TODO: do we need
        // this at all)
        this.savedContent = ''
        // typingDelay and typePause are only for the intro animation
        this.typingDelay = 30
        this.typingPause = 1200
        // keystrokeCount counts the total number of keystrokes
        this.keystrokeCount = 0
        this.llmCharCount = 0
        // LLM related fields
        this.llm = llm
        this.llmTriggerPrefix = '>> '
        this.llmResponsePrefix = '> '
        // Help text
        this.helpText = HELP
        // PDF export
        const { jsPDF } = window.jspdf
        this.#pdf_doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4', // Possible values: 'a3', 'a4' (default), 'a5', 'letter', 'legal'
        })
        this.#pdf_page_width = this.#pdf_doc.internal.pageSize.width
        this.#pdf_font_style = 'Arial'
    }

    // init sets up the editor, after instanciation this is the only methods
    // that needs to be called before the editor becomes usable
    async init() {
        await this.initializeElements()

        // dispatch an event, so customization could be applied; this is a
        // workaround, because at DOMContentLoaded the elements may not all be
        // there to customize
        const event = new Event('NoterEditorElementsLoaded')
        window.dispatchEvent(event)

        await this.initializeEventListeners()

        // If we have an llm configured, then try to connect
        // XXX: bail out quickly, if we have no connectivity
        if (this.llm) {
            this.llm
                .checkModelAvailability()
                .then(() => this.updateStatusBar())
                .catch((error) => console.warn('model check failed:', error))
        }

        // enter the first editor state
        this.state = new EditState(this)
        this.state.enterState()
        this.updateStatusBar()

        // ensure textarea is empty
        this.textarea.value = ''

        // only show intro sequence, if --no-intro has not been passed
        const showIntro = await window.api.shouldShowIntro()
        if (showIntro) {
            const introText = 'noter: write together'
            return new Promise(async (resolve) => {
                await this.typeEffect(introText, 'together')
                await this.deleteEffect(introText)
                await this.loadNotes()
                this.textarea.focus()
                resolve()
            })
        } else {
            return new Promise(async (resolve) => {
                this.textarea.focus()
                resolve()
            })
        }
    }

    // initializeElements attaches DOM elements to HTML
    initializeElements() {
        // create textarea
        this.textarea = document.createElement('textarea')
        this.textarea.setAttribute('spellcheck', 'false')
        this.textarea.setAttribute('placeholder', PLACEHOLDER)
        this.textarea.id = 'note-textarea'

        // create preview div
        this.preview = document.createElement('div')
        this.preview.className = 'preview'
        this.preview.id = 'preview'
        this.preview.style.display = 'none'

        // create status bar
        this.statusBar = document.createElement('div')
        this.statusBar.className = 'status-bar'
        this.statusBar.id = 'status-bar'

        // create navigation side bar
        this.navigationBar = document.createElement('div')
        this.navigationBar.className = 'navigation-bar'
        this.navigationBar.id = 'navigation-bar'
        this.navigationBar.style.width = '200px'

        // create note list
        this.noteList = document.createElement('ul')
        this.noteList.id = 'note-list'

        // Create search input
        this.searchInput = document.createElement('input')
        this.searchInput.type = 'text'
        this.searchInput.id = 'search-notes'
        this.searchInput.placeholder = 'Search notes...'
        this.searchInput.className = 'search-bar'

        // append elements to container
        this.container.appendChild(this.textarea)
        this.container.appendChild(this.preview)
        this.container.appendChild(this.statusBar)
        this.container.appendChild(this.navigationBar)
        this.navigationBar.appendChild(this.searchInput)
        this.navigationBar.appendChild(this.noteList)
    }

    // initializeEventListeners attaches event listener to elements, e.g. we want
    // to update the status bar at every keystroke.
    initializeEventListeners() {
        // text-related events
        this.textarea.addEventListener('input', () => this.updateStatusBar())
        this.textarea.addEventListener('keyup', () => this.updateStatusBar())
        this.textarea.addEventListener('click', () => this.updateStatusBar())
        this.textarea.addEventListener('select', () => this.updateStatusBar())
        this.textarea.addEventListener('mousemove', () =>
            this.updateStatusBar()
        )
        this.searchInput.addEventListener('input', () => this.filterNotes())

        document.addEventListener('keydown', (e) =>
            this.handleKeyboardShortcuts(e)
        )

        window.api.setEditorFilePath((filePath) => {
            console.log('setEditorFilePath callback: ' + filePath)
            document.title = filePath ? window.api.basename(filePath) : 'NOTER'
            window.api.updateFilePath(filePath)
        })
        window.api.setEditorContent((value) => {
            this.textarea.value = value
            console.log('setEditorContent (index): ' + value)
        })
        window.api.setEditorTitle((value) => {
            document.title = value
            console.log('setEditorTitle (index): ' + value)
        })
        window.api.toggleSidebar(() => {
            console.log('toggle sidebar')
            this.toggleNavigationBar()
        })
    }

    async handleKeyboardShortcuts(e) {
        try {
            // Handle both async and non-async state handlers
            const stateHandled = this.state.handleKeyboardShortcuts(e)
            const result =
                stateHandled instanceof Promise
                    ? await stateHandled
                    : stateHandled

            if (result) {
                return // State handled it
            }

            // Common shortcuts
            if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
                e.preventDefault()
                this.changeFontSize(1)
            } else if (e.ctrlKey && e.key === '-') {
                e.preventDefault()
                this.changeFontSize(-1)
            } else if (e.ctrlKey && e.key === 'b') {
                e.preventDefault()
                this.toggleNavigationBar()
            }
        } catch (error) {
            console.error('Error handling keyboard shortcut:', error)
        }
    }

    // setState is called on a state transition, currently on a keyboard
    // shortcut
    setState(newState) {
        this.state.exitState()
        this.state = newState
        this.state.enterState()
        this.updateStatusBar()
    }

    // toggleNavigationBar show and hides the navigation sidebar
    async toggleNavigationBar() {
        const navigationBar = document.getElementById('navigation-bar')
        const editorContainer = document.getElementById('editor-container')
        if (!navigationBar.classList.contains('open')) {
            console.log('updating note list')
            await this.loadNotes()
        }
        navigationBar.classList.toggle('open')
        editorContainer.classList.toggle('shifted')
        if (navigationBar.classList.contains('open')) {
            this.searchInput.focus()
        } else {
            this.textarea.focus()
        }
    }

    // filterNotes filters notes in the sidebar
    filterNotes() {
        const query = this.searchInput.value.toLowerCase()
        const noteItems = this.noteList.getElementsByTagName('li')

        Array.from(noteItems).forEach((item) => {
            const noteName = item.textContent.toLowerCase()
            item.style.display = noteName.includes(query) ? 'block' : 'none'
        })
    }

    // loadNotes reads list of files from disk
    async loadNotes() {
        const noteFiles = await window.api.getNotes()
        this.noteList.innerHTML = ''

        noteFiles.forEach((file) => {
            const listItem = document.createElement('li')
            listItem.textContent = file.replace('.md', '')
            listItem.addEventListener('click', () => this.openNote(file))
            this.noteList.appendChild(listItem)
        })
        this.filterNotes()
    }

    // openNote opens a file by filename
    async openNote(filename) {
        const content = await window.api.readNote(filename)
        this.setContent(content)
    }

    // changeFontSize changes the font size, with some limits
    changeFontSize(delta) {
        const currentSize = parseInt(
            window.getComputedStyle(this.textarea).fontSize,
            10
        )
        const newSize = Math.max(10, currentSize + delta)
        this.textarea.style.fontSize = `${newSize}px`
        this.updateStatusBar()
    }

    // scrollToBottom is a helper method to scroll to bottom (e.g. on LLM
    // output); TODO: what is the llm output is generated mid document?
    scrollToBottom() {
        this.textarea.scrollTop = this.textarea.scrollHeight
    }

    // getBaseStatus gets the base status bar text without state-specific
    // additions
    getBaseStatus() {
        const charCount = this.textarea.value.length
        const text = this.textarea.value.substring(
            0,
            this.textarea.selectionStart
        )
        const row = text.split('\n').length
        const column = text.split('\n').pop().length + 1
        const fontSize = window.getComputedStyle(this.textarea).fontSize

        let status = `${charCount} · ${row}:${column} · H:${
            this.keystrokeCount
        } · <span class="llm-count">M:${this.llmCharCount}</span> · ${fontSize}`

        // Add model info or warning
        if (this.llm != null) {
            const modelStatus = this.llm.getModelStatus()
            if (modelStatus) {
                status += ` · <span class="model-name">${modelStatus.currentModel}</span>`
            } else {
                status += ` · <span class="model-warning">no model</span>`
            }
        }
        return status
    }

    // updateStatusBar updates the statusbar
    updateStatusBar() {
        if (this.state.getStatusText) {
            this.statusBar.innerHTML = this.state.getStatusText() // Use innerHTML instead of textContent
        } else {
            this.statusBar.innerHTML = `${this.getBaseStatus()} · ${this.state.getName()}`
        }
    }

    // typeEffect is here for an initial typing sequence, giving an impression
    // of a autonomous typing entity
    typeEffect(text, highlightString = 'together') {
        return new Promise((resolve) => {
            let index = 0
            const interval = setInterval(() => {
                if (index < text.length) {
                    this.textarea.value += text[index]
                    index++
                    this.updateStatusBar()
                } else {
                    clearInterval(interval)
                    const highlightStart = text.indexOf(highlightString)
                    const highlightEnd = highlightStart + highlightString.length
                    this.textarea.setSelectionRange(
                        highlightStart,
                        highlightEnd
                    )
                    this.textarea.focus()
                    setTimeout(() => {
                        this.textarea.setSelectionRange(0, 0)
                        resolve(text)
                    }, this.typingPause)
                }
            }, this.typingDelay)
        })
    }

    // deleteEffect takes back some text, part of the initial sequence
    deleteEffect(text) {
        return new Promise((resolve) => {
            let index = text.length
            const interval = setInterval(() => {
                if (index > 0) {
                    this.textarea.value = this.textarea.value.slice(0, -1)
                    index--
                    this.updateStatusBar()
                } else {
                    clearInterval(interval)
                    resolve()
                }
            }, this.typingDelay)
        })
    }

    // getComputedStyle gets the current content of the editor
    getContent() {
        return this.textarea.value
    }

    // setContent sets new content for the editor
    setContent(content) {
        this.textarea.value = content
        this.updateStatusBar()
        this.scrollToBottom()
    }

    /* export the markdown code into pdf */
    exportMarkdown() {
        const pdf_margin = 5
        const top_margin = 2

        let max_line_width = this.#pdf_page_width - pdf_margin * 2
        let importStream = this.textarea.value
        let htmlContent = marked(importStream)

        const cleanHtmlContent = htmlContent.replace(/<pre><\/pre>/g, '')
        const html = cleanHtmlContent

        let dummyDiv = document.createElement('div')
        dummyDiv.innerHTML = html
        dummyDiv.className = 'pdf-content'
        dummyDiv.style.width = `${max_line_width}px`
        dummyDiv.style.height = 'auto'
        dummyDiv.style.fontFamily = 'Garamond, Arial, sans-serif'
        document.body.appendChild(dummyDiv)
        console.log(html)

        this.#pdf_doc.html(dummyDiv, {
            callback: (doc) => {
                doc.save('document.pdf')

                // clear the pdf generation caches
                document.body.removeChild(dummyDiv)
                const canvases = document.querySelectorAll('canvas')
                canvases.forEach((canvas) => {
                    canvas.remove()
                })
            },
            x: pdf_margin,
            y: top_margin,
            margin: [top_margin, pdf_margin, pdf_margin, pdf_margin],
        })
    }

    // switchModel switches to the next model, and cycles if it reaches the end
    // of the list. This feature is currently not documented.
    async switchModel() {
        if (!this.llm) {
            console.warn('LLM not configured')
            return
        }
        try {
            const prevStatusBar = this.statusBar.innerHTML
            this.statusBar.innerHTML = `${this.getBaseStatus()} · switching model...`
            const success = await this.llm.switchToNextModel()
            if (success) {
                console.log(`successfully switched to model: ${this.llm.model}`)
                this.updateStatusBar()
            } else {
                console.warn('failed to switch model')
                this.statusBar.innerHTML = prevStatusBar
                setTimeout(() => {
                    this.statusBar.innerHTML = `${this.getBaseStatus()} · model switching failed`
                    setTimeout(() => this.updateStatusBar(), 2000)
                }, 100)
            }
        } catch (error) {
            console.error('error switching model:', error)
            this.updateStatusBar()
        }
    }
}

export { Editor, GenerateState, EditState, PreviewState, HelpState }
