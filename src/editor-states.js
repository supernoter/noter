import { marked } from './node_modules/marked/lib/marked.esm.js'

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
        if (e.ctrlKey && e.key === 'P') {
            e.preventDefault()
            this.editor.rephraseSelectedText()
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

export { EditState, GenerateState, HelpState, PreviewState }
