import * as monaco from 'monaco-editor/editor/editor.api'
import 'monaco-editor/languages/definitions/python/register'
import 'monaco-editor/editor/contrib/clipboard/browser/clipboard'
import 'monaco-editor/editor/contrib/contextmenu/browser/contextmenu'
import 'monaco-editor/editor/contrib/comment/browser/comment'
import 'monaco-editor/editor/contrib/folding/browser/folding'
import 'monaco-editor/editor/contrib/indentation/browser/indentation'
import 'monaco-editor/editor/contrib/linesOperations/browser/linesOperations'
import 'monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching'
import 'monaco-editor/editor/contrib/find/browser/findController'
import 'monaco-editor/editor/contrib/multicursor/browser/multicursor'
import 'monaco-editor/editor/contrib/wordOperations/browser/wordOperations'
import 'monaco-editor/editor/contrib/tokenization/browser/tokenization'
import 'monaco-editor/editor/browser/coreCommands'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'

self.MonacoEnvironment = { getWorker: () => new EditorWorker() }

function applyTheme() {
  const light = document.documentElement.dataset.theme === 'light'
  const colors = getComputedStyle(document.documentElement)
  const token = (name: string) => colors.getPropertyValue(name).trim()
  monaco.editor.defineTheme('byteblocks', {
    base: light ? 'vs' : 'vs-dark',
    inherit: true,
    rules: [
      {
        token: 'comment',
        foreground: token('--theme-text-subtle').slice(1),
        fontStyle: 'italic',
      },
      { token: 'keyword', foreground: token('--theme-violet').slice(1) },
      { token: 'string', foreground: token('--theme-success').slice(1) },
      { token: 'number', foreground: token('--theme-warm').slice(1) },
    ],
    colors: {
      'editor.background': token('--theme-surface'),
      'editor.foreground': token('--theme-text'),
      'editorLineNumber.foreground': token('--theme-text-subtle'),
      'editorLineNumber.activeForeground': token('--theme-text'),
      'editor.lineHighlightBackground': token('--theme-surface-raised'),
      'editorCursor.foreground': token('--theme-info'),
      'editor.selectionBackground': token('--theme-selection'),
      'editor.inactiveSelectionBackground': token('--theme-surface-hover'),
      'editorIndentGuide.background1': token('--theme-border'),
      'editorIndentGuide.activeBackground1': token('--theme-border-strong'),
      'editorWidget.background': token('--theme-surface-raised'),
      'editorSuggestWidget.background': token('--theme-surface-raised'),
      'editorSuggestWidget.border': token('--theme-border'),
      focusBorder: token('--theme-info'),
    },
  })
  monaco.editor.setTheme('byteblocks')
}

export function createEditor(
  element: HTMLElement,
  value: string,
  callbacks: {
    onChange: (value: string) => void
    onCursorChange: (position: { lineNumber: number; column: number }) => void
    onRun: () => void
  },
) {
  applyTheme()
  const themeObserver = new MutationObserver(applyTheme)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  const model = monaco.editor.createModel(value, 'python')
  model.updateOptions({ tabSize: 4, insertSpaces: true })
  const instance = monaco.editor.create(element, {
    model,
    theme: 'byteblocks',
    automaticLayout: true,
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
    fontSize: 13,
    lineHeight: 24,
    padding: { top: 18, bottom: 24 },
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    renderLineHighlight: 'line',
    roundedSelection: false,
    lineNumbersMinChars: 3,
    lineDecorationsWidth: 14,
    folding: true,
    glyphMargin: false,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    contextmenu: true,
    scrollbar: {
      verticalScrollbarSize: 7,
      horizontalScrollbarSize: 7,
      useShadows: false,
    },
    tabSize: 4,
    insertSpaces: true,
    detectIndentation: false,
    ariaLabel: 'Python code',
    bracketPairColorization: { enabled: false },
    wordWrap: 'off',
  })
  const contentListener = instance.onDidChangeModelContent(() =>
    callbacks.onChange(instance.getValue()),
  )
  const cursorListener = instance.onDidChangeCursorPosition((event) =>
    callbacks.onCursorChange(event.position),
  )
  instance.addAction({
    id: 'byteblocks.run',
    label: 'Run Python code',
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      monaco.KeyMod.WinCtrl | monaco.KeyCode.Enter,
    ],
    run: callbacks.onRun,
  })
  return {
    editor: instance,
    dispose: () => {
      themeObserver.disconnect()
      contentListener.dispose()
      cursorListener.dispose()
      instance.dispose()
      model.dispose()
    },
  }
}
