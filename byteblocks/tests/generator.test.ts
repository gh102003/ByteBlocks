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

  it('generates guided math and comparison controls as Python', () => {
    const blocks: BlockItem[] = [
      {
        id: '1',
        type: 'var_set',
        varName: 'total',
        value: '4',
        operator: '*',
        rightValue: '3',
      },
      {
        id: '2',
        type: 'if_condition',
        conditionLeft: 'total',
        conditionOperator: '>=',
        conditionRight: '12',
        children: [{ id: '3', type: 'print', value: 'total' }],
      },
    ]

    expect(generatePython(blocks)).toBe(
      'total = 4 * 3\nif total >= 12:\n    print(total)',
    )
  })

  it('generates list-item math without exposing list indexing in the block', () => {
    expect(
      generatePython([
        {
          id: '1',
          type: 'list_item_math',
          varName: 'next_number',
          sourceList: 'numbers',
          firstItem: 'last',
          operator: '+',
          secondItem: 'second_last',
        },
      ]),
    ).toBe('next_number = numbers[-1] + numbers[-2]')
  })

  it('generates a selected list item as a value', () => {
    expect(
      generatePython([
        { id: '1', type: 'list_create', varName: 'scores', value: '3, 8' },
        {
          id: '2',
          type: 'var_set',
          varName: 'latest',
          valueKind: 'list_item',
          valueList: 'scores',
          valueIndex: 'last',
        },
      ]),
    ).toBe('scores = [3, 8]\nlatest = scores[-1]')
  })

  it('generates a list from individual value sockets', () => {
    expect(
      generatePython([
        {
          id: '1',
          type: 'list_create',
          varName: 'scores',
          listValues: ['3', '8', ''],
        },
      ]),
    ).toBe('scores = [3, 8]')
  })

  it('generates a collection-membership block', () => {
    expect(
      generatePython([
        { id: '1', type: 'list_create', varName: 'scores', listValues: ['5'] },
        { id: '2', type: 'var_set', varName: 'target', value: '5' },
        {
          id: '3',
          type: 'if_collection_contains',
          valueVariable: 'target',
          collectionName: 'scores',
          children: [{ id: '4', type: 'print', value: 'Found!', isText: true }],
        },
      ]),
    ).toBe(
      'scores = [5]\ntarget = 5\nif target in scores:\n    print("Found!")',
    )
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
