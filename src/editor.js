/**
 * Author: Martin
 */

import { marked } from "./node_modules/marked/lib/marked.esm.js";
import * as jsPDF from "./node_modules/jspdf/dist/jspdf.umd.min.js";
import * as html2canvas from "./node_modules/html2canvas/dist/html2canvas.min.js";

// EditorState encapsulates the different modes the editor can be in, like edit,
// preview, help and potentially others.
class EditorState {
  constructor(editor) {
    this.editor = editor;
  }
  enterState() {}
  exitState() {}
  handleKeyboardShortcuts(e) {}
  getName() {
    return "X"; // unknown state, should never happen
  }
}

class GenerateState extends EditorState {
  constructor(editor) {
    super(editor);
    this.isGenerating = false;
  }

  getName() {
    return this.errorMessage ? "❌" : "⚡";
  }

  enterState() {
    console.log("mode: generate");
    this.editor.textarea.style.display = "block";
    this.editor.preview.style.display = "none";
    this.cursorPosition = this.editor.textarea.selectionStart;
    this.errorMessage = null;
    this.isGenerating = true;

    // Start generation
    this.generateResponses().catch((error) => {
      console.error("Generation failed:", error);
      this.handleError(error);
    });
  }

  exitState() {
    this.isGenerating = false;
    this.errorMessage = null;
  }

  handleError(error) {
    this.errorMessage = error.message;
    this.editor.updateStatusBar();
    setTimeout(() => {
      this.editor.setState(new EditState(this.editor));
    }, 2000); // Show error for 2 seconds before returning to edit mode
  }

  getStatusText() {
    const baseStatus = this.editor.getBaseStatus();
    if (this.errorMessage) {
      return `${baseStatus} · error: ${this.errorMessage} · ${this.getName()}`;
    }
    return `${baseStatus} · ${this.getName()}`;
  }

  async generateResponses() {
    if (!this.editor.llm) {
      throw new Error("LLM not configured");
    }

    const lines = this.editor.textarea.value.split("\n");
    let modified = false;

    try {
      for (let i = 0; i < lines.length; i++) {
        if (!this.isGenerating) {
          console.log("Generation cancelled by user");
          break;
        }

        if (lines[i].startsWith(this.editor.llmTriggerPrefix)) {
          const prompt = lines[i].substring(3);
          let hasResponse = false;

          // Check for existing responses
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].startsWith(this.editor.llmResponsePrefix)) {
              hasResponse = true;
              break;
            }
            if (lines[j].startsWith(this.editor.llmTriggerPrefix)) {
              break;
            }
          }

          if (!hasResponse) {
            modified = true;
            let generatedText = "";

            try {
              await this.editor.llm.generateText(prompt, (token) => {
                if (!this.isGenerating) return;

                this.editor.llmCharCount += token.length;
                generatedText += token;
                lines[i] = `${this.editor.llmTriggerPrefix}${prompt}\n\n> ${
                  generatedText
                }`;
                this.editor.setContent(lines.join("\n"));
              });
            } catch (error) {
              if (this.isGenerating) {
                lines[i] = `${this.editor.llmTriggerPrefix}${
                  prompt
                }\n\n> error: ${error.message}`;
                throw error;
              }
            }
          }
        }
      }
    } finally {
      if (modified) {
        this.editor.setContent(lines.join("\n"));
      }
      this.editor.setState(new EditState(this.editor));
    }
  }

  handleKeyboardShortcuts(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      this.isGenerating = false;
      this.editor.updateStatusBar(); // Provide immediate feedback
      return true;
    }
    return false;
  }
}

// EditState: the user sees the textarea and can type text
class EditState extends EditorState {
  getName() {
    return "E";
  }
  enterState() {
    console.log("mode: edit");
    this.editor.textarea.style.display = "block";
    this.editor.preview.style.display = "none";
    this.editor.textarea.focus();
  }

  async handleKeyboardShortcuts(e) {
    if (e.ctrlKey && e.key === "g") {
      e.preventDefault();
      this.editor.setState(new GenerateState(this.editor));
      return true;
    }
    if (e.ctrlKey && e.key == "p") {
      e.preventDefault();
      this.editor.setState(new PreviewState(this.editor));
      return true;
    }
    if ((e.ctrlKey && e.key == "h") || e.key == "F1") {
      e.preventDefault();
      this.editor.setState(new HelpState(this.editor));
      return true;
    }

    // Only count single alphanumeric keystrokes
    if (!e.ctrlKey && !e.altKey && e.key.length === 1 && /[\w\s]/.test(e.key)) {
      this.editor.keystrokeCount++;
    }
    return false;
  }
}

// PreviewState: the user sees a rendering of the markdown content
class PreviewState extends EditorState {
  getName() {
    return "P";
  }
  enterState() {
    console.log(
      `mode: preview (compiling and rendering ${
        this.editor.textarea.value.length
      } bytes)`,
    );
    this.editor.textarea.style.display = "none";
    this.editor.preview.style.display = "block";
    this.editor.preview.innerHTML = marked.parse(this.editor.textarea.value);
  }
  handleKeyboardShortcuts(e) {
    if ((e.ctrlKey && e.key == "p") || e.key == "Escape") {
      e.preventDefault();
      this.editor.setState(new EditState(this.editor));
      return true;
    }
    if ((e.ctrlKey && e.key == "h") || e.key == "F1") {
      e.preventDefault();
      this.editor.setState(new HelpState(this.editor));
      return true;
    }
    return false;
  }
}

// HelpState: where the user sees a rendered help text
class HelpState extends EditorState {
  getName() {
    return "H";
  }
  enterState() {
    console.log("mode: help");
    this.savedContent = this.editor.textarea.value;
    this.editor.textarea.style.display = "none";
    this.editor.preview.style.display = "block";
    // TODO: apply some custom nice looking stylesheet for help
    this.editor.preview.innerHTML = marked.parse(this.editor.helpText);
  }
  exitState() {
    this.editor.textarea.value = this.savedContent;
  }
  handleKeyboardShortcuts(e) {
    if ((e.ctrlKey && e.key === "h") || e.key === "Escape") {
      e.preventDefault();
      this.editor.setState(new EditState(this.editor));
      return true;
    }
    return false;
  }
}

// Editor implements the basic editing function for NOTER.
class Editor {
  constructor(containerId, llm = null) {
  #pdf_doc;
  #pdf_font_style;
  #pdf_page_width;

    this.container = document.getElementById(containerId);
    // Store original textarea content when help is shown (TODO: do we need
    // this at all)
    this.savedContent = "";
    // typingDelay and typePause are only for the intro animation
    this.typingDelay = 30;
    this.typingPause = 1200;
    // keystrokeCount counts the total number of keystrokes
    this.keystrokeCount = 0;
    this.llmCharCount = 0;

    this.llm = llm;
    if (this.llm) {
      this.llm
        .checkModelAvailability()
        .then(() => this.updateStatusBar())
        .catch((error) => console.warn("model check failed:", error));
    }

    this.llmTriggerPrefix = ":: ";
    this.llmResponsePrefix = "> ";
    // help text in markdown format
    this.helpText = `# NOTER Help

## Basic Usage
* Type your notes in the editor
* Markdown formatting is supported

## Keyboard Shortcuts
* **CTRL-n**: Create a New file
* **CTRL-o**: Open a file
* **CTRL-p**: Toggle preview mode
* **CTRL-h** or **F1**: Toggle this help view
* **CTRL-g**: Generate text for editor prompts
* **CTRL-+**: Increase font size
* **CTRL--**: Decrease font size
* **CTRL-s**: Save the file
* **CTRL-e**: Export notes to PDF

## Markdown Tips
* Use # for headers
* Use * or - for bullet points
* Use ** for bold text
* Use * for italic text
* Use \`code\` for inline code
* Use \`\`\` for code blocks

## Status Bar
The status bar shows:
* Character count
* Cursor position (row:column)
* Current font size`;

    this.initializeElements();
    this.initializeEventListeners();
    // Set the first state
    this.state = new EditState(this);
    this.state.enterState();
    this.updateStatusBar();
    const { jsPDF } = window.jspdf;
    this.#pdf_doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4", // Possible values: 'a3', 'a4' (default), 'a5', 'letter', 'legal'
    });
    this.#pdf_page_width = this.#pdf_doc.internal.pageSize.width;
    this.#pdf_font_style = "Arial";
  }

  // attach DOM elements to HTML
  initializeElements() {
    // create textarea
    this.textarea = document.createElement("textarea");
    this.textarea.setAttribute("spellcheck", "false");
    this.textarea.setAttribute(
      "placeholder",
      "Let's go … and type CTRL-p to toggle preview, and CTRL-h for help",
    );
    this.textarea.id = "note-textarea";

    // create preview div
    this.preview = document.createElement("div");
    this.preview.className = "preview";
    this.preview.id = "preview";
    this.preview.style.display = "none";

    // create status bar
    this.statusBar = document.createElement("div");
    this.statusBar.className = "status-bar";
    this.statusBar.id = "status-bar";

    // append elements to container
    this.container.appendChild(this.textarea);
    this.container.appendChild(this.preview);
    this.container.appendChild(this.statusBar);
  }

  // initializeEventListeners attaches event listener to elements, e.g. we want
  // to update the status bar at every keystroke.
  initializeEventListeners() {
    // text-related events
    this.textarea.addEventListener("input", () => this.updateStatusBar());
    this.textarea.addEventListener("keyup", () => this.updateStatusBar());
    this.textarea.addEventListener("click", () => this.updateStatusBar());
    this.textarea.addEventListener("select", () => this.updateStatusBar());
    this.textarea.addEventListener("mousemove", () => this.updateStatusBar());

    // keyboard shortcuts
    document.addEventListener("keydown", (e) =>
      this.handleKeyboardShortcuts(e),
    );
  }

  // handleKeyboardShortcuts takes and event and dispatches various actions.
  handleKeyboardShortcuts(e) {
    if (e.ctrlKey && e.key === "p" && !this.isHelpMode) {
      e.preventDefault();
      this.togglePreviewMode();
    } else if ((e.ctrlKey && e.key === "h") || e.key === "F1") {
      e.preventDefault();
      this.toggleHelpMode();
    } else if (e.ctrlKey && (e.key === "=" || e.key === "+")) {
      e.preventDefault();
      this.changeFontSize(1);
    } else if (e.ctrlKey && e.key === "-") {
      e.preventDefault();
      this.changeFontSize(-1);
    } else if (e.ctrlKey && e.key === "e") {
      e.preventDefault();
      this.exportMarkdown();
    }
  }

  /* the status bar can track some basic textarea info, later also indicate API
   * access to LLM and other information */
  updateStatusBar() {
    const charCount = this.textarea.value.length;
    const text = this.textarea.value.substring(0, this.textarea.selectionStart);
    const row = text.split("\n").length;
    const column = text.split("\n").pop().length + 1;
    const fontSize = window.getComputedStyle(this.textarea).fontSize;
    let mode = "E";
    if (this.isPreviewMode) {
      mode = "P";
    }
    if (this.isHelpMode) {
      mode = "H";
    }
    this.statusBar.textContent = `${charCount} · ${row}:${column} · ${fontSize} · ${mode}`;
  }

  // attach DOM elements to HTML
  initializeElements() {
    // create textarea
    this.textarea = document.createElement("textarea");
    this.textarea.setAttribute("spellcheck", "false");
    this.textarea.setAttribute(
      "placeholder",
      "Let's go - CTRL-h for keyboard shortcuts",
    );
    this.textarea.id = "note-textarea";

    // create preview div
    this.preview = document.createElement("div");
    this.preview.className = "preview";
    this.preview.id = "preview";
    this.preview.style.display = "none";

    // create status bar
    this.statusBar = document.createElement("div");
    this.statusBar.className = "status-bar";
    this.statusBar.id = "status-bar";

    // append elements to container
    this.container.appendChild(this.textarea);
    this.container.appendChild(this.preview);
    this.container.appendChild(this.statusBar);
  }

  // initializeEventListeners attaches event listener to elements, e.g. we
  // want to update the status bar at every keystroke.
  initializeEventListeners() {
    // text-related events
    this.textarea.addEventListener("input", () => this.updateStatusBar());
    this.textarea.addEventListener("keyup", () => this.updateStatusBar());
    this.textarea.addEventListener("click", () => this.updateStatusBar());
    this.textarea.addEventListener("select", () => this.updateStatusBar());
    this.textarea.addEventListener("mousemove", () => this.updateStatusBar());

    // keyboard shortcuts
    document.addEventListener("keydown", (e) =>
      this.handleKeyboardShortcuts(e),
    );
  }

  // setState is called on a state transition, currently on a keyboard
  // shortcut
  setState(newState) {
    this.state.exitState();
    this.state = newState;
    this.state.enterState();
    this.updateStatusBar();
  }

  // handleKeyboardShortcuts takes and event and dispatches various actions.
  handleKeyboardShortcuts(e) {
    if (this.state.handleKeyboardShortcuts(e)) {
      return; // state already handled the shortcut
    }
    // handle common shortcuts across all states
    if (e.ctrlKey && (e.key === "=" || e.key === "+")) {
      e.preventDefault();
      this.changeFontSize(1);
    } else if (e.ctrlKey && e.key === "-") {
      e.preventDefault();
      this.changeFontSize(-1);
    }
  }

  // Helper method to scroll to bottom
  scrollToBottom() {
    this.textarea.scrollTop = this.textarea.scrollHeight;
  }

  // Get the base status bar text without state-specific additions
  getBaseStatus() {
    const charCount = this.textarea.value.length;
    const text = this.textarea.value.substring(0, this.textarea.selectionStart);
    const row = text.split("\n").length;
    const column = text.split("\n").pop().length + 1;
    const fontSize = window.getComputedStyle(this.textarea).fontSize;

    let status = `${charCount} · ${row}:${column} · H:${
      this.keystrokeCount
    } · <span class="llm-count">M:${this.llmCharCount}</span> · ${fontSize}`;

    // Add model info or warning
    if (this.llm) {
      const modelStatus = this.llm.getModelStatus();
      if (modelStatus) {
        status += ` · <span class="model-name">${modelStatus.currentModel}</span>`;
      } else {
        status += ` · <span class="model-warning">no model</span>`;
      }
    }
    return status;
  }

  updateStatusBar() {
    if (this.state.getStatusText) {
      this.statusBar.innerHTML = this.state.getStatusText(); // Use innerHTML instead of textContent
    } else {
      this.statusBar.innerHTML = `${this.getBaseStatus()} · ${this.state.getName()}`;
    }
  }

  /* font size, with some limits */
  changeFontSize(delta) {
    const currentSize = parseInt(
      window.getComputedStyle(this.textarea).fontSize,
      10,
    );
    const newSize = Math.max(10, currentSize + delta);
    this.textarea.style.fontSize = `${newSize}px`;
    this.updateStatusBar();
  }

  /* typeEffect is here for an initial typing sequence, giving an impression
   * of a autonomous typing entity */
  typeEffect(text) {
    return new Promise((resolve) => {
      let index = 0;
      const interval = setInterval(() => {
        if (index < text.length) {
          this.textarea.value += text[index];
          index++;
          this.updateStatusBar();
        } else {
          clearInterval(interval);
          const highlightStart = text.indexOf("together");
          const highlightEnd = highlightStart + "together".length;
          this.textarea.setSelectionRange(highlightStart, highlightEnd);
          this.textarea.focus();

          setTimeout(() => {
            this.textarea.setSelectionRange(0, 0);
            resolve(text);
          }, this.typingPause);
        }
      }, this.typingDelay);
    });
  }

  /* deleteEffect takes back some text, part of the initial sequence */
  deleteEffect(text) {
    return new Promise((resolve) => {
      let index = text.length;
      const interval = setInterval(() => {
        if (index > 0) {
          this.textarea.value = this.textarea.value.slice(0, -1);
          index--;
          this.updateStatusBar();
        } else {
          clearInterval(interval);
          resolve();
        }
      }, this.typingDelay);
    });
  }

  // init starts the typing intro sequence
  init() {
    this.textarea.value = "";
    const introText = "noter: write together";

    return new Promise(async (resolve) => {
      await this.typeEffect(introText);
      await this.deleteEffect(introText);
      this.textarea.focus();
      resolve();
    });
  }

  // Get the current content of the editor
  getContent() {
    return this.textarea.value;
  }

  // Set new content for the editor
  setContent(content) {
    this.textarea.value = content;
    this.updateStatusBar();
    this.scrollToBottom();
  }

  /* export the markdown code into pdf */
  exportMarkdown() {
    const pdf_margin = 5;
    const top_margin = 2;

    let max_line_width = this.#pdf_page_width - pdf_margin * 2;
    let importStream = this.textarea.value;
    let htmlContent = marked(importStream);

    const cleanHtmlContent = htmlContent.replace(/<pre><\/pre>/g, "");
    const html = cleanHtmlContent;

    let dummyDiv = document.createElement("div");
    dummyDiv.innerHTML = html;
    dummyDiv.className = "pdf-content";
    dummyDiv.style.width = `${max_line_width}px`;
    dummyDiv.style.height = "auto";
    dummyDiv.style.fontFamily = "Garamond, Arial, sans-serif";
    document.body.appendChild(dummyDiv);
    console.log(html);

    this.#pdf_doc.html(dummyDiv, {
      callback: (doc) => {
        doc.save("document.pdf");

        // clear the pdf generation caches
        document.body.removeChild(dummyDiv);
        const canvases = document.querySelectorAll("canvas");
        canvases.forEach((canvas) => {
          canvas.remove();
        });
      },
      x: pdf_margin,
      y: top_margin,
      margin: [top_margin, pdf_margin, pdf_margin, pdf_margin],
    });
  }
}

export { Editor, GenerateState, EditState, PreviewState, HelpState };
