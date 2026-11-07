import { useState } from 'react'
import type { BlockItem } from './types'
import { BLOCK_DEFINITIONS } from './definitions'
import { Icon } from '../Icon'

interface BlockNodeProps {
  block: BlockItem
  index: number
  total: number
  onUpdate: (updated: BlockItem) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDuplicate?: () => void
  onDropInContainer: (
    containerId: string,
    slot: 'children' | 'elseChildren',
    item: BlockItem,
  ) => void
  variableNames?: string[]
  listNames?: string[]
}

const MATH_OPERATORS = ['+', '−', '×', '÷', '%', '**']
const COMPARISON_OPERATORS = ['=', '≠', '<', '≤', '>', '≥']
const pythonOperator = (operator: string) =>
  ({
    '−': '-',
    '×': '*',
    '÷': '/',
    '=': '==',
    '≠': '!=',
    '≤': '<=',
    '≥': '>=',
  })[operator] ?? operator

export function BlockNode({
  block,
  index,
  total,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDropInContainer,
  variableNames = [],
  listNames = [],
}: BlockNodeProps) {
  const [isDragOverChildren, setIsDragOverChildren] = useState(false)
  const [isDragOverElse, setIsDragOverElse] = useState(false)

  const def =
    BLOCK_DEFINITIONS.find((d) => d.type === block.type) ?? BLOCK_DEFINITIONS[0]

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation()
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify(block))
  }

  const handleUpdateField = (field: keyof BlockItem, val: string) => {
    onUpdate({ ...block, [field]: val })
  }

  const handleListValueChange = (index: number, value: string) => {
    const values = [...(block.listValues ?? ['', '', ''])]
    values[index] = value
    if (index === values.length - 1 && value.trim()) values.push('')
    onUpdate({ ...block, listValues: values })
  }

  const VariableInput = ({
    value,
    field,
    placeholder = 'choose or name one',
  }: {
    value: string
    field: keyof BlockItem
    placeholder?: string
  }) => (
    <input
      type="text"
      list="byteblocks-variables"
      className="chunk-input var-input"
      value={value}
      onChange={(e) => handleUpdateField(field, e.target.value)}
      placeholder={placeholder}
      aria-label="Variable name"
    />
  )

  const VariablePicker = ({
    value,
    field,
  }: {
    value: string
    field: keyof BlockItem
  }) => (
    <select
      className="chunk-select variable-picker"
      value={value}
      onChange={(e) => handleUpdateField(field, e.target.value)}
      aria-label="Choose a variable"
    >
      <option value="">choose a variable</option>
      {variableNames.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  )

  const ListPicker = ({
    value,
    field,
  }: {
    value: string
    field: keyof BlockItem
  }) => (
    <select
      className="chunk-select variable-picker"
      value={value}
      onChange={(e) => handleUpdateField(field, e.target.value)}
      aria-label="Choose a list"
    >
      <option value="">choose a list</option>
      {listNames.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  )

  const handleChildUpdate = (childIndex: number, updatedChild: BlockItem) => {
    const nextChildren = [...(block.children ?? [])]
    nextChildren[childIndex] = updatedChild
    onUpdate({ ...block, children: nextChildren })
  }

  const handleChildDelete = (childIndex: number) => {
    const nextChildren = [...(block.children ?? [])]
    nextChildren.splice(childIndex, 1)
    onUpdate({ ...block, children: nextChildren })
  }

  const handleElseChildUpdate = (
    childIndex: number,
    updatedChild: BlockItem,
  ) => {
    const nextElse = [...(block.elseChildren ?? [])]
    nextElse[childIndex] = updatedChild
    onUpdate({ ...block, elseChildren: nextElse })
  }

  const handleElseChildDelete = (childIndex: number) => {
    const nextElse = [...(block.elseChildren ?? [])]
    nextElse.splice(childIndex, 1)
    onUpdate({ ...block, elseChildren: nextElse })
  }

  const renderInputs = () => {
    switch (block.type) {
      case 'comment':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">#</span>
            <input
              type="text"
              className="chunk-input comment-input"
              value={block.commentText ?? ''}
              onChange={(e) => handleUpdateField('commentText', e.target.value)}
              placeholder="write note..."
            />
          </div>
        )

      case 'var_set':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">make</span>
            <VariableInput value={block.varName ?? ''} field="varName" />
            <span className="chunk-label">equal to</span>
            <select
              className="chunk-select value-kind-select"
              value={block.valueKind ?? 'number'}
              onChange={(e) => handleUpdateField('valueKind', e.target.value)}
              aria-label="Value type"
            >
              <option value="number">number</option>
              <option value="variable">variable</option>
              <option value="list_item">item from list</option>
            </select>
            {block.valueKind === 'variable' ? (
              <VariablePicker
                value={block.valueVariable ?? ''}
                field="valueVariable"
              />
            ) : block.valueKind === 'list_item' ? (
              <>
                <ListPicker value={block.valueList ?? ''} field="valueList" />
                <select
                  className="chunk-select item-position-select"
                  value={block.valueIndex ?? 'first'}
                  onChange={(e) =>
                    handleUpdateField('valueIndex', e.target.value)
                  }
                  aria-label="List item position"
                >
                  <option value="first">first item</option>
                  <option value="last">last item</option>
                  <option value="second_last">second-last item</option>
                </select>
              </>
            ) : (
              <input
                type="number"
                className="chunk-input expr-input"
                value={block.value ?? ''}
                onChange={(e) => handleUpdateField('value', e.target.value)}
                placeholder="10"
              />
            )}
            <select
              className="chunk-select operator-select"
              value={block.operator ?? ''}
              onChange={(e) => handleUpdateField('operator', e.target.value)}
              aria-label="Math operation"
            >
              <option value="">only</option>
              {MATH_OPERATORS.map((operator) => (
                <option key={operator} value={pythonOperator(operator)}>
                  {operator}
                </option>
              ))}
            </select>
            {block.operator && (
              <input
                type="text"
                className="chunk-input expr-input"
                value={block.rightValue ?? ''}
                onChange={(e) =>
                  handleUpdateField('rightValue', e.target.value)
                }
                placeholder="another number"
                aria-label="Second math value"
              />
            )}
          </div>
        )

      case 'var_change':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">change</span>
            <VariablePicker value={block.varName ?? ''} field="varName" />
            <span className="chunk-label">by</span>
            <input
              type="text"
              className="chunk-input expr-input"
              value={block.value ?? ''}
              onChange={(e) => handleUpdateField('value', e.target.value)}
              placeholder="1"
            />
          </div>
        )

      case 'list_item_math':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">make</span>
            <VariableInput value={block.varName ?? ''} field="varName" />
            <span className="chunk-label">from</span>
            <select
              className="chunk-select item-position-select"
              value={block.firstItem ?? 'last'}
              onChange={(e) => handleUpdateField('firstItem', e.target.value)}
              aria-label="First list item"
            >
              <option value="first">first item</option>
              <option value="last">last item</option>
              <option value="second_last">second-last item</option>
            </select>
            <span className="chunk-label">of</span>
            <ListPicker value={block.sourceList ?? ''} field="sourceList" />
            <select
              className="chunk-select operator-select"
              value={block.operator ?? '+'}
              onChange={(e) => handleUpdateField('operator', e.target.value)}
              aria-label="Math operation"
            >
              {MATH_OPERATORS.map((operator) => (
                <option key={operator} value={pythonOperator(operator)}>
                  {operator}
                </option>
              ))}
            </select>
            <select
              className="chunk-select item-position-select"
              value={block.secondItem ?? 'second_last'}
              onChange={(e) => handleUpdateField('secondItem', e.target.value)}
              aria-label="Second list item"
            >
              <option value="first">first item</option>
              <option value="last">last item</option>
              <option value="second_last">second-last item</option>
            </select>
            <span className="chunk-label">of the same list</span>
          </div>
        )

      case 'print':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">say</span>
            <input
              type="text"
              className="chunk-input expr-input"
              value={block.value ?? ''}
              onChange={(e) => handleUpdateField('value', e.target.value)}
              placeholder="Hello!"
            />
            <select
              className="chunk-select text-kind-select"
              value={block.isText ? 'text' : 'value'}
              onChange={(e) =>
                onUpdate({ ...block, isText: e.target.value === 'text' })
              }
              aria-label="What to say"
            >
              <option value="text">as text</option>
              <option value="value">as a variable/value</option>
            </select>
          </div>
        )

      case 'print_formatted':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">print</span>
            <span className="chunk-bracket">(f"</span>
            <input
              type="text"
              className="chunk-input expr-input"
              value={block.value ?? ''}
              onChange={(e) => handleUpdateField('value', e.target.value)}
              placeholder="Value is {x}"
            />
            <span className="chunk-bracket">")</span>
          </div>
        )

      case 'for_range':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">repeat</span>
            <input
              type="text"
              className="chunk-input count-input"
              value={block.rangeCount ?? ''}
              onChange={(e) => handleUpdateField('rangeCount', e.target.value)}
              placeholder="5"
            />
            <span className="chunk-label">times as</span>
            <input
              type="text"
              className="chunk-input var-input"
              value={block.varName ?? ''}
              onChange={(e) => handleUpdateField('varName', e.target.value)}
              placeholder="i"
            />
          </div>
        )

      case 'for_in':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">for each</span>
            <input
              type="text"
              className="chunk-input var-input"
              value={block.itemVar ?? ''}
              onChange={(e) => handleUpdateField('itemVar', e.target.value)}
              placeholder="item"
            />
            <span className="chunk-label">in</span>
            <ListPicker value={block.listName ?? ''} field="listName" />
          </div>
        )

      case 'while_loop':
      case 'if_condition':
      case 'if_else':
        if (
          !block.conditionLeft &&
          !block.conditionOperator &&
          !block.conditionRight
        ) {
          return (
            <div className="chunk-inputs">
              <span className="chunk-keyword">
                {block.type === 'while_loop' ? 'repeat while' : 'if'}
              </span>
              <input
                type="text"
                className="chunk-input expr-input"
                value={block.condition ?? ''}
                onChange={(e) => handleUpdateField('condition', e.target.value)}
                placeholder="x > 0"
              />
              <span className="chunk-colon">:</span>
            </div>
          )
        }
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">
              {block.type === 'while_loop' ? 'repeat while' : 'if'}
            </span>
            <VariablePicker
              value={block.conditionLeft ?? ''}
              field="conditionLeft"
            />
            <select
              className="chunk-select operator-select"
              value={block.conditionOperator ?? ''}
              onChange={(e) =>
                handleUpdateField('conditionOperator', e.target.value)
              }
              aria-label="Comparison"
            >
              {COMPARISON_OPERATORS.map((operator) => (
                <option key={operator} value={pythonOperator(operator)}>
                  {operator}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="chunk-input expr-input"
              value={block.conditionRight ?? ''}
              onChange={(e) =>
                handleUpdateField('conditionRight', e.target.value)
              }
              placeholder="a value"
              aria-label="Value to compare"
            />
            <span className="chunk-colon">:</span>
          </div>
        )

      case 'if_collection_contains':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">if</span>
            <VariablePicker
              value={block.valueVariable ?? ''}
              field="valueVariable"
            />
            <span className="chunk-label">is in</span>
            <ListPicker
              value={block.collectionName ?? ''}
              field="collectionName"
            />
            <span className="chunk-colon">:</span>
          </div>
        )

      case 'break_loop':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword stop-text">break loop</span>
          </div>
        )

      case 'function_def':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">define</span>
            <input
              type="text"
              className="chunk-input func-name-input"
              value={block.funcName ?? ''}
              onChange={(e) => handleUpdateField('funcName', e.target.value)}
              placeholder="calculate"
            />
            <span className="chunk-bracket">(</span>
            <input
              type="text"
              className="chunk-input func-args-input"
              value={block.funcArgs ?? ''}
              onChange={(e) => handleUpdateField('funcArgs', e.target.value)}
              placeholder="x, y"
            />
            <span className="chunk-bracket">)</span>
          </div>
        )

      case 'return_val':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">return</span>
            <input
              type="text"
              className="chunk-input expr-input"
              value={block.value ?? ''}
              onChange={(e) => handleUpdateField('value', e.target.value)}
              placeholder="result"
            />
          </div>
        )

      case 'function_call':
        return (
          <div className="chunk-inputs">
            <input
              type="text"
              className="chunk-input func-name-input"
              value={block.funcName ?? ''}
              onChange={(e) => handleUpdateField('funcName', e.target.value)}
              placeholder="my_func"
            />
            <span className="chunk-bracket">(</span>
            <input
              type="text"
              className="chunk-input func-args-input"
              value={block.funcArgs ?? ''}
              onChange={(e) => handleUpdateField('funcArgs', e.target.value)}
              placeholder="args"
            />
            <span className="chunk-bracket">)</span>
          </div>
        )

      case 'list_create':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">make list</span>
            <input
              type="text"
              className="chunk-input var-input"
              value={block.varName ?? ''}
              onChange={(e) => handleUpdateField('varName', e.target.value)}
              placeholder="my_list"
            />
            <span className="chunk-label">with</span>
            {(block.listValues ?? ['']).map((value, index) => (
              <input
                key={index}
                type="number"
                className="chunk-input list-value-input"
                value={value}
                onChange={(e) => handleListValueChange(index, e.target.value)}
                placeholder={`item ${index + 1}`}
                aria-label={`List item ${index + 1}`}
              />
            ))}
          </div>
        )

      case 'list_append':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">add</span>
            <input
              type="number"
              className="chunk-input expr-input"
              value={block.value ?? ''}
              onChange={(e) => handleUpdateField('value', e.target.value)}
              placeholder="a number"
            />
            <span className="chunk-label">to list</span>
            <ListPicker value={block.listName ?? ''} field="listName" />
          </div>
        )

      case 'dict_create':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">dict</span>
            <input
              type="text"
              className="chunk-input var-input"
              value={block.varName ?? ''}
              onChange={(e) => handleUpdateField('varName', e.target.value)}
              placeholder="my_dict"
            />
            <span className="chunk-operator">= {'{'}</span>
            <input
              type="text"
              className="chunk-input expr-input"
              value={block.value ?? ''}
              onChange={(e) => handleUpdateField('value', e.target.value)}
              placeholder="'key': 'value'"
            />
            <span className="chunk-bracket">{'}'}</span>
          </div>
        )

      case 'custom_code':
        return (
          <div className="chunk-inputs">
            <input
              type="text"
              className="chunk-input code-input"
              value={block.customCode ?? ''}
              onChange={(e) => handleUpdateField('customCode', e.target.value)}
              placeholder="write raw Python..."
            />
          </div>
        )
    }
  }

  const isContainer = Boolean(def.isContainer)

  return (
    <div
      className={`scratch-chunk ${isContainer ? 'is-container' : ''}`}
      style={
        {
          '--chunk-color': def.color,
          '--chunk-border': def.borderColor,
          '--chunk-hover': def.bgHover,
        } as React.CSSProperties
      }
      draggable
      onDragStart={handleDragStart}
    >
      <div className="chunk-header">
        <span className="chunk-handle" title="Drag chunk">
          ⠿
        </span>
        <div className="chunk-body">{renderInputs()}</div>
        <div className="chunk-actions">
          {onMoveUp && index > 0 && (
            <button
              type="button"
              className="chunk-btn"
              onClick={onMoveUp}
              title="Move Up"
            >
              ▲
            </button>
          )}
          {onMoveDown && index < total - 1 && (
            <button
              type="button"
              className="chunk-btn"
              onClick={onMoveDown}
              title="Move Down"
            >
              ▼
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              className="chunk-btn"
              onClick={onDuplicate}
              title="Duplicate"
            >
              <Icon name="copy" size={12} />
            </button>
          )}
          <button
            type="button"
            className="chunk-btn delete-btn"
            onClick={onDelete}
            title="Delete Block"
          >
            <Icon name="trash" size={12} />
          </button>
        </div>
      </div>

      {isContainer && (
        <div
          className={`chunk-nested-slot ${isDragOverChildren ? 'drag-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOverChildren(true)
          }}
          onDragLeave={() => setIsDragOverChildren(false)}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOverChildren(false)
            try {
              const data = e.dataTransfer.getData('application/json')
              if (data) {
                const parsed = JSON.parse(data) as BlockItem
                onDropInContainer(block.id, 'children', parsed)
              }
            } catch {
              // Ignore invalid drag
            }
          }}
        >
          {block.children && block.children.length > 0 ? (
            <div className="nested-blocks-list">
              {block.children.map((child, cIdx) => (
                <BlockNode
                  key={child.id}
                  block={child}
                  index={cIdx}
                  total={block.children!.length}
                  onUpdate={(up) => handleChildUpdate(cIdx, up)}
                  onDelete={() => handleChildDelete(cIdx)}
                  onDropInContainer={onDropInContainer}
                  variableNames={variableNames}
                  listNames={listNames}
                />
              ))}
            </div>
          ) : (
            <div className="nested-placeholder">
              <span>+ Drop chunks inside here</span>
            </div>
          )}
        </div>
      )}

      {def.hasElse && (
        <>
          <div className="chunk-sub-header">
            <span className="chunk-keyword">else:</span>
          </div>
          <div
            className={`chunk-nested-slot ${isDragOverElse ? 'drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragOverElse(true)
            }}
            onDragLeave={() => setIsDragOverElse(false)}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragOverElse(false)
              try {
                const data = e.dataTransfer.getData('application/json')
                if (data) {
                  const parsed = JSON.parse(data) as BlockItem
                  onDropInContainer(block.id, 'elseChildren', parsed)
                }
              } catch {
                // Ignore invalid drag
              }
            }}
          >
            {block.elseChildren && block.elseChildren.length > 0 ? (
              <div className="nested-blocks-list">
                {block.elseChildren.map((child, cIdx) => (
                  <BlockNode
                    key={child.id}
                    block={child}
                    index={cIdx}
                    total={block.elseChildren!.length}
                    onUpdate={(up) => handleElseChildUpdate(cIdx, up)}
                    onDelete={() => handleElseChildDelete(cIdx)}
                    onDropInContainer={onDropInContainer}
                    variableNames={variableNames}
                    listNames={listNames}
                  />
                ))}
              </div>
            ) : (
              <div className="nested-placeholder">
                <span>+ Drop chunks inside else</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
