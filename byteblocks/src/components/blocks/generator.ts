import type { BlockItem } from './types'

export function generatePython(blocks: BlockItem[], indentLevel = 0): string {
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

      case 'var_set': {
        const name = block.varName?.trim() || 'x'
        const baseValue = guidedValue(block)
        const operator = block.operator?.trim()
        const rightValue = block.rightValue?.trim()
        const val =
          operator && rightValue
            ? `${baseValue} ${operator} ${rightValue}`
            : baseValue
        lines.push(`${indent}${name} = ${val}`)
        break
      }

      case 'var_change': {
        const name = block.varName?.trim() || 'x'
        const val = block.value?.trim() || '1'
        lines.push(`${indent}${name} += ${val}`)
        break
      }

      case 'list_item_math': {
        const name = block.varName?.trim() || 'total'
        const list = block.sourceList?.trim() || 'numbers'
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
        const count = block.rangeCount?.trim() || '5'
        const rangeExpr = start ? `${start}, ${count}` : count
        lines.push(`${indent}for ${varName} in range(${rangeExpr}):`)

        if (block.children && block.children.length > 0) {
          lines.push(generatePython(block.children, indentLevel + 1))
        } else {
          lines.push(`${indent}    pass`)
        }
        break
      }

      case 'for_in': {
        const itemVar = block.itemVar?.trim() || 'item'
        const listName = block.listName?.trim() || 'items'
        lines.push(`${indent}for ${itemVar} in ${listName}:`)

        if (block.children && block.children.length > 0) {
          lines.push(generatePython(block.children, indentLevel + 1))
        } else {
          lines.push(`${indent}    pass`)
        }
        break
      }

      case 'while_loop': {
        const condition = guidedCondition(block)
        lines.push(`${indent}while ${condition}:`)

        if (block.children && block.children.length > 0) {
          lines.push(generatePython(block.children, indentLevel + 1))
        } else {
          lines.push(`${indent}    pass`)
        }
        break
      }

      case 'if_condition': {
        const condition = guidedCondition(block)
        lines.push(`${indent}if ${condition}:`)

        if (block.children && block.children.length > 0) {
          lines.push(generatePython(block.children, indentLevel + 1))
        } else {
          lines.push(`${indent}    pass`)
        }
        break
      }

      case 'if_else': {
        const condition = guidedCondition(block)
        lines.push(`${indent}if ${condition}:`)

        if (block.children && block.children.length > 0) {
          lines.push(generatePython(block.children, indentLevel + 1))
        } else {
          lines.push(`${indent}    pass`)
        }

        lines.push(`${indent}else:`)
        if (block.elseChildren && block.elseChildren.length > 0) {
          lines.push(generatePython(block.elseChildren, indentLevel + 1))
        } else {
          lines.push(`${indent}    pass`)
        }
        break
      }

      case 'if_collection_contains': {
        const value = block.valueVariable?.trim() || 'item'
        const collection = block.collectionName?.trim() || 'items'
        lines.push(`${indent}if ${value} in ${collection}:`)
        if (block.children && block.children.length > 0) {
          lines.push(generatePython(block.children, indentLevel + 1))
        } else {
          lines.push(`${indent}    pass`)
        }
        break
      }

      case 'break_loop': {
        lines.push(`${indent}break`)
        break
      }

      case 'function_def': {
        const name = block.funcName?.trim() || 'my_function'
        const args = block.funcArgs?.trim() || ''
        lines.push(`${indent}def ${name}(${args}):`)

        if (block.children && block.children.length > 0) {
          lines.push(generatePython(block.children, indentLevel + 1))
        } else {
          lines.push(`${indent}    pass`)
        }
        break
      }

      case 'return_val': {
        const val = block.value?.trim() || 'None'
        lines.push(`${indent}return ${val}`)
        break
      }

      case 'function_call': {
        const name = block.funcName?.trim() || 'my_function'
        const args = block.funcArgs?.trim() || ''
        lines.push(`${indent}${name}(${args})`)
        break
      }

      case 'list_create': {
        const name = block.varName?.trim() || 'my_list'
        const val = block.listValues
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

      case 'stack_create': {
        const name = block.varName?.trim() || 'stack'
        const values = block.value?.trim() || ''
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
        const values = block.value?.trim() || ''
        lines.push(`${indent}from collections import deque`)
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
        const val = block.value?.trim() || ''
        lines.push(`${indent}${name} = {${val}}`)
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

function guidedCondition(block: BlockItem): string {
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
  if (block.valueKind === 'list_item')
    return listItemExpression(
      block.valueList?.trim() || 'numbers',
      block.valueIndex,
    )
  return block.value?.trim() || '0'
}
