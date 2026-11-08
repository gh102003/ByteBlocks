import { useState, useMemo, useCallback, useEffect } from 'react'
import { CodeEditor } from '../CodeEditor'
import type { BlockItem } from './types'
import { generatePython } from './generator'
import { BlockPalette } from './BlockPalette'
import { BlockNode } from './BlockNode'
import { PRESETS } from './presets'
import { Icon } from '../Icon'

interface VisualBlockEditorProps {
  onPythonChange: (code: string) => void
  onBlocksChange?: (blocks: BlockItem[]) => void
  onRun: () => void
  mode: 'blocks' | 'code'
  highlightedLine?: number
  code: string
  onEditCode: (code: string) => void
  onSelectMode: (mode: 'blocks' | 'code') => void
  onCursorChange: (position: { lineNumber: number; column: number }) => void
}

// Versioned so the beginner-friendly starter replaces the old FizzBuzz default.
const STORAGE_BLOCKS_KEY = 'byteblocks.visual.blocks.v2'

function loadSavedBlocks(): BlockItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_BLOCKS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as BlockItem[]
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {
    // fallback
  }
  return PRESETS[0].blocks // Default to FizzBuzz
}

function cloneWithNewIds(block: BlockItem): BlockItem {
  const newId = `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  return {
    ...block,
    id: newId,
    children: block.children?.map(cloneWithNewIds),
    elseChildren: block.elseChildren?.map(cloneWithNewIds),
  }
}

function invalidConditionalPlacement(block: BlockItem, previous?: BlockItem) {
  if (block.type === 'else_if' || block.type === 'else_clause')
    return !['if_condition', 'else_if'].includes(previous?.type ?? '')
  return false
}

function findVariableNames(blocks: BlockItem[]): {
  names: string[]
  lists: string[]
  stacks: string[]
  queues: string[]
} {
  const names = new Set<string>()
  const lists = new Set<string>()
  const stacks = new Set<string>()
  const queues = new Set<string>()
  const addName = (name: string | undefined) => {
    const trimmed = name?.trim()
    if (trimmed && /^[A-Za-z_]\w*$/.test(trimmed)) names.add(trimmed)
  }
  const addFunctionParameter = (name: string | undefined) => {
    const trimmed = name?.trim()
    if (!trimmed || !/^[A-Za-z_]\w*$/.test(trimmed)) return
    names.add(trimmed)
    // Parameters do not carry runtime type information. Make them available to
    // each collection picker so callers can pass a list, stack, or queue in.
    lists.add(trimmed)
    stacks.add(trimmed)
    queues.add(trimmed)
  }
  const visit = (items: BlockItem[]) =>
    items.forEach((block) => {
      addName(block.varName)
      if (block.type === 'list_create' && block.varName?.trim())
        lists.add(block.varName.trim())
      if (block.type === 'stack_create' && block.varName?.trim())
        stacks.add(block.varName.trim())
      if (block.type === 'queue_create' && block.varName?.trim())
        queues.add(block.varName.trim())
      addName(block.itemVar)
      block.functionArgs?.forEach(addFunctionParameter)
      block.funcArgs?.split(',').forEach(addFunctionParameter)
      if (block.children) visit(block.children)
      if (block.elseChildren) visit(block.elseChildren)
    })
  visit(blocks)
  return {
    names: [...names],
    lists: [...lists],
    stacks: [...stacks],
    queues: [...queues],
  }
}

function PythonPreview({ code }: { code: string }) {
  const [highlighted, setHighlighted] = useState<{
    code: string
    html: string
  }>()

  useEffect(() => {
    let cancelled = false
    const highlight = () => {
      void import('../../editor')
        .then(({ colorizePython }) => colorizePython(code))
        .then((html) => {
          if (!cancelled) setHighlighted({ code, html })
        })
        .catch(() => {
          if (!cancelled) setHighlighted(undefined)
        })
    }
    highlight()
    const observer = new MutationObserver(highlight)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [code])

  return (
    <pre className="python-code-display">
      {highlighted?.code === code ? (
        <code dangerouslySetInnerHTML={{ __html: highlighted.html }} />
      ) : (
        <code>{code}</code>
      )}
    </pre>
  )
}

function PythonLogo() {
  return (
    <svg className="python-logo" viewBox="0 0 32 32" aria-hidden="true">
      <path
        fill="#3776ab"
        d="M16 3c-7 0-6.6 3-6.6 3v3h6.8v1H6.7S2 9.5 2 16s4.1 6.3 4.1 6.3h2.4v-3.4s-.1-4.1 4-4.1h6.8s3.8.1 3.8-3.7V6.7S23 3 16 3Zm-3.8 3.1a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z"
      />
      <path
        fill="#ffd343"
        d="M16 29c7 0 6.6-3 6.6-3v-3h-6.8v-1h9.5s4.7.5 4.7-6S25.9 9.7 25.9 9.7h-2.4v3.4s.1 4.1-4 4.1h-6.8s-3.8-.1-3.8 3.7v4.4S9 29 16 29Zm3.8-3.1a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"
      />
    </svg>
  )
}

export function VisualBlockEditor({
  onPythonChange,
  onBlocksChange,
  onRun,
  mode,
  code,
  onEditCode,
  onSelectMode,
  onCursorChange,
  highlightedLine,
}: VisualBlockEditorProps) {
  const [blocks, setBlocks] = useState<BlockItem[]>(loadSavedBlocks)
  const [isMainDragOver, setIsMainDragOver] = useState(false)
  const [copied, setCopied] = useState(false)

  // Generate python code
  const generatedCode = useMemo(() => {
    return generatePython(blocks)
  }, [blocks])
  useEffect(() => {
    if (mode === 'blocks') onPythonChange(generatedCode)
  }, [mode, generatedCode, onPythonChange])
  const variables = useMemo(() => findVariableNames(blocks), [blocks])

  useEffect(() => {
    onBlocksChange?.(blocks)
  }, [blocks, onBlocksChange])

  // Sync python code whenever blocks change
  const updateBlocks = useCallback(
    (newBlocks: BlockItem[]) => {
      setBlocks(newBlocks)
      onBlocksChange?.(newBlocks)
      try {
        localStorage.setItem(STORAGE_BLOCKS_KEY, JSON.stringify(newBlocks))
      } catch {
        // ignore
      }
    },
    [onBlocksChange],
  )

  const handleAddTopLevelBlock = (block: BlockItem) => {
    updateBlocks([...blocks, block])
  }

  const handleUpdateBlock = (index: number, updated: BlockItem) => {
    const next = [...blocks]
    next[index] = updated
    updateBlocks(next)
  }

  const handleDeleteBlock = (index: number) => {
    const next = [...blocks]
    next.splice(index, 1)
    updateBlocks(next)
  }

  const handleDuplicate = (index: number) => {
    const cloned = cloneWithNewIds(blocks[index])
    const next = [...blocks]
    next.splice(index + 1, 0, cloned)
    updateBlocks(next)
  }

  const handleDrop = (
    transfer: DataTransfer,
    destination: {
      targetId?: string
      after?: boolean
      containerId?: string
      slot?: 'children' | 'elseChildren'
    },
  ) => {
    try {
      const sourceId = transfer.getData('application/x-byteblocks-id')
      const raw = transfer.getData('application/json')
      if (!sourceId && !raw) return

      let moving: BlockItem | undefined
      const remove = (list: BlockItem[]): BlockItem[] =>
        list.flatMap((block) => {
          if (block.id === sourceId) {
            moving = block
            return []
          }
          return [
            {
              ...block,
              children: block.children && remove(block.children),
              elseChildren: block.elseChildren && remove(block.elseChildren),
            },
          ]
        })
      const remaining = sourceId ? remove(blocks) : blocks
      const item = sourceId
        ? moving
        : cloneWithNewIds(JSON.parse(raw) as BlockItem)
      if (!item) return

      // A container cannot be dropped into itself or any of its descendants.
      const contains = (block: BlockItem, id: string): boolean =>
        block.id === id ||
        [...(block.children ?? []), ...(block.elseChildren ?? [])].some(
          (child) => contains(child, id),
        )
      if (
        (destination.targetId && contains(item, destination.targetId)) ||
        (destination.containerId && contains(item, destination.containerId))
      )
        return

      let inserted = false
      const insert = (list: BlockItem[]): BlockItem[] => {
        const result: BlockItem[] = []
        for (const block of list) {
          if (block.id === destination.targetId && !destination.after) {
            result.push(item)
            inserted = true
          }
          let next = block
          if (block.id === destination.containerId && destination.slot) {
            next = {
              ...block,
              [destination.slot]: [...(block[destination.slot] ?? []), item],
            }
            inserted = true
          } else {
            next = {
              ...block,
              children: block.children && insert(block.children),
              elseChildren: block.elseChildren && insert(block.elseChildren),
            }
          }
          result.push(next)
          if (block.id === destination.targetId && destination.after) {
            result.push(item)
            inserted = true
          }
        }
        return result
      }
      const next =
        destination.targetId || destination.containerId
          ? insert(remaining)
          : [...remaining, item]
      if (!destination.targetId && !destination.containerId) inserted = true
      if (inserted) updateBlocks(next)
    } catch {
      // Ignore invalid drag data.
    }
  }

  const handleClearAll = () => {
    if (
      window.confirm('Clear all blocks? This will start with a blank script.')
    ) {
      updateBlocks([])
    }
  }

  const handleCopyPython = async () => {
    try {
      await navigator.clipboard.writeText(
        mode === 'code' ? code : generatedCode,
      )
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="visual-block-editor">
      <datalist id="byteblocks-variables">
        {variables.names.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <div
        className={`palette-mode ${mode === 'code' ? 'blocks-disabled' : ''}`}
        inert={mode === 'code'}
      >
        <BlockPalette
          onAddBlock={handleAddTopLevelBlock}
          onLoadPreset={(presetBlocks) => updateBlocks(presetBlocks)}
          onClear={handleClearAll}
        />
      </div>

      <div className="blocks-canvas-container">
        <div className="canvas-split-body">
          {/* Main Visual Blocks Workspace */}
          <div
            className={`blocks-canvas ${isMainDragOver ? 'canvas-drag-over' : ''} ${mode === 'code' ? 'blocks-disabled' : ''}`}
            inert={mode === 'code'}
            onDragOver={(e) => {
              e.preventDefault()
              setIsMainDragOver(true)
            }}
            onDragLeave={() => setIsMainDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsMainDragOver(false)
              handleDrop(e.dataTransfer, {})
            }}
          >
            <div className="canvas-label" aria-hidden="true">
              <span>BLOCKS / BUILD</span>
              <span>01</span>
            </div>
            {blocks.length === 0 ? (
              <div className="empty-canvas-state">
                <div className="empty-icon">🧩</div>
                <h3>Drag & Drop Scratch Chunks Here</h3>
                <p>
                  Click any chunk on the left or drag it in to begin crafting
                  your Python code visually!
                </p>
                <div className="empty-actions">
                  <button
                    type="button"
                    className="quick-preset-btn"
                    onClick={() => updateBlocks(PRESETS[0].blocks)}
                  >
                    Load Hello Starter
                  </button>
                  <button
                    type="button"
                    className="quick-preset-btn"
                    onClick={() => updateBlocks(PRESETS[1].blocks)}
                  >
                    Load List Check
                  </button>
                </div>
              </div>
            ) : (
              <div className="blocks-chain">
                {blocks.map((block, idx) => (
                  <BlockNode
                    key={block.id}
                    block={block}
                    onUpdate={(up) => handleUpdateBlock(idx, up)}
                    onDelete={() => handleDeleteBlock(idx)}
                    onDuplicate={() => handleDuplicate(idx)}
                    onDropBlock={handleDrop}
                    variableNames={variables.names}
                    listNames={variables.lists}
                    stackNames={variables.stacks}
                    queueNames={variables.queues}
                    invalidConditionalPlacement={invalidConditionalPlacement(
                      block,
                      blocks[idx - 1],
                    )}
                  />
                ))}

                <div
                  className="add-chunk-dropzone"
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDrop(e.dataTransfer, {})
                  }}
                >
                  <span>+ Drag chunk here to append to bottom</span>
                </div>
              </div>
            )}
          </div>

          {/* Live Generated Python Panel */}
          {mode === 'code' && (
            <button
              type="button"
              className="editor-dismiss-layer"
              onClick={() => onSelectMode('blocks')}
              aria-label="Close Python editor and return to blocks"
            />
          )}
          {
            <div
              className={`python-live-preview ${mode === 'code' ? 'python-editor-active' : ''}`}
            >
              <div className="preview-header">
                <div className="preview-label">
                  <PythonLogo />
                  <span>
                    {mode === 'blocks' ? 'Generated Python' : 'Python editor'}
                  </span>
                </div>
                <div className="preview-header-actions">
                  <button
                    type="button"
                    className="copy-py-btn"
                    onClick={() =>
                      onSelectMode(mode === 'blocks' ? 'code' : 'blocks')
                    }
                    aria-label={
                      mode === 'blocks' ? 'Open Python editor' : 'Edit blocks'
                    }
                  >
                    <Icon
                      name={mode === 'blocks' ? 'code' : 'puzzle'}
                      size={12}
                    />
                    <span>{mode === 'blocks' ? 'Edit' : 'Blocks'}</span>
                  </button>
                  <button
                    type="button"
                    className="copy-py-btn"
                    onClick={handleCopyPython}
                    title="Copy Python Code"
                  >
                    <Icon name={copied ? 'check' : 'copy'} size={12} />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              {mode === 'blocks' ? (
                <button
                  type="button"
                  className="preview-code-scroll preview-edit-trigger"
                  onClick={() => onSelectMode('code')}
                  aria-label="Edit Python code"
                >
                  <PythonPreview
                    code={generatedCode || '# No code generated yet'}
                  />
                </button>
              ) : (
                <CodeEditor
                  highlightedLine={highlightedLine}
                  value={code}
                  onChange={onEditCode}
                  onCursorChange={onCursorChange}
                  onRun={onRun}
                />
              )}
              <div className="preview-footer">
                <span>
                  {mode === 'blocks'
                    ? 'Blocks generate this Python. Use Edit to make code-only changes.'
                    : 'Python edits are saved as code only and cannot become blocks.'}
                </span>
                {onRun && (
                  <button
                    type="button"
                    className="preview-run-btn"
                    onClick={onRun}
                    title="Run with Pyodide"
                  >
                    <Icon name="play" size={12} />
                    <span>Run</span>
                  </button>
                )}
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  )
}
