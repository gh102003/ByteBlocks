import { useState } from 'react'
import type { BlockCategory, BlockDefinition, BlockItem } from './types'
import { BLOCK_DEFINITIONS } from './definitions'
import { PRESETS } from './presets'
import { Icon } from '../Icon'
import { BlockIcon } from './BlockIcon'

interface BlockPaletteProps {
  onAddBlock: (block: BlockItem) => void
  onLoadPreset: (blocks: BlockItem[]) => void
  onClear: () => void
}

const CATEGORIES: { id: BlockCategory; label: string }[] = [
  { id: 'variables', label: 'Variables' },
  { id: 'maths', label: 'Maths' },
  { id: 'data', label: 'Lists' },
  { id: 'repeat', label: 'Repeat' },
  { id: 'decisions', label: 'Decide' },
  { id: 'functions', label: 'Functions' },
  { id: 'io', label: 'Say' },
  { id: 'random', label: 'Random' },
  { id: 'stacks', label: 'Stacks' },
  { id: 'queues', label: 'Queues' },
  { id: 'dictionaries', label: 'Dictionaries' },
  { id: 'comments', label: 'Comments' },
]

// These are deliberately the blocks that can be completed without typing Python.
// Older, expressive blocks remain readable in saved projects and in the Code tab.
const BEGINNER_BLOCK_TYPES = new Set([
  'for_range',
  'for_in',
  'while_loop',
  'if_condition',
  'if_else',
  'if_collection_contains',
  'break_loop',
  'function_def',
  'return_val',
  'function_call',
  'var_set',
  'var_change',
  'var_decrement',
  'math_calculate',
  'list_item_math',
  'print',
  'list_create',
  'list_append',
  'list_get',
  'list_remove',
  'dict_create',
  'dict_set',
  'dict_get',
  'dict_remove',
  'dict_keys',
  'random_integer',
  'random_choice',
  'random_shuffle',
  'stack_create',
  'stack_add',
  'stack_remove',
  'stack_peek',
  'stack_size',
  'stack_empty',
  'stack_clear',
  'queue_create',
  'queue_add',
  'queue_remove',
  'queue_peek',
  'queue_size',
  'queue_empty',
  'queue_clear',
  'comment',
])

export function BlockPalette({
  onAddBlock,
  onLoadPreset,
  onClear,
}: BlockPaletteProps) {
  const [activeCategory, setActiveCategory] =
    useState<BlockCategory>('variables')
  const [search, setSearch] = useState('')

  const createBlockFromDef = (def: BlockDefinition): BlockItem => {
    return {
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: def.type,
      ...def.defaultValues,
      children: def.isContainer ? [] : undefined,
      elseChildren: def.hasElse ? [] : undefined,
    }
  }

  const handleDragStart = (e: React.DragEvent, def: BlockDefinition) => {
    e.dataTransfer.effectAllowed = 'copy'
    const newBlock = createBlockFromDef(def)
    e.dataTransfer.setData('application/json', JSON.stringify(newBlock))
  }

  const filteredDefs = BLOCK_DEFINITIONS.filter((def) => {
    if (!BEGINNER_BLOCK_TYPES.has(def.type)) return false
    const matchesSearch =
      search.trim() === '' ||
      def.label.toLowerCase().includes(search.toLowerCase()) ||
      def.type.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      search.trim() !== '' || def.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <aside className="blocks-palette">
      <div className="palette-header">
        <div className="palette-heading-row">
          <div className="palette-title">
            <Icon name="puzzle" size={14} />
            <span>Block Chunks</span>
          </div>
          <button
            type="button"
            className="canvas-btn-ghost"
            onClick={onClear}
            title="Clear all chunks"
          >
            <Icon name="clear" size={13} />
            <span>Clear</span>
          </button>
        </div>
        <div className="preset-selector-wrapper">
          <select
            className="preset-select"
            defaultValue=""
            onChange={(e) => {
              const selected = PRESETS.find((p) => p.id === e.target.value)
              if (selected) {
                onLoadPreset(JSON.parse(JSON.stringify(selected.blocks)))
              }
              e.target.value = ''
            }}
          >
            <option value="" disabled>
              Load Preset / Demo...
            </option>
            {PRESETS.filter((preset) => preset.beginner).map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="palette-search">
        <input
          type="text"
          placeholder="Filter chunks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSearch('')}
          >
            ×
          </button>
        )}
      </div>

      {search.trim() === '' && (
        <nav className="palette-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <BlockIcon kind={cat.id} />
              <span>{cat.label}</span>
            </button>
          ))}
        </nav>
      )}

      <div className="palette-chunks-list">
        {filteredDefs.map((def) => (
          <div
            key={def.type}
            className="palette-chunk-card"
            style={
              {
                '--chunk-color': def.color,
                '--chunk-border': def.borderColor,
                '--chunk-hover': def.bgHover,
              } as React.CSSProperties
            }
            draggable
            onDragStart={(e) => handleDragStart(e, def)}
            onClick={() => onAddBlock(createBlockFromDef(def))}
            title="Click to add or drag into workspace"
          >
            <div className="chunk-card-content">
              <BlockIcon kind={def.type} />
              <span className="chunk-card-label">{def.label}</span>
            </div>
            <button
              type="button"
              className="chunk-add-btn"
              onClick={(e) => {
                e.stopPropagation()
                onAddBlock(createBlockFromDef(def))
              }}
              title="Add block"
            >
              <Icon name="plus" size={12} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  )
}
