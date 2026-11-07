import { useState } from 'react'
import type { BlockCategory, BlockDefinition, BlockItem } from './types'
import { BLOCK_DEFINITIONS } from './definitions'
import { PRESETS } from './presets'
import { Icon } from '../Icon'

interface BlockPaletteProps {
  onAddBlock: (block: BlockItem) => void
  onLoadPreset: (blocks: BlockItem[]) => void
}

const CATEGORIES: { id: BlockCategory; label: string; icon: string }[] = [
  { id: 'control', label: 'Control & Loops', icon: '🔀' },
  { id: 'variables', label: 'Variables & Math', icon: '📦' },
  { id: 'functions', label: 'Functions', icon: '⚙️' },
  { id: 'io', label: 'Print & I/O', icon: '🖨️' },
  { id: 'data', label: 'Lists & Maps', icon: '📋' },
  { id: 'structures', label: 'Stacks & Queues', icon: '📚' },
]

export function BlockPalette({ onAddBlock, onLoadPreset }: BlockPaletteProps) {
  const [activeCategory, setActiveCategory] = useState<BlockCategory>('control')
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
        <div className="palette-title">
          <Icon name="puzzle" size={14} />
          <span>Block Chunks</span>
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
              ⚡ Load Preset / Demo...
            </option>
            {PRESETS.map((preset) => (
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
              <span>{cat.icon}</span>
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
              <span className="chunk-card-notch" />
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
