import { useState } from 'react'
import type { BlockItem, ValueOperand, VariableScope } from './types'
import { BLOCK_DEFINITIONS } from './definitions'
import { Icon } from '../Icon'
import { BlockIcon } from './BlockIcon'
import { generatePython } from './generator'

type FunctionDefinition = { name: string; args: string[] }

interface BlockNodeProps {
  block: BlockItem
  onUpdate: (updated: BlockItem) => void
  onDelete: () => void
  onDuplicate?: () => void
  onDropBlock: (
    transfer: DataTransfer,
    destination: {
      targetId?: string
      after?: boolean
      containerId?: string
      slot?: 'children' | 'elseChildren'
    },
  ) => void
  variableNames?: string[]
  listNames?: string[]
  stackNames?: string[]
  queueNames?: string[]
  variableScopes?: Record<string, VariableScope>
  highlightedSource?: string
  functionDefinitions?: FunctionDefinition[]
  invalidConditionalPlacement?: boolean
}

function cloneWithNewIds(block: BlockItem): BlockItem {
  return {
    ...block,
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    children: block.children?.map(cloneWithNewIds),
    elseChildren: block.elseChildren?.map(cloneWithNewIds),
  }
}

function invalidConditionalPlacement(block: BlockItem, previous?: BlockItem) {
  if (block.type === 'else_if')
    return !['if_condition', 'else_if'].includes(previous?.type ?? '')
  if (block.type === 'else_clause')
    return !['if_condition', 'else_if'].includes(previous?.type ?? '')
  return false
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

function legacyOperand(
  value: string | undefined,
  kind: BlockItem['valueKind'],
  variable: string | undefined,
): ValueOperand {
  if (kind === 'variable') return { kind: 'variable', name: variable ?? '' }
  return { kind: 'number', value: value ?? '' }
}

function ValuePicker({
  operand,
  onChange,
  label,
  variableNames,
}: {
  operand: ValueOperand
  onChange: (operand: ValueOperand) => void
  label: string
  variableNames: string[]
}) {
  return (
    <span className="value-picker">
      <select
        className="chunk-select value-kind-select"
        value={operand.kind}
        onChange={(e) =>
          onChange(
            e.target.value === 'variable'
              ? { kind: 'variable', name: variableNames[0] ?? '' }
              : { kind: 'number', value: '0' },
          )
        }
        aria-label={`${label} type`}
      >
        <option value="number">number:</option>
        <option value="variable">variable:</option>
      </select>
      {operand.kind === 'number' ? (
        <input
          type="number"
          className="chunk-input expr-input"
          value={operand.value}
          onChange={(e) => onChange({ kind: 'number', value: e.target.value })}
          placeholder="4"
          aria-label={`${label} number`}
        />
      ) : (
        <select
          className="chunk-select variable-picker"
          value={operand.name}
          onChange={(e) => onChange({ kind: 'variable', name: e.target.value })}
          aria-label={`${label} variable`}
        >
          <option value="">choose a variable</option>
          {variableNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      )}
    </span>
  )
}

export function BlockNode({
  block,
  onUpdate,
  onDelete,
  onDuplicate,
  onDropBlock,
  variableNames = [],
  listNames = [],
  stackNames = [],
  queueNames = [],
  variableScopes,
  highlightedSource,
  functionDefinitions = [],
  invalidConditionalPlacement: hasInvalidConditionalPlacement = false,
}: BlockNodeProps) {
  const [isDragOverChildren, setIsDragOverChildren] = useState(false)
  const [isDragOverElse, setIsDragOverElse] = useState(false)
  const [showDeleteWarning, setShowDeleteWarning] = useState(false)

  const def =
    BLOCK_DEFINITIONS.find((d) => d.type === block.type) ?? BLOCK_DEFINITIONS[0]

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation()
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/x-byteblocks-id', block.id)
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

  const handleFunctionArgChange = (index: number, value: string) => {
    const args = [
      ...(block.functionArgs ??
        block.funcArgs?.split(',').map((arg) => arg.trim()) ?? ['']),
    ]
    args[index] = value
    if (index === args.length - 1 && value.trim()) args.push('')
    onUpdate({ ...block, functionArgs: args })
  }

  const handleReturnValueChange = (index: number, value: string) => {
    const values = [...(block.returnValues ?? ['', ''])]
    values[index] = value
    if (index === values.length - 1 && value.trim()) values.push('')
    onUpdate({ ...block, returnValues: values })
  }

  const handleDictionaryEntryChange = (
    index: number,
    field: 'key' | 'value',
    value: string,
  ) => {
    const entries = [...(block.dictionaryEntries ?? [{ key: '', value: '' }])]
    entries[index] = { ...entries[index], [field]: value }
    if (
      index === entries.length - 1 &&
      entries[index].key &&
      entries[index].value
    )
      entries.push({ key: '', value: '' })
    onUpdate({ ...block, dictionaryEntries: entries })
  }

  const EmptyToggle = () => (
    <label className="empty-collection-toggle">
      <input
        type="checkbox"
        checked={block.startsEmpty ?? false}
        onChange={(e) => onUpdate({ ...block, startsEmpty: e.target.checked })}
      />
      start empty
    </label>
  )

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
  }) => {
    const hasSelection = variableNames.includes(value)
    return (
      <span className="required-selection">
        <select
          className="chunk-select variable-picker"
          value={value}
          onChange={(e) => handleUpdateField(field, e.target.value)}
          aria-label="Choose a variable"
          aria-invalid={!hasSelection}
        >
          <option value="">choose a variable</option>
          {variableNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </span>
    )
  }

  const ListPicker = ({
    value,
    field,
  }: {
    value: string
    field: keyof BlockItem
  }) => {
    const hasSelection = listNames.includes(value)
    return (
      <span className="required-selection">
        <select
          className="chunk-select variable-picker"
          value={value}
          onChange={(e) => handleUpdateField(field, e.target.value)}
          aria-label="Choose a list"
          aria-invalid={!hasSelection}
        >
          <option value="">choose a list</option>
          {listNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </span>
    )
  }

  const StructurePicker = ({
    value,
    field,
    names,
    label,
  }: {
    value: string
    field: keyof BlockItem
    names: string[]
    label: string
  }) => {
    const hasSelection = names.includes(value)
    return (
      <span className="required-selection">
        <select
          className="chunk-select variable-picker"
          value={value}
          onChange={(e) => handleUpdateField(field, e.target.value)}
          aria-label={`Choose a ${label}`}
          aria-invalid={!hasSelection}
        >
          <option value="">choose a {label}</option>
          {names.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </span>
    )
  }

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
      case 'stack_create':
      case 'queue_create': {
        const kind = block.type === 'stack_create' ? 'stack' : 'queue'
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">make {kind}</span>
            <VariableInput
              value={block.varName ?? ''}
              field="varName"
              placeholder={`${kind} name`}
            />
            <EmptyToggle />
            {!block.startsEmpty && <span className="chunk-label">with</span>}
            {!block.startsEmpty &&
              (block.listValues ?? ['']).map((value, index) => (
                <input
                  key={index}
                  type="number"
                  className="chunk-input list-value-input"
                  value={value}
                  onChange={(e) => handleListValueChange(index, e.target.value)}
                  placeholder={`item ${index + 1}`}
                />
              ))}
          </div>
        )
      }
      case 'stack_add':
      case 'queue_add': {
        const kind = block.type === 'stack_add' ? 'stack' : 'queue'
        const names = kind === 'stack' ? stackNames : queueNames
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
            <span className="chunk-label">to {kind}</span>
            <StructurePicker
              value={block.listName ?? ''}
              field="listName"
              names={names}
              label={kind}
            />
          </div>
        )
      }
      case 'stack_remove':
      case 'queue_remove':
      case 'stack_peek':
      case 'queue_peek':
      case 'stack_size':
      case 'queue_size':
      case 'stack_empty':
      case 'queue_empty': {
        const isStack = block.type.startsWith('stack_')
        const kind = isStack ? 'stack' : 'queue'
        const action = block.type.endsWith('_remove')
          ? isStack
            ? 'take top from'
            : 'take first from'
          : block.type.endsWith('_peek')
            ? isStack
              ? 'look at top of'
              : 'look at first of'
            : block.type.endsWith('_size')
              ? 'count items in'
              : 'check if empty'
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">{action}</span>
            <StructurePicker
              value={block.listName ?? ''}
              field="listName"
              names={isStack ? stackNames : queueNames}
              label={kind}
            />
            <span className="chunk-label">put in</span>
            <VariableInput
              value={block.varName ?? ''}
              field="varName"
              placeholder="result"
            />
          </div>
        )
      }
      case 'stack_clear':
      case 'queue_clear': {
        const isStack = block.type === 'stack_clear'
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">clear</span>
            <StructurePicker
              value={block.listName ?? ''}
              field="listName"
              names={isStack ? stackNames : queueNames}
              label={isStack ? 'stack' : 'queue'}
            />
          </div>
        )
      }
      case 'comment':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">comment</span>
            <textarea
              className="chunk-input comment-input"
              value={block.commentText ?? ''}
              onChange={(e) => handleUpdateField('commentText', e.target.value)}
              placeholder="write note..."
              rows={2}
            />
          </div>
        )

      case 'var_set':
      case 'math_calculate': {
        const valueOperand =
          block.valueOperand ??
          legacyOperand(block.value, block.valueKind, block.valueVariable)
        const rightOperand =
          block.rightOperand ??
          legacyOperand(block.rightValue, undefined, undefined)
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">
              {block.type === 'math_calculate' ? 'calculate' : 'set'}
            </span>
            <VariableInput value={block.varName ?? ''} field="varName" />
            <span className="chunk-label">to</span>
            <ValuePicker
              operand={valueOperand}
              onChange={(valueOperand) => onUpdate({ ...block, valueOperand })}
              label="Value"
              variableNames={variableNames}
            />
            {block.type === 'math_calculate' && (
              <>
                <select
                  className="chunk-select operator-select"
                  value={block.operator ?? '+'}
                  onChange={(e) =>
                    handleUpdateField('operator', e.target.value)
                  }
                  aria-label="Math operation"
                >
                  {MATH_OPERATORS.map((operator) => (
                    <option key={operator} value={pythonOperator(operator)}>
                      {operator}
                    </option>
                  ))}
                </select>
                <ValuePicker
                  operand={rightOperand}
                  onChange={(rightOperand) =>
                    onUpdate({ ...block, rightOperand })
                  }
                  label="Second value"
                  variableNames={variableNames}
                />
              </>
            )}
          </div>
        )
      }

      case 'var_change':
      case 'var_decrement': {
        const valueOperand =
          block.valueOperand ?? legacyOperand(block.value, undefined, undefined)
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">
              {block.type === 'var_change' ? 'increment' : 'decrement'}
            </span>
            <VariablePicker value={block.varName ?? ''} field="varName" />
            <span className="chunk-label">by</span>
            <ValuePicker
              operand={valueOperand}
              onChange={(valueOperand) => onUpdate({ ...block, valueOperand })}
              label="Amount"
              variableNames={variableNames}
            />
          </div>
        )
      }

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
            <select
              className="chunk-select text-kind-select"
              value={block.isText ? 'text' : 'value'}
              onChange={(e) => {
                const isText = e.target.value === 'text'
                onUpdate({
                  ...block,
                  isText,
                  value:
                    !isText && !variableNames.includes(block.value ?? '')
                      ? ''
                      : block.value,
                })
              }}
              aria-label="What to say"
            >
              <option value="text">text:</option>
              <option value="value">value:</option>
            </select>
            {block.isText ? (
              <input
                type="text"
                className="chunk-input expr-input"
                value={block.value ?? ''}
                onChange={(e) => handleUpdateField('value', e.target.value)}
                placeholder="hi"
                aria-label="Text to say"
              />
            ) : (
              <select
                className="chunk-select variable-picker"
                value={block.value ?? ''}
                onChange={(e) => handleUpdateField('value', e.target.value)}
                aria-label="Variable to say"
              >
                <option value="">choose a variable</option>
                {variableNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
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

      case 'for_range': {
        const rangeMode = block.rangeMode ?? 'number'
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">repeat</span>
            <select
              className="chunk-select value-kind-select"
              value={rangeMode}
              onChange={(e) =>
                onUpdate({
                  ...block,
                  rangeMode: e.target.value as 'number' | 'variable' | 'length',
                  rangeCount:
                    e.target.value === 'number' ? block.rangeCount || '5' : '',
                  listName: e.target.value === 'length' ? block.listName : '',
                })
              }
              aria-label="Range endpoint type"
            >
              <option value="number">number:</option>
              <option value="variable">variable:</option>
              <option value="length">length of:</option>
            </select>
            {rangeMode === 'number' ? (
              <input
                type="number"
                className="chunk-input count-input"
                value={block.rangeCount ?? ''}
                onChange={(e) =>
                  handleUpdateField('rangeCount', e.target.value)
                }
                placeholder="5"
                aria-label="Number of repeats"
              />
            ) : rangeMode === 'variable' ? (
              <VariablePicker
                value={block.rangeCount ?? ''}
                field="rangeCount"
              />
            ) : (
              <ListPicker value={block.listName ?? ''} field="listName" />
            )}
            <span className="chunk-label">times as</span>
            <input
              type="text"
              className="chunk-input var-input"
              value={block.varName ?? ''}
              onChange={(e) => handleUpdateField('varName', e.target.value)}
              placeholder="i"
              aria-label="Loop counter variable"
            />
          </div>
        )
      }

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
      case 'else_if':
        if (
          !block.conditionLeft &&
          !block.conditionOperator &&
          !block.conditionRight
        ) {
          return (
            <div className="chunk-inputs">
              <span className="chunk-keyword">
                {block.type === 'while_loop'
                  ? 'repeat while'
                  : block.type === 'else_if'
                    ? 'else if'
                    : 'if'}
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
        if (block.conditionKind === 'boolean') {
          return (
            <div className="chunk-inputs">
              <span className="chunk-keyword">
                {block.type === 'while_loop'
                  ? 'repeat while'
                  : block.type === 'else_if'
                    ? 'else if'
                    : 'if'}
              </span>
              <select
                className="chunk-select value-kind-select"
                value="boolean"
                onChange={(e) => {
                  if (e.target.value === 'comparison')
                    onUpdate({ ...block, conditionKind: 'comparison' })
                }}
                aria-label="Condition type"
              >
                <option value="boolean">bool:</option>
                <option value="comparison">comparison:</option>
              </select>
              <select
                className="chunk-select variable-picker"
                value={block.conditionBoolean ?? 'True'}
                onChange={(e) =>
                  onUpdate({
                    ...block,
                    conditionBoolean: e.target.value as 'True' | 'False',
                  })
                }
                aria-label="Boolean condition"
              >
                <option value="True">True</option>
                <option value="False">False</option>
              </select>
              <span className="chunk-colon">:</span>
            </div>
          )
        }
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">
              {block.type === 'while_loop'
                ? 'repeat while'
                : block.type === 'else_if'
                  ? 'else if'
                  : 'if'}
            </span>
            <select
              className="chunk-select value-kind-select"
              value="comparison"
              onChange={(e) => {
                if (e.target.value === 'boolean')
                  onUpdate({
                    ...block,
                    conditionKind: 'boolean',
                    conditionBoolean: 'True',
                  })
              }}
              aria-label="Condition type"
            >
              <option value="comparison">comparison:</option>
              <option value="boolean">bool:</option>
            </select>
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

      case 'else_clause':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">else:</span>
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

      case 'continue_loop':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword stop-text">continue loop</span>
          </div>
        )

      case 'function_def': {
        if (block.isProblemFunction) {
          return (
            <div className="chunk-inputs problem-function-signature">
              <span className="problem-function-badge">REQUIRED</span>
              <span className="chunk-keyword">define</span>
              <span className="locked-function-name">
                {block.funcName ?? 'two_sum'}
              </span>
              <span className="chunk-bracket">(</span>
              <span className="locked-function-args">
                {block.functionArgs?.join(', ') ?? block.funcArgs ?? ''}
              </span>
              <span className="chunk-bracket">)</span>
            </div>
          )
        }
        const args = block.functionArgs ??
          block.funcArgs?.split(',').map((arg) => arg.trim()) ?? ['']
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
            <span
              className="function-arg-slots"
              aria-label="Function parameters"
            >
              {args.map((arg, index) => (
                <span className="function-arg-slot" key={index}>
                  {index > 0 && <span className="chunk-bracket">,</span>}
                  <input
                    type="text"
                    className="chunk-input func-arg-input"
                    value={arg}
                    onChange={(e) =>
                      handleFunctionArgChange(index, e.target.value)
                    }
                    placeholder={`argument ${index + 1}`}
                    aria-label={`Function parameter ${index + 1}`}
                  />
                </span>
              ))}
            </span>
            <span className="chunk-bracket">)</span>
          </div>
        )
      }

      case 'return_val':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">return</span>
            <select
              className="chunk-select"
              value={block.returnMode ?? 'value'}
              onChange={(e) =>
                onUpdate({
                  ...block,
                  returnMode: e.target.value as BlockItem['returnMode'],
                  returnValues:
                    e.target.value === 'list'
                      ? (block.returnValues ?? ['', ''])
                      : block.returnValues,
                })
              }
              aria-label="Return type"
            >
              <option value="value">a value</option>
              <option value="list">a list</option>
            </select>
            {block.returnMode === 'list' ? (
              <span
                className="function-arg-slots"
                aria-label="List items to return"
              >
                {(block.returnValues ?? ['', '']).map((value, index) => (
                  <span className="function-arg-slot" key={index}>
                    {index > 0 && <span className="chunk-bracket">,</span>}
                    <input
                      type="text"
                      className="chunk-input func-arg-input"
                      value={value}
                      onChange={(e) =>
                        handleReturnValueChange(index, e.target.value)
                      }
                      placeholder={`item ${index + 1}`}
                      aria-label={`Returned list item ${index + 1}`}
                    />
                  </span>
                ))}
              </span>
            ) : (
              <input
                type="text"
                className="chunk-input expr-input"
                value={block.value ?? ''}
                onChange={(e) => handleUpdateField('value', e.target.value)}
                placeholder="result"
              />
            )}
          </div>
        )

      case 'function_call': {
        const selectedFunction = functionDefinitions.find(
          (item) => item.name === block.funcName,
        )
        const inputs = (block.funcArgs ?? '')
          .split(',')
          .map((arg) => arg.trim())
        const args = selectedFunction?.args ?? []
        const resultTarget =
          block.resultTarget ?? (block.varName?.trim() ? 'existing' : 'discard')
        return (
          <div className="chunk-inputs">
            <select
              className="chunk-select func-name-input"
              value={block.funcName ?? ''}
              onChange={(e) => {
                const definition = functionDefinitions.find(
                  (item) => item.name === e.target.value,
                )
                onUpdate({
                  ...block,
                  funcName: e.target.value,
                  funcArgs: definition?.args.map(() => '').join(', ') ?? '',
                })
              }}
              aria-label="Function to call"
            >
              <option value="">choose a function</option>
              {functionDefinitions.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            <span className="chunk-bracket">(</span>
            {selectedFunction ? (
              args.map((arg, index) => (
                <span className="function-arg-slot" key={arg}>
                  {index > 0 && <span className="chunk-bracket">,</span>}
                  <input
                    type="text"
                    className="chunk-input func-arg-input"
                    value={inputs[index] ?? ''}
                    onChange={(e) => {
                      const next = args.map((_, inputIndex) =>
                        inputIndex === index
                          ? e.target.value
                          : (inputs[inputIndex] ?? ''),
                      )
                      handleUpdateField('funcArgs', next.join(', '))
                    }}
                    placeholder={arg}
                    aria-label={`Value for ${arg}`}
                  />
                </span>
              ))
            ) : (
              <span className="chunk-label">select a function</span>
            )}
            <span className="chunk-bracket">)</span>
            <span className="chunk-label">save result in</span>
            <select
              className="chunk-select variable-picker"
              value={resultTarget}
              onChange={(e) =>
                onUpdate({
                  ...block,
                  resultTarget: e.target.value as BlockItem['resultTarget'],
                  varName: e.target.value === 'discard' ? '' : block.varName,
                })
              }
              aria-label="Where to save the function result"
            >
              <option value="discard">don't save it</option>
              <option value="new">a new variable</option>
              <option value="existing">an existing variable</option>
            </select>
            {resultTarget === 'new' ? (
              <input
                type="text"
                className="chunk-input var-input"
                value={block.varName ?? ''}
                onChange={(e) => handleUpdateField('varName', e.target.value)}
                placeholder="new result name"
                aria-label="New result variable name"
              />
            ) : resultTarget === 'existing' ? (
              <VariablePicker value={block.varName ?? ''} field="varName" />
            ) : null}
          </div>
        )
      }

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
            <EmptyToggle />
            {!block.startsEmpty && <span className="chunk-label">with</span>}
            {!block.startsEmpty &&
              (block.listValues ?? ['']).map((value, index) => (
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

      case 'list_get':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">get item</span>
            <span className="chunk-label">from</span>
            <ListPicker value={block.listName ?? ''} field="listName" />
            <span className="chunk-label">at index</span>
            <VariableInput
              value={block.valueIndexValue ?? ''}
              field="valueIndexValue"
              placeholder="0 or variable"
            />
            <span className="chunk-label">into</span>
            <VariableInput value={block.varName ?? ''} field="varName" />
          </div>
        )

      case 'list_remove':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">remove from</span>
            <ListPicker value={block.listName ?? ''} field="listName" />
            <select
              className="chunk-select"
              value={block.listRemoveMode ?? 'index'}
              onChange={(e) =>
                handleUpdateField('listRemoveMode', e.target.value)
              }
              aria-label="Remove by"
            >
              <option value="index">by index</option>
              <option value="value">by value</option>
            </select>
            <VariableInput
              value={block.value ?? ''}
              field="value"
              placeholder="0 or value"
            />
          </div>
        )

      case 'dict_create':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">make dictionary</span>
            <input
              type="text"
              className="chunk-input var-input"
              value={block.varName ?? ''}
              onChange={(e) => handleUpdateField('varName', e.target.value)}
              placeholder="my_dict"
            />
            <EmptyToggle />
            {!block.startsEmpty &&
              (block.dictionaryEntries ?? [{ key: '', value: '' }]).map(
                (entry, index) => (
                  <span className="dictionary-entry" key={index}>
                    <input
                      type="text"
                      className="chunk-input dictionary-key-input"
                      value={entry.key}
                      onChange={(e) =>
                        handleDictionaryEntryChange(
                          index,
                          'key',
                          e.target.value,
                        )
                      }
                      placeholder="key"
                      aria-label={`Dictionary key ${index + 1}`}
                    />
                    <span className="chunk-label">is</span>
                    <input
                      type="number"
                      className="chunk-input list-value-input"
                      value={entry.value}
                      onChange={(e) =>
                        handleDictionaryEntryChange(
                          index,
                          'value',
                          e.target.value,
                        )
                      }
                      placeholder="value"
                      aria-label={`Dictionary value ${index + 1}`}
                    />
                  </span>
                ),
              )}
          </div>
        )

      case 'dict_set':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">set</span>
            <input
              type="text"
              className="chunk-input var-input"
              value={block.listName ?? ''}
              onChange={(e) => handleUpdateField('listName', e.target.value)}
              placeholder="dictionary"
              aria-label="Dictionary name"
            />
            <span className="chunk-label">key</span>
            <input
              type="text"
              className="chunk-input dictionary-key-input"
              value={block.valueVariable ?? ''}
              onChange={(e) =>
                handleUpdateField('valueVariable', e.target.value)
              }
              placeholder="key"
              aria-label="Dictionary key"
            />
            <span className="chunk-label">to</span>
            <input
              type="text"
              className="chunk-input expr-input"
              value={block.value ?? ''}
              onChange={(e) => handleUpdateField('value', e.target.value)}
              placeholder="value"
              aria-label="Dictionary value"
            />
          </div>
        )

      case 'dict_get':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">get</span>
            <input
              type="text"
              className="chunk-input var-input"
              value={block.varName ?? ''}
              onChange={(e) => handleUpdateField('varName', e.target.value)}
              placeholder="result"
              aria-label="Result variable"
            />
            <span className="chunk-label">from</span>
            <input
              type="text"
              className="chunk-input var-input"
              value={block.listName ?? ''}
              onChange={(e) => handleUpdateField('listName', e.target.value)}
              placeholder="dictionary"
              aria-label="Dictionary name"
            />
            <span className="chunk-label">key</span>
            <input
              type="text"
              className="chunk-input dictionary-key-input"
              value={block.valueVariable ?? ''}
              onChange={(e) =>
                handleUpdateField('valueVariable', e.target.value)
              }
              placeholder="key"
              aria-label="Dictionary key"
            />
          </div>
        )

      case 'dict_remove':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">remove key</span>
            <input
              type="text"
              className="chunk-input dictionary-key-input"
              value={block.valueVariable ?? ''}
              onChange={(e) =>
                handleUpdateField('valueVariable', e.target.value)
              }
              placeholder="key"
              aria-label="Dictionary key"
            />
            <span className="chunk-label">from</span>
            <input
              type="text"
              className="chunk-input var-input"
              value={block.listName ?? ''}
              onChange={(e) => handleUpdateField('listName', e.target.value)}
              placeholder="dictionary"
              aria-label="Dictionary name"
            />
          </div>
        )

      case 'dict_keys':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">get keys from</span>
            <input
              type="text"
              className="chunk-input var-input"
              value={block.listName ?? ''}
              onChange={(e) => handleUpdateField('listName', e.target.value)}
              placeholder="dictionary"
              aria-label="Dictionary name"
            />
            <span className="chunk-label">into</span>
            <input
              type="text"
              className="chunk-input var-input"
              value={block.varName ?? ''}
              onChange={(e) => handleUpdateField('varName', e.target.value)}
              placeholder="keys"
              aria-label="Result variable"
            />
          </div>
        )

      case 'random_integer':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">random number</span>
            <input
              type="number"
              className="chunk-input list-value-input"
              value={block.rangeStart ?? ''}
              onChange={(e) => handleUpdateField('rangeStart', e.target.value)}
              aria-label="Minimum number"
            />
            <span className="chunk-label">to</span>
            <input
              type="number"
              className="chunk-input list-value-input"
              value={block.rangeCount ?? ''}
              onChange={(e) => handleUpdateField('rangeCount', e.target.value)}
              aria-label="Maximum number"
            />
            <span className="chunk-label">into</span>
            <input
              type="text"
              className="chunk-input var-input"
              value={block.varName ?? ''}
              onChange={(e) => handleUpdateField('varName', e.target.value)}
              placeholder="number"
              aria-label="Result variable"
            />
          </div>
        )

      case 'random_choice':
      case 'random_shuffle':
        return (
          <div className="chunk-inputs">
            <span className="chunk-keyword">
              {block.type === 'random_choice'
                ? 'pick random item from'
                : 'shuffle'}
            </span>
            <input
              type="text"
              className="chunk-input var-input"
              value={block.listName ?? ''}
              onChange={(e) => handleUpdateField('listName', e.target.value)}
              placeholder="items"
              aria-label="List name"
            />
            {block.type === 'random_choice' && (
              <>
                <span className="chunk-label">into</span>
                <input
                  type="text"
                  className="chunk-input var-input"
                  value={block.varName ?? ''}
                  onChange={(e) => handleUpdateField('varName', e.target.value)}
                  placeholder="item"
                  aria-label="Result variable"
                />
              </>
            )}
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
  const hasMissingSelection = (() => {
    const hasVariable = (name: string | undefined) =>
      variableNames.includes(name ?? '')
    const hasList = (name: string | undefined) => listNames.includes(name ?? '')
    const hasStructure = (name: string | undefined, names: string[]) =>
      names.includes(name ?? '')

    switch (block.type) {
      case 'for_range':
        return (
          (block.rangeMode === 'variable' && !hasVariable(block.rangeCount)) ||
          (block.rangeMode === 'length' && !hasList(block.listName))
        )
      case 'var_set':
        return (
          block.valueKind === 'variable' && !hasVariable(block.valueVariable)
        )
      case 'var_change':
        return !hasVariable(block.varName)
      case 'list_item_math':
        return !hasList(block.sourceList)
      case 'for_in':
      case 'list_append':
      case 'list_get':
      case 'list_remove':
        return !hasList(block.listName)
      case 'if_collection_contains':
        return (
          !hasVariable(block.valueVariable) || !hasList(block.collectionName)
        )
      case 'if_condition':
      case 'if_else':
      case 'else_if':
      case 'while_loop':
        return (
          block.conditionKind !== 'boolean' &&
          Boolean(block.conditionLeft) &&
          !hasVariable(block.conditionLeft)
        )
      case 'stack_add':
      case 'stack_remove':
      case 'stack_peek':
      case 'stack_size':
      case 'stack_empty':
      case 'stack_clear':
        return !hasStructure(block.listName, stackNames)
      case 'queue_add':
      case 'queue_remove':
      case 'queue_peek':
      case 'queue_size':
      case 'queue_empty':
      case 'queue_clear':
        return !hasStructure(block.listName, queueNames)
      default:
        return false
    }
  })()
  const hasMissingIndent = isContainer && !block.children?.length
  const hasWarning =
    hasMissingSelection || hasMissingIndent || hasInvalidConditionalPlacement
  const warningMessage = hasInvalidConditionalPlacement
    ? 'Place this directly after an if or else-if block.'
    : hasMissingIndent
      ? 'Add an indented block inside.'
      : 'You must select a required item.'
  const isHighlighted =
    !!highlightedSource &&
    generatePython([block])
      .split('\n')
      .some((line) => line.trim() === highlightedSource)

  return (
    <div
      className={`scratch-chunk ${isContainer ? 'is-container' : ''} ${hasWarning ? 'has-warning' : ''} ${isHighlighted ? 'trace-block-highlight' : ''}`}
      style={
        {
          '--chunk-color': def.color,
          '--chunk-border': def.borderColor,
          '--chunk-hover': def.bgHover,
        } as React.CSSProperties
      }
    >
      {hasWarning && (
        <span
          className="block-warning-flag"
          data-tooltip={warningMessage}
          role="img"
          aria-label={warningMessage}
          tabIndex={0}
        >
          ⚠
        </span>
      )}
      <div
        className="chunk-header"
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const rect = e.currentTarget.getBoundingClientRect()
          e.currentTarget.dataset.dropPosition =
            e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
        }}
        onDragLeave={(e) => {
          delete e.currentTarget.dataset.dropPosition
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const rect = e.currentTarget.getBoundingClientRect()
          delete e.currentTarget.dataset.dropPosition
          onDropBlock(e.dataTransfer, {
            targetId: block.id,
            after: e.clientY >= rect.top + rect.height / 2,
          })
        }}
      >
        <span
          className="chunk-handle"
          title="Drag chunk"
          draggable
          onDragStart={handleDragStart}
        >
          ⠿
        </span>
        <BlockIcon kind={def.type} />
        <div className="chunk-body">{renderInputs()}</div>
        <div className="chunk-actions">
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
            onClick={() => setShowDeleteWarning(true)}
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
            onDropBlock(e.dataTransfer, {
              containerId: block.id,
              slot: 'children',
            })
          }}
        >
          {block.children && block.children.length > 0 ? (
            <div className="nested-blocks-list">
              {block.children.map((child, cIdx) => (
                <BlockNode
                  key={child.id}
                  block={child}
                  onUpdate={(up) => handleChildUpdate(cIdx, up)}
                  onDelete={() => handleChildDelete(cIdx)}
                  onDuplicate={() => {
                    const nextChildren = [...(block.children ?? [])]
                    nextChildren.splice(cIdx + 1, 0, cloneWithNewIds(child))
                    onUpdate({ ...block, children: nextChildren })
                  }}
                  onDropBlock={onDropBlock}
                  variableNames={
                    variableScopes?.[child.id]?.names ?? variableNames
                  }
                  listNames={variableScopes?.[child.id]?.lists ?? listNames}
                  stackNames={variableScopes?.[child.id]?.stacks ?? stackNames}
                  queueNames={variableScopes?.[child.id]?.queues ?? queueNames}
                  variableScopes={variableScopes}
                  highlightedSource={highlightedSource}
                  functionDefinitions={functionDefinitions}
                  invalidConditionalPlacement={invalidConditionalPlacement(
                    child,
                    block.children?.[cIdx - 1],
                  )}
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
              onDropBlock(e.dataTransfer, {
                containerId: block.id,
                slot: 'elseChildren',
              })
            }}
          >
            {block.elseChildren && block.elseChildren.length > 0 ? (
              <div className="nested-blocks-list">
                {block.elseChildren.map((child, cIdx) => (
                  <BlockNode
                    key={child.id}
                    block={child}
                    onUpdate={(up) => handleElseChildUpdate(cIdx, up)}
                    onDelete={() => handleElseChildDelete(cIdx)}
                    onDuplicate={() => {
                      const nextChildren = [...(block.elseChildren ?? [])]
                      nextChildren.splice(cIdx + 1, 0, cloneWithNewIds(child))
                      onUpdate({ ...block, elseChildren: nextChildren })
                    }}
                    onDropBlock={onDropBlock}
                    variableNames={
                      variableScopes?.[child.id]?.names ?? variableNames
                    }
                    listNames={variableScopes?.[child.id]?.lists ?? listNames}
                    stackNames={
                      variableScopes?.[child.id]?.stacks ?? stackNames
                    }
                    queueNames={
                      variableScopes?.[child.id]?.queues ?? queueNames
                    }
                    variableScopes={variableScopes}
                    highlightedSource={highlightedSource}
                    functionDefinitions={functionDefinitions}
                    invalidConditionalPlacement={invalidConditionalPlacement(
                      child,
                      block.elseChildren?.[cIdx - 1],
                    )}
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
      {showDeleteWarning && (
        <div className="block-delete-dialog-backdrop">
          <section
            className="block-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`delete-block-title-${block.id}`}
          >
            <h2 id={`delete-block-title-${block.id}`}>Delete this block?</h2>
            <p>
              {isContainer
                ? 'The blocks inside it will also be deleted.'
                : 'This cannot be undone.'}
            </p>
            <div className="block-delete-actions">
              <button
                type="button"
                className="dialog-secondary-btn"
                onClick={() => setShowDeleteWarning(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dialog-danger-btn"
                onClick={onDelete}
              >
                Delete block
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
