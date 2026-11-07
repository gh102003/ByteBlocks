import { useEffect, useRef, useState } from 'react'
import type { editor } from 'monaco-editor'

type Props = {
  value: string
  onChange: (value: string) => void
  onCursorChange: (position: { lineNumber: number; column: number }) => void
  onRun: () => void
}

export function CodeEditor(props: Props) {
  const container = useRef<HTMLDivElement>(null)
  const instance = useRef<editor.IStandaloneCodeEditor | null>(null)
  const callbacks = useRef(props)
  const [error, setError] = useState(false)

  useEffect(() => {
    callbacks.current = props
  })

  useEffect(() => {
    let cancelled = false
    let dispose: (() => void) | undefined
    void import('../editor')
      .then(({ createEditor }) => {
        if (cancelled || !container.current) return
        const editorInstance = createEditor(
          container.current,
          callbacks.current.value,
          {
            onChange: (value) => callbacks.current.onChange(value),
            onCursorChange: (position) =>
              callbacks.current.onCursorChange(position),
            onRun: () => callbacks.current.onRun(),
          },
        )
        instance.current = editorInstance.editor
        dispose = editorInstance.dispose
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
      dispose?.()
      instance.current = null
    }
  }, [])

  useEffect(() => {
    if (instance.current && instance.current.getValue() !== props.value)
      instance.current.setValue(props.value)
  }, [props.value])

  return (
    <div className="code-editor-container">
      {error ? (
        <div className="editor-fallback">
          <p>
            The full editor couldn’t load. You can still edit and run Python
            below.
          </p>
          <textarea
            aria-label="Python code"
            spellCheck={false}
            value={props.value}
            onChange={(event) => props.onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                props.onRun()
              }
            }}
          />
        </div>
      ) : (
        <div
          className="code-editor"
          ref={container}
          aria-label="Python editor"
        />
      )}
    </div>
  )
}
