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

  it('generates clean python for all presets without crashing', () => {
    for (const preset of PRESETS) {
      const code = generatePython(preset.blocks)
      expect(typeof code).toBe('string')
      expect(code.length).toBeGreaterThan(0)
    }
  })
})
