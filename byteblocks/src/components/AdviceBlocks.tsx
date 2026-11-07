import { BLOCK_DEFINITIONS } from './blocks/definitions'
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

function blockDetail(block: BlockItem): string {
  if (block.type === 'var_set')
    return `${block.varName ?? 'variable'} = ${block.value ?? ''}`
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
      className="advice-block"
      style={{
        borderColor: definition.borderColor,
        backgroundColor: `${definition.color}18`,
      }}
    >
      <strong>{definition.label}</strong>
      {blockDetail(block) && <span>{blockDetail(block)}</span>}
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
