import { useState, useMemo, useCallback, useEffect } from 'react'
import type { BlockItem } from './types'
import { generatePython } from './generator'
import { BlockPalette } from './BlockPalette'
import { BlockNode } from './BlockNode'
import { PRESETS } from './presets'
import { Icon } from '../Icon'

interface VisualBlockEditorProps {
  onPythonChange: (code: string) => void
  onBlocksChange?: (blocks: BlockItem[]) => void
  onRun?: () => void
}

// Versioned so the beginner-friendly starter replaces the old FizzBuzz default.
const STORAGE_BLOCKS_KEY = 'byteblocks.visual.blocks.v2'

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
  const visit = (items: BlockItem[]) =>
    items.forEach((block) => {
      if (block.varName?.trim() && /^[A-Za-z_]\w*$/.test(block.varName.trim()))
        names.add(block.varName.trim())
      if (block.type === 'list_create' && block.varName?.trim())
        lists.add(block.varName.trim())
      if (block.type === 'stack_create' && block.varName?.trim())
        stacks.add(block.varName.trim())
      if (block.type === 'queue_create' && block.varName?.trim())
        queues.add(block.varName.trim())
      if (block.itemVar?.trim() && /^[A-Za-z_]\w*$/.test(block.itemVar.trim()))
        names.add(block.itemVar.trim())
      if (block.children) visit(block.children)
      if (block.elseChildren) visit(block.elseChildren)
    })
  visit(blocks)
  return {
    names: [...names].sort(),
    lists: [...lists].sort(),
    stacks: [...stacks].sort(),
    queues: [...queues].sort(),
  }
}

export function VisualBlockEditor({
  onPythonChange,
  onBlocksChange,
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
  const variables = useMemo(() => findVariableNames(blocks), [blocks])

  useEffect(() => {
    onBlocksChange?.(blocks)
  }, [blocks, onBlocksChange])

  useEffect(() => {
    onPythonChange(generatedCode)
  }, [generatedCode, onPythonChange])

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
      await navigator.clipboard.writeText(generatedCode)
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
              handleDrop(e.dataTransfer, {})
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
