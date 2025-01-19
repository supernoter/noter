// Editor implements the basic editing function for NOTER.
class Editor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.isPreviewMode = false;
    this.isHelpMode = false;
    this.savedContent = ""; // Store original content when help is shown
    this.savedPreviewMode = false; // Store original preview mode state
    this.typingDelay = 30;
    this.typingPause = 1200;

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
* **CTRL-+**: Increase font size
* **CTRL--**: Decrease font size
* **CTRL-s**: Save the file

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
    this.updateStatusBar();
  }

  // attach DOM elements to HTML
  initializeElements() {
    // create textarea
    this.textarea = document.createElement("textarea");
    this.textarea.setAttribute("spellcheck", "false");
    this.textarea.setAttribute(
      "placeholder",
      "Let's go … and type CTRL-p to toggle preview, and CTRL-h for help"
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
      this.handleKeyboardShortcuts(e)
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

  /* toggles between edit and preview mode */
  togglePreviewMode() {
    if (this.isHelpMode) {
      return; // prevent preview toggle while in help mode
    }

    this.isPreviewMode = !this.isPreviewMode;
    if (this.isPreviewMode) {
      this.textarea.style.display = "none";
      this.preview.style.display = "block";
      this.preview.innerHTML = marked.parse(this.textarea.value);
    } else {
      this.textarea.style.display = "block";
      this.preview.style.display = "none";
      this.textarea.focus();
    }
    this.updateStatusBar();
  }

  toggleHelpMode() {
    this.isHelpMode = !this.isHelpMode;

    if (this.isHelpMode) {
      // save current state
      this.savedContent = this.textarea.value;
      this.savedPreviewMode = this.isPreviewMode;

      // force preview-like mode for help
      this.textarea.style.display = "none";
      this.preview.style.display = "block";
      this.preview.innerHTML = marked.parse(this.helpText);
    } else {
      // restore previous state
      this.textarea.value = this.savedContent;

      // restore previous preview mode
      if (this.savedPreviewMode) {
        this.textarea.style.display = "none";
        this.preview.style.display = "block";
        this.preview.innerHTML = marked.parse(this.savedContent);
      } else {
        this.textarea.style.display = "block";
        this.preview.style.display = "none";
        this.textarea.focus();
      }

      this.isPreviewMode = this.savedPreviewMode;
    }

    this.updateStatusBar();
  }

  /* font size, with some limits */
  changeFontSize(delta) {
    const currentSize = parseInt(
      window.getComputedStyle(this.textarea).fontSize,
      10
    );
    const newSize = Math.max(10, currentSize + delta);
    this.textarea.style.fontSize = `${newSize}px`;
    this.updateStatusBar();
  }

  /* typeEffect is here for an initial typing sequence, giving an impression of
   * a autonomous typing entity */
  typeEffect(text, callback) {
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
          this.deleteEffect(text, callback);
        }, this.typingPause);
      }
    }, this.typingDelay);
  }

  /* deleteEffect takes back some text, part of the initial sequence */
  deleteEffect(text, callback) {
    let index = text.length;
    const interval = setInterval(() => {
      if (index > 0) {
        this.textarea.value = this.textarea.value.slice(0, -1);
        index--;
        this.updateStatusBar();
      } else {
        clearInterval(interval);
        callback();
      }
    }, this.typingDelay);
  }

  init() {
    this.textarea.value = "";
    const introText = "noter: write together";
    this.typeEffect(introText, () => {
      this.textarea.focus();
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
  }
}

export default Editor;
