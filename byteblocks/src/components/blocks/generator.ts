import type { BlockItem, BlockType } from './types'

const BLOCK_IMPORTS: Partial<Record<BlockType, readonly string[]>> = {
  queue_create: ['from collections import deque'],
  random_integer: ['import random'],
  random_choice: ['import random'],
  random_shuffle: ['import random'],
}

function collectImports(blocks: BlockItem[], imports: Set<string>): void {
  for (const block of blocks) {
    for (const statement of BLOCK_IMPORTS[block.type] ?? [])
      imports.add(statement)
    if (block.children) collectImports(block.children, imports)
    if (block.elseChildren) collectImports(block.elseChildren, imports)
  }
}

export function generatePython(blocks: BlockItem[], indentLevel = 0): string {
  const body = generatePythonBody(blocks, indentLevel)
  if (indentLevel > 0) return body
  const imports = new Set<string>()
  collectImports(blocks, imports)
  return imports.size ? `${[...imports].join('\n')}\n${body}` : body
}

function generatePythonBody(blocks: BlockItem[], indentLevel: number): string {
  const indent = '    '.repeat(indentLevel)
  const lines: string[] = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    switch (block.type) {
      case 'comment': {
        const text = block.commentText ?? ''
        lines.push(`${indent}# ${text}`)
        break
      }

      case 'var_set':
      case 'math_calculate': {
        const name = block.varName?.trim() || 'x'
        const baseValue = operandValue(block.valueOperand, guidedValue(block))
        const operator = block.operator?.trim()
        const rightValue = operandValue(block.rightOperand, block.rightValue)
        const val =
          operator && rightValue
            ? `${baseValue} ${operator} ${rightValue}`
            : baseValue
        lines.push(`${indent}${name} = ${val}`)
        break
      }

      case 'var_change': {
        const name = block.varName?.trim() || 'x'
        const val = operandValue(block.valueOperand, block.value) || '1'
        lines.push(`${indent}${name} += ${val}`)
        break
      }

      case 'var_decrement': {
        const name = block.varName?.trim() || 'x'
        const val = operandValue(block.valueOperand, block.value) || '1'
        lines.push(`${indent}${name} -= ${val}`)
        break
      }

      case 'list_item_math': {
        const name = block.varName?.trim() || 'total'
        const list = block.sourceList?.trim() || ''
        const operator = block.operator?.trim() || '+'
        lines.push(
          `${indent}${name} = ${listItemExpression(list, block.firstItem)} ${operator} ${listItemExpression(list, block.secondItem)}`,
        )
        break
      }

      case 'print': {
        const val = block.value !== undefined ? block.value : '"Hello World!"'
        lines.push(
          `${indent}print(${block.isText ? JSON.stringify(val) : val})`,
        )
        break
      }

      case 'print_formatted': {
        const val = block.value ?? 'Value is: {x}'
        lines.push(`${indent}print(f"${val}")`)
        break
      }

      case 'for_range': {
        const varName = block.varName?.trim() || 'i'
        const start = block.rangeStart?.trim()
        const count =
          block.rangeMode === 'length'
            ? `len(${block.listName?.trim() || 'items'})`
            : block.rangeCount?.trim() || '5'
        const rangeExpr = start ? `${start}, ${count}` : count
        lines.push(`${indent}for ${varName} in range(${rangeExpr}):`)

        lines.push(containerBody(block.children, indentLevel))
        break
      }

      case 'for_in': {
        const itemVar = block.itemVar?.trim() || 'item'
        const listName = block.listName?.trim() || 'items'
        lines.push(`${indent}for ${itemVar} in ${listName}:`)

        lines.push(containerBody(block.children, indentLevel))
        break
      }

      case 'while_loop': {
        const condition = guidedCondition(block)
        lines.push(`${indent}while ${condition}:`)

        lines.push(containerBody(block.children, indentLevel))
        break
      }

      case 'if_condition': {
        const condition = guidedCondition(block)
        lines.push(`${indent}if ${condition}:`)

        lines.push(containerBody(block.children, indentLevel))
        break
      }

      case 'if_else': {
        const condition = guidedCondition(block)
        lines.push(`${indent}if ${condition}:`)

        lines.push(containerBody(block.children, indentLevel))

        lines.push(`${indent}else:`)
        lines.push(containerBody(block.elseChildren, indentLevel))
        break
      }

      case 'else_if': {
        lines.push(`${indent}elif ${guidedCondition(block)}:`)
        lines.push(containerBody(block.children, indentLevel))
        break
      }

      case 'else_clause': {
        lines.push(`${indent}else:`)
        lines.push(containerBody(block.children, indentLevel))
        break
      }

      case 'if_collection_contains': {
        const value = block.valueVariable?.trim() || 'item'
        const collection = block.collectionName?.trim() || 'items'
        lines.push(`${indent}if ${value} in ${collection}:`)
        lines.push(containerBody(block.children, indentLevel))
        break
      }

      case 'break_loop': {
        lines.push(`${indent}break`)
        break
      }

      case 'continue_loop': {
        lines.push(`${indent}continue`)
        break
      }

      case 'function_def': {
        const name = block.funcName?.trim() || 'my_function'
        const args = block.functionArgs
          ? block.functionArgs.filter((arg) => arg.trim()).join(', ')
          : block.funcArgs?.trim() || ''
        lines.push(`${indent}def ${name}(${args}):`)

        lines.push(containerBody(block.children, indentLevel))
        break
      }

      case 'return_val': {
        const val =
          block.returnMode === 'list'
            ? `[${(block.returnValues ?? [])
                .filter((value) => value.trim())
                .join(', ')}]`
            : block.value?.trim() || 'None'
        lines.push(`${indent}return ${val}`)
        break
      }

      case 'function_call': {
        const name = block.funcName?.trim() || 'my_function'
        const args = block.funcArgs?.trim() || ''
        const result =
          block.resultTarget === 'discard' ? '' : block.varName?.trim()
        lines.push(`${indent}${result ? `${result} = ` : ''}${name}(${args})`)
        break
      }

      case 'list_create': {
        const name = block.varName?.trim() || 'my_list'
        const val = block.startsEmpty
          ? ''
          : block.listValues
            ? block.listValues.filter((value) => value.trim()).join(', ')
            : block.value?.trim() || ''
        lines.push(`${indent}${name} = [${val}]`)
        break
      }

      case 'list_append': {
        const listName = block.listName?.trim() || 'my_list'
        const val = block.value?.trim() || 'item'
        lines.push(`${indent}${listName}.append(${val})`)
        break
      }

      case 'list_get': {
        const result = block.varName?.trim() || 'item'
        const list = block.listName?.trim() || 'None'
        const index = block.valueIndexValue?.trim() || '0'
        lines.push(`${indent}${result} = ${list}[${index}]`)
        break
      }

      case 'list_remove': {
        const list = block.listName?.trim() || 'None'
        const target = block.value?.trim() || '0'
        const method = block.listRemoveMode === 'value' ? 'remove' : 'pop'
        lines.push(`${indent}${list}.${method}(${target})`)
        break
      }

      case 'stack_create': {
        const name = block.varName?.trim() || 'stack'
        const values = block.startsEmpty
          ? ''
          : block.listValues
            ? block.listValues.filter((value) => value.trim()).join(', ')
            : block.value?.trim() || ''
        lines.push(`${indent}${name} = [${values}]`)
        break
      }

      case 'stack_add': {
        const name = block.listName?.trim() || 'stack'
        lines.push(`${indent}${name}.append(${block.value?.trim() || 'item'})`)
        break
      }

      case 'stack_remove': {
        const name = block.listName?.trim() || 'stack'
        const result = block.varName?.trim() || 'result'
        lines.push(`${indent}${result} = ${name}.pop()`)
        break
      }

      case 'stack_peek': {
        const name = block.listName?.trim() || 'stack'
        const result = block.varName?.trim() || 'result'
        lines.push(`${indent}${result} = ${name}[-1]`)
        break
      }

      case 'stack_size': {
        const name = block.listName?.trim() || 'stack'
        const result = block.varName?.trim() || 'result'
        lines.push(`${indent}${result} = len(${name})`)
        break
      }

      case 'stack_empty': {
        const name = block.listName?.trim() || 'stack'
        const result = block.varName?.trim() || 'result'
        lines.push(`${indent}${result} = not ${name}`)
        break
      }

      case 'stack_clear': {
        const name = block.listName?.trim() || 'stack'
        lines.push(`${indent}${name}.clear()`)
        break
      }

      case 'queue_create': {
        const name = block.varName?.trim() || 'queue'
        const values = block.startsEmpty
          ? ''
          : block.listValues
            ? block.listValues.filter((value) => value.trim()).join(', ')
            : block.value?.trim() || ''
        lines.push(`${indent}${name} = deque([${values}])`)
        break
      }

      case 'queue_add': {
        const name = block.listName?.trim() || 'queue'
        lines.push(`${indent}${name}.append(${block.value?.trim() || 'item'})`)
        break
      }

      case 'queue_remove': {
        const name = block.listName?.trim() || 'queue'
        const result = block.varName?.trim() || 'result'
        lines.push(`${indent}${result} = ${name}.popleft()`)
        break
      }

      case 'queue_peek': {
        const name = block.listName?.trim() || 'queue'
        const result = block.varName?.trim() || 'result'
        lines.push(`${indent}${result} = ${name}[0]`)
        break
      }

      case 'queue_size': {
        const name = block.listName?.trim() || 'queue'
        const result = block.varName?.trim() || 'result'
        lines.push(`${indent}${result} = len(${name})`)
        break
      }

      case 'queue_empty': {
        const name = block.listName?.trim() || 'queue'
        const result = block.varName?.trim() || 'result'
        lines.push(`${indent}${result} = not ${name}`)
        break
      }

      case 'queue_clear': {
        const name = block.listName?.trim() || 'queue'
        lines.push(`${indent}${name}.clear()`)
        break
      }

      case 'dict_create': {
        const name = block.varName?.trim() || 'my_dict'
        const val = block.startsEmpty
          ? ''
          : block.dictionaryEntries
            ? block.dictionaryEntries
                .filter((entry) => entry.key.trim() && entry.value.trim())
                .map((entry) => `${JSON.stringify(entry.key)}: ${entry.value}`)
                .join(', ')
            : block.value?.trim() || ''
        lines.push(`${indent}${name} = {${val}}`)
        break
      }

      case 'dict_set': {
        const name = block.listName?.trim() || 'my_dict'
        const key = block.valueVariable?.trim() || 'key'
        const value = block.value?.trim() || 'value'
        lines.push(`${indent}${name}[${JSON.stringify(key)}] = ${value}`)
        break
      }

      case 'dict_get': {
        const result = block.varName?.trim() || 'result'
        const name = block.listName?.trim() || 'my_dict'
        const key = block.valueVariable?.trim() || 'key'
        lines.push(`${indent}${result} = ${name}.get(${JSON.stringify(key)})`)
        break
      }

      case 'dict_remove': {
        const name = block.listName?.trim() || 'my_dict'
        const key = block.valueVariable?.trim() || 'key'
        lines.push(`${indent}${name}.pop(${JSON.stringify(key)}, None)`)
        break
      }

      case 'dict_keys': {
        const result = block.varName?.trim() || 'keys'
        const name = block.listName?.trim() || 'my_dict'
        lines.push(`${indent}${result} = list(${name}.keys())`)
        break
      }

      case 'random_integer': {
        const name = block.varName?.trim() || 'number'
        const start = block.rangeStart?.trim() || '1'
        const end = block.rangeCount?.trim() || '10'
        lines.push(`${indent}${name} = random.randint(${start}, ${end})`)
        break
      }

      case 'random_choice': {
        const name = block.varName?.trim() || 'item'
        const list = block.listName?.trim() || 'items'
        lines.push(`${indent}${name} = random.choice(${list})`)
        break
      }

      case 'random_shuffle': {
        const list = block.listName?.trim() || 'items'
        lines.push(`${indent}random.shuffle(${list})`)
        break
      }

      case 'custom_code': {
        const code = block.customCode ?? ''
        const codeLines = code.split('\n')
        for (const cl of codeLines) {
          lines.push(`${indent}${cl}`)
        }
        break
      }
    }
  }

  return lines.join('\n')
}

function containerBody(
  children: BlockItem[] | undefined,
  indentLevel: number,
): string {
  const body = children?.length
    ? generatePythonBody(children, indentLevel + 1)
    : ''
  const nonEmptyLines = body.split('\n').filter((line) => line.trim())
  const hasStatement = nonEmptyLines.some((line) => {
    const trimmed = line.trim()
    return trimmed && !trimmed.startsWith('#')
  })
  return hasStatement
    ? body
    : `${nonEmptyLines.length ? `${nonEmptyLines.join('\n')}\n` : ''}${'    '.repeat(indentLevel + 1)}pass`
}

function guidedCondition(block: BlockItem): string {
  if (block.conditionKind === 'boolean')
    return block.conditionBoolean === 'False' ? 'False' : 'True'

  const left = block.conditionLeft?.trim()
  const operator = block.conditionOperator?.trim()
  const right = block.conditionRight?.trim()
  return left && operator && right
    ? `${left} ${operator} ${right}`
    : block.condition?.trim() || 'True'
}

function listItemExpression(
  list: string,
  position: BlockItem['firstItem'],
): string {
  if (!list) return 'None'
  switch (position) {
    case 'first':
      return `${list}[0]`
    case 'second_last':
      return `${list}[-2]`
    case 'last':
    default:
      return `${list}[-1]`
  }
}

function guidedValue(block: BlockItem): string {
  if (block.valueKind === 'variable') return block.valueVariable?.trim() || '0'
  return block.value?.trim() || '0'
}

function operandValue(
  operand: BlockItem['valueOperand'],
  fallback: string | undefined,
): string {
  if (operand?.kind === 'variable') return operand.name.trim()
  if (operand?.kind === 'number') return operand.value.trim()
  return fallback?.trim() ?? ''
}
