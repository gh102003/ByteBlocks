import { describe, it, expect } from 'vitest'
import { generatePython } from '../src/components/blocks/generator'
import { PRESETS } from '../src/components/blocks/presets'
import type { BlockItem } from '../src/components/blocks/types'

describe('Block Generator to Python', () => {
  it('generates basic variable assignment and print', () => {
    const blocks: BlockItem[] = [
      { id: '1', type: 'var_set', varName: 'score', value: '100' },
      { id: '2', type: 'print', value: 'score' },
    ]
    const code = generatePython(blocks)
    expect(code).toBe('score = 100\nprint(score)')
  })

  it('generates indented loop with body', () => {
    const blocks: BlockItem[] = [
      {
        id: '1',
        type: 'for_range',
        varName: 'i',
        rangeStart: '1',
        rangeCount: '4',
        children: [{ id: '2', type: 'print', value: 'i' }],
      },
    ]
    const code = generatePython(blocks)
    expect(code).toBe('for i in range(1, 4):\n    print(i)')
  })

  it('generates if / else with indentation', () => {
    const blocks: BlockItem[] = [
      {
        id: '1',
        type: 'if_else',
        condition: 'x > 0',
        children: [{ id: '2', type: 'print', value: '"positive"' }],
        elseChildren: [{ id: '3', type: 'print', value: '"zero or negative"' }],
      },
    ]
    const code = generatePython(blocks)
    expect(code).toBe(
      'if x > 0:\n    print("positive")\nelse:\n    print("zero or negative")',
    )
  })

  it('generates stack and queue operations with LIFO and FIFO ends', () => {
    const blocks: BlockItem[] = [
      { id: '1', type: 'stack_create', varName: 's', value: '1, 2' },
      { id: '2', type: 'stack_add', listName: 's', value: '3' },
      { id: '3', type: 'stack_peek', listName: 's', varName: 'top' },
      { id: '4', type: 'stack_remove', listName: 's', varName: 'popped' },
      { id: '5', type: 'queue_create', varName: 'q', value: '1, 2' },
      { id: '6', type: 'queue_add', listName: 'q', value: '3' },
      { id: '7', type: 'queue_peek', listName: 'q', varName: 'front' },
      { id: '8', type: 'queue_remove', listName: 'q', varName: 'removed' },
      { id: '9', type: 'queue_size', listName: 'q', varName: 'size' },
      { id: '10', type: 'stack_empty', listName: 's', varName: 'empty' },
      { id: '11', type: 'queue_clear', listName: 'q' },
      { id: '12', type: 'stack_clear', listName: 's' },
    ]
    expect(generatePython(blocks)).toBe(
      [
        'from collections import deque',
        's = [1, 2]',
        's.append(3)',
        'top = s[-1]',
        'popped = s.pop()',
        'q = deque([1, 2])',
        'q.append(3)',
        'front = q[0]',
        'removed = q.popleft()',
        'size = len(q)',
        'empty = not s',
        'q.clear()',
        's.clear()',
      ].join('\n'),
    )
  })

  it('generates clean python for all presets without crashing', () => {
    for (const preset of PRESETS) {
      const code = generatePython(preset.blocks)
      expect(typeof code).toBe('string')
      expect(code.length).toBeGreaterThan(0)
    }
  })
})
