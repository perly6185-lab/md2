/**
 * Verify extension.js loads and activate() registers commands (vscode API mocked).
 */
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const vscodeRoot = path.resolve(__dirname, `..`)

const registered = new Map()
const markdownDocument = {
  languageId: `markdown`,
  fileName: `fixture.md`,
  getText: () => `# Hello VSCode\n\n[link](https://example.com)`,
}
const markdownEditor = { document: markdownDocument }
let createdPanel

const vscodeMock = {
  commands: {
    registerCommand(id, handler) {
      registered.set(id, handler)
      return { dispose() {} }
    },
    executeCommand() {},
  },
  window: {
    activeTextEditor: markdownEditor,
    registerTreeDataProvider() {},
    onDidChangeActiveTextEditor() {
      return { dispose() {} }
    },
    createWebviewPanel(_viewType, title) {
      createdPanel = {
        title,
        webview: { html: `` },
        onDidDispose() {
          return { dispose() {} }
        },
        reveal() {},
      }
      return createdPanel
    },
    showErrorMessage() {},
  },
  EventEmitter: class {
    event = () => ({ dispose() {} })
    fire() {}
  },
  TreeItem: class {
    constructor(label, state) {
      this.label = label
      this.collapsibleState = state
    }
  },
  TreeItemCollapsibleState: { None: 0, Expanded: 1 },
  ThemeIcon: class {},
  ViewColumn: { Two: 2 },
  workspace: {
    onDidChangeTextDocument() {
      return { dispose() {} }
    },
    workspaceState: { get: () => undefined, update: () => {} },
  },
  ExtensionContext: class {},
}

const require = createRequire(import.meta.url)
const Module = require(`node:module`)
const originalLoad = Module._load
const previewRendererPath = require.resolve(path.join(vscodeRoot, `dist`, `previewRenderer.js`))
Module._load = function (request, parent, isMain) {
  if (request === `vscode`)
    return vscodeMock
  return originalLoad.call(this, request, parent, isMain)
}

const ext = require(path.join(vscodeRoot, `dist`, `extension.js`))
const context = {
  subscriptions: [],
  workspaceState: { get: () => undefined, update: async () => {} },
}
ext.activate(context)

const required = [`markdown.preview`, `markdown.toggleCiteStatus`]
for (const cmd of required) {
  if (!registered.has(cmd)) {
    throw new Error(`Missing registered command: ${cmd}`)
  }
}

if (require.cache[previewRendererPath]) {
  throw new Error(`previewRenderer loaded during activate(); expected lazy preview loading`)
}

registered.get(`markdown.preview`)()

if (!require.cache[previewRendererPath]) {
  throw new Error(`previewRenderer was not loaded when markdown.preview ran`)
}

if (!createdPanel?.webview.html.includes(`Hello VSCode`)) {
  throw new Error(`markdown.preview did not render active markdown into the webview`)
}

if (!createdPanel.webview.html.includes(`--md-primary-color`)) {
  throw new Error(`markdown.preview did not include preview CSS variables`)
}

console.log(`✓ activate() registered ${registered.size} commands`)
console.log(`✓ markdown.preview is available`)
console.log(`✓ markdown.preview lazy-loads renderer and writes webview HTML`)
