import { useState, useMemo, useCallback } from 'react'
import type { BlockItem } from './types'
import { generatePython } from './generator'
import { BlockPalette } from './BlockPalette'
import { BlockNode } from './BlockNode'
import { PRESETS } from './presets'
import { Icon } from '../Icon'

interface VisualBlockEditorProps {
  onPythonChange: (code: string) => void
  onRun?: () => void
}

const STORAGE_BLOCKS_KEY = 'byteblocks.visual.blocks'

function loadSavedBlocks(): BlockItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_BLOCKS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as BlockItem[]
      if (Array.isArray(parsed) && parsed.length > 0) {
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

export function VisualBlockEditor({
  onPythonChange,
  onRun,
}: VisualBlockEditorProps) {
  const [blocks, setBlocks] = useState<BlockItem[]>(loadSavedBlocks)
  const [isMainDragOver, setIsMainDragOver] = useState(false)
  const [showPythonPreview, setShowPythonPreview] = useState(true)
  const [copied, setCopied] = useState(false)

  // Generate python code
  const generatedCode = useMemo(() => {
    return generatePython(blocks)
  }, [blocks])

  // Sync python code whenever blocks change
  const updateBlocks = useCallback(
    (newBlocks: BlockItem[]) => {
      setBlocks(newBlocks)
      try {
        localStorage.setItem(STORAGE_BLOCKS_KEY, JSON.stringify(newBlocks))
      } catch {
        // ignore
      }
      const py = generatePython(newBlocks)
      onPythonChange(py)
    },
    [onPythonChange],
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

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const next = [...blocks]
    const temp = next[index - 1]
    next[index - 1] = next[index]
    next[index] = temp
    updateBlocks(next)
  }

  const handleMoveDown = (index: number) => {
    if (index >= blocks.length - 1) return
    const next = [...blocks]
    const temp = next[index + 1]
    next[index + 1] = next[index]
    next[index] = temp
    updateBlocks(next)
  }

  const handleDuplicate = (index: number) => {
    const cloned = cloneWithNewIds(blocks[index])
    const next = [...blocks]
    next.splice(index + 1, 0, cloned)
    updateBlocks(next)
  }

  const handleDropInContainer = useCallback(
    (
      containerId: string,
      slot: 'children' | 'elseChildren',
      item: BlockItem,
    ) => {
      const clonedItem = cloneWithNewIds(item)

      const insertRecursively = (list: BlockItem[]): BlockItem[] => {
        return list.map((b) => {
          if (b.id === containerId) {
            const currentSlot = b[slot] ?? []
            return {
              ...b,
              [slot]: [...currentSlot, clonedItem],
            }
          }
          return {
            ...b,
            children: b.children ? insertRecursively(b.children) : undefined,
            elseChildren: b.elseChildren
              ? insertRecursively(b.elseChildren)
              : undefined,
          }
        })
      }

      const next = insertRecursively(blocks)
      updateBlocks(next)
    },
    [blocks, updateBlocks],
  )

  const handleClearAll = () => {
    if (
      window.confirm('Clear all blocks? This will start with a blank script.')
    ) {
      updateBlocks([])
    }
  }

  const handleCopyPython = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="visual-block-editor">
      <BlockPalette
        onAddBlock={handleAddTopLevelBlock}
        onLoadPreset={(presetBlocks) => updateBlocks(presetBlocks)}
      />

      <div className="blocks-canvas-container">
        <div className="canvas-toolbar">
          <div className="canvas-stats">
            <span className="stats-badge">
              <Icon name="puzzle" size={13} />
              <span>{blocks.length} root chunks</span>
            </span>
          </div>

          <div className="canvas-actions">
            <button
              type="button"
              className={`preview-toggle-btn ${showPythonPreview ? 'active' : ''}`}
              onClick={() => setShowPythonPreview(!showPythonPreview)}
              title="Toggle Live Python Preview"
            >
              <Icon name="code" size={13} />
              <span>{showPythonPreview ? 'Hide Python' : 'Live Python'}</span>
            </button>

            <button
              type="button"
              className="canvas-btn-ghost"
              onClick={handleClearAll}
              title="Clear all chunks"
            >
              <Icon name="clear" size={13} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <div className="canvas-split-body">
          {/* Main Visual Blocks Workspace */}
          <div
            className={`blocks-canvas ${isMainDragOver ? 'canvas-drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsMainDragOver(true)
            }}
            onDragLeave={() => setIsMainDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsMainDragOver(false)
              try {
                const raw = e.dataTransfer.getData('application/json')
                if (raw) {
                  const parsed = JSON.parse(raw) as BlockItem
                  handleAddTopLevelBlock(cloneWithNewIds(parsed))
                }
              } catch {
                // Ignore
              }
            }}
          >
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
                    Load FizzBuzz Demo
                  </button>
                  <button
                    type="button"
                    className="quick-preset-btn"
                    onClick={() => updateBlocks(PRESETS[1].blocks)}
                  >
                    Load Two Sum Demo
                  </button>
                </div>
              </div>
            ) : (
              <div className="blocks-chain">
                {blocks.map((block, idx) => (
                  <BlockNode
                    key={block.id}
                    block={block}
                    index={idx}
                    total={blocks.length}
                    onUpdate={(up) => handleUpdateBlock(idx, up)}
                    onDelete={() => handleDeleteBlock(idx)}
                    onMoveUp={() => handleMoveUp(idx)}
                    onMoveDown={() => handleMoveDown(idx)}
                    onDuplicate={() => handleDuplicate(idx)}
                    onDropInContainer={handleDropInContainer}
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
                    try {
                      const raw = e.dataTransfer.getData('application/json')
                      if (raw) {
                        const parsed = JSON.parse(raw) as BlockItem
                        handleAddTopLevelBlock(cloneWithNewIds(parsed))
                      }
                    } catch {
                      // ignore
                    }
                  }}
                >
                  <span>+ Drag chunk here to append to bottom</span>
                </div>
              </div>
            )}
          </div>

          {/* Live Generated Python Panel */}
          {showPythonPreview && (
            <div className="python-live-preview">
              <div className="preview-header">
                <div className="preview-label">
                  <span className="python-icon">Py</span>
                  <span>Generated Python</span>
                </div>
                <div className="preview-header-actions">
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
              <div className="preview-code-scroll">
                <pre className="python-code-display">
                  <code>{generatedCode || '# No code generated yet'}</code>
                </pre>
              </div>
              <div className="preview-footer">
                <span>⚡ Runs directly in browser with Pyodide</span>
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
          )}
        </div>
      </div>
    </div>
  )
}
