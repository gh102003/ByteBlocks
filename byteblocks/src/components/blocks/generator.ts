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
        const val = block.value?.trim() || '0'
        lines.push(`${indent}${name} = ${val}`)
        break
      }

      case 'var_change': {
        const name = block.varName?.trim() || 'x'
        const val = block.value?.trim() || '1'
        lines.push(`${indent}${name} += ${val}`)
        break
      }

      case 'print': {
        const val = block.value !== undefined ? block.value : '"Hello World!"'
        lines.push(`${indent}print(${val})`)
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
        const condition = block.condition?.trim() || 'True'
        lines.push(`${indent}while ${condition}:`)

        if (block.children && block.children.length > 0) {
          lines.push(generatePython(block.children, indentLevel + 1))
        } else {
          lines.push(`${indent}    pass`)
        }
        break
      }

      case 'if_condition': {
        const condition = block.condition?.trim() || 'True'
        lines.push(`${indent}if ${condition}:`)

        if (block.children && block.children.length > 0) {
          lines.push(generatePython(block.children, indentLevel + 1))
        } else {
          lines.push(`${indent}    pass`)
        }
        break
      }

      case 'if_else': {
        const condition = block.condition?.trim() || 'True'
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
        const val = block.value?.trim() || ''
        lines.push(`${indent}${name} = [${val}]`)
        break
      }

      case 'list_append': {
        const listName = block.listName?.trim() || 'my_list'
        const val = block.value?.trim() || 'item'
        lines.push(`${indent}${listName}.append(${val})`)
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
