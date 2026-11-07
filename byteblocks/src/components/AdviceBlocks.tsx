import { BLOCK_DEFINITIONS } from './blocks/definitions'
import { BlockIcon } from './blocks/BlockIcon'
import type { BlockItem, BlockType } from './blocks/types'

const definitions = new Map(
  BLOCK_DEFINITIONS.filter(({ type }) => type !== 'custom_code').map(
    (definition) => [definition.type, definition],
  ),
)

function parseBlocks(text: string): BlockItem[] | null {
  const match = text.match(/```byteblocks\s*([\s\S]*?)```/i)
  if (!match) return null
  try {
    const blocks = JSON.parse(match[1]) as unknown
    if (
      !Array.isArray(blocks) ||
      !blocks.every(
        (block) =>
          block &&
          typeof block === 'object' &&
          typeof (block as BlockItem).type === 'string' &&
          definitions.has((block as BlockItem).type),
      )
    )
      return null
    const hydrate = (block: BlockItem): BlockItem => {
      const definition = definitions.get(block.type)
      return {
        ...definition?.defaultValues,
        ...block,
        children:
          block.children?.map(hydrate) ?? definition?.defaultValues.children,
        elseChildren:
          block.elseChildren?.map(hydrate) ??
          definition?.defaultValues.elseChildren,
      }
    }
    return (blocks as BlockItem[]).map(hydrate)
  } catch {
    return null
  }
}

function operandDetail(operand: unknown): string {
  if (!operand || typeof operand !== 'object') return ''
  const value = operand as Record<string, unknown>
  if (value.kind === 'variable')
    return typeof value.name === 'string' ? value.name : ''
  if (value.kind === 'number')
    return typeof value.value === 'string' ? value.value : ''
  return ''
}

function textDetail(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function blockDetail(block: BlockItem): string {
  if (block.type === 'var_set')
    return `${block.varName ?? 'variable'} = ${
      operandDetail(block.valueOperand) || textDetail(block.value) || 'value'
    }`
  if (block.type === 'math_calculate')
    return `${block.varName ?? 'result'} = ${
      operandDetail(block.valueOperand) || textDetail(block.value) || 'value'
    } ${block.operator ?? '+'} ${
      operandDetail(block.rightOperand) ||
      textDetail(block.rightValue) ||
      'value'
    }`
  if (block.type === 'var_change' || block.type === 'var_decrement')
    return `${block.varName ?? 'variable'} by ${
      operandDetail(block.valueOperand) || textDetail(block.value) || 'value'
    }`
  if (block.type === 'print') return block.value ?? ''
  if (block.type === 'for_range')
    return `${block.varName ?? 'i'} from ${block.rangeStart ?? '0'} to ${block.rangeCount ?? '5'}`
  if (block.type === 'function_def')
    return `${block.funcName ?? 'calculate'}(${block.functionArgs?.filter(Boolean).join(', ') ?? block.funcArgs ?? ''})`
  if (block.type === 'function_call')
    return `${block.funcName ?? 'function'}(${block.funcArgs ?? ''})`
  if (block.type === 'for_in')
    return `${block.itemVar ?? 'item'} in ${block.listName ?? 'items'}`
  if (block.type === 'if_condition' || block.type === 'while_loop')
    return (
      block.condition ??
      `${block.conditionLeft ?? ''} ${block.conditionOperator ?? ''} ${block.conditionRight ?? ''}`.trim()
    )
  if (block.type === 'list_create')
    return `${block.varName ?? 'list'}: [${block.listValues?.filter(Boolean).join(', ') ?? ''}]`
  if (block.type === 'dict_create')
    return `${block.varName ?? 'dictionary'}${
      block.startsEmpty
        ? ': {}'
        : `: { ${
            block.dictionaryEntries
              ?.filter((entry) => entry.key || entry.value)
              .map(
                (entry) => `${entry.key || 'key'}: ${entry.value || 'value'}`,
              )
              .join(', ') ?? ''
          } }`
    }`
  if (block.type === 'dict_set')
    return `${block.listName ?? 'dictionary'}[${block.valueVariable ?? 'key'}] = ${
      operandDetail(block.valueOperand) || textDetail(block.value) || 'value'
    }`
  if (block.type === 'dict_get')
    return `${block.varName ?? 'result'} = ${block.listName ?? 'dictionary'}[${block.valueVariable ?? 'key'}]`
  return (
    block.value ??
    block.varName ??
    block.listName ??
    block.commentText ??
    block.customCode ??
    ''
  )
}

function PreviewBlock({ block }: { block: BlockItem }) {
  const definition = definitions.get(block.type as BlockType)
  if (!definition) return null
  return (
    <li
      className={`advice-block ${definition.isContainer ? 'advice-block-container' : ''}`}
      style={
        {
          '--advice-block-color': definition.color,
          '--advice-block-border': definition.borderColor,
        } as React.CSSProperties
      }
    >
      <div className="advice-block-header">
        <BlockIcon kind={definition.type} />
        <strong>{definition.label}</strong>
        {blockDetail(block) && (
          <span className="advice-block-value">{blockDetail(block)}</span>
        )}
      </div>
      {!!block.children?.length && (
        <ul className="advice-block-children">
          {block.children.map((child, index) => (
            <PreviewBlock key={`${child.type}-${index}`} block={child} />
          ))}
        </ul>
      )}
      {!!block.elseChildren?.length && (
        <ul className="advice-block-children">
          <li className="advice-else">otherwise</li>
          {block.elseChildren.map((child, index) => (
            <PreviewBlock key={`${child.type}-${index}`} block={child} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function AdviceBlocks({ text }: { text: string }) {
  const blocks = parseBlocks(text)
  if (!blocks) return null
  return (
    <div className="advice-block-example" aria-label="Read-only block example">
      <span>READ-ONLY BLOCK EXAMPLE</span>
      <ul>
        {blocks.map((block, index) => (
          <PreviewBlock key={`${block.type}-${index}`} block={block} />
        ))}
      </ul>
    </div>
  )
}
