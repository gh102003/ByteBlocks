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

monaco.editor.defineTheme('byteblocks', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '747E87', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'C8A4E4' },
    { token: 'string', foreground: 'A8C78A' },
    { token: 'number', foreground: 'E6BD86' },
    { token: 'identifier', foreground: 'D5DBE2' },
    { token: 'delimiter', foreground: '9FA9B6' },
    { token: 'type.identifier', foreground: '8DBCD3' },
  ],
  colors: {
    'editor.background': '#15171B',
    'editor.foreground': '#D5DBE2',
    'editorLineNumber.foreground': '#515760',
    'editorLineNumber.activeForeground': '#B4BFC9',
    'editor.lineHighlightBackground': '#1B1E24',
    'editorCursor.foreground': '#B8E8CC',
    'editor.selectionBackground': '#35483E',
    'editor.inactiveSelectionBackground': '#2B3534',
    'editorIndentGuide.background1': '#252A31',
    'editorIndentGuide.activeBackground1': '#414951',
    'editorWidget.background': '#20242B',
    'editorSuggestWidget.background': '#20242B',
    'editorSuggestWidget.border': '#333A43',
    focusBorder: '#667D72',
    'scrollbarSlider.background': '#5D667533',
    'scrollbarSlider.hoverBackground': '#5D667555',
  },
})

export function createEditor(
  element: HTMLElement,
  value: string,
  callbacks: {
    onChange: (value: string) => void
    onCursorChange: (position: { lineNumber: number; column: number }) => void
    onRun: () => void
  },
) {
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
      contentListener.dispose()
      cursorListener.dispose()
      instance.dispose()
      model.dispose()
    },
  }
}
