import { describe, it, expect } from 'vitest'
import { generatePython } from '../src/components/blocks/generator'
import { PRESETS } from '../src/components/blocks/presets'
import type { BlockItem } from '../src/components/blocks/types'

describe('Block Generator to Python', () => {
  it('provides a Two Sum starter with the required function signature', () => {
    const starter = PRESETS.find((preset) => preset.id === 'two-sum-function')
    expect(starter).toBeDefined()
    expect(generatePython(starter!.blocks)).toContain(
      'def two_sum(nums, target):',
    )
    expect(starter!.blocks[0].isProblemFunction).toBe(true)
    expect(generatePython(starter!.blocks)).toBe(
      'def two_sum(nums, target):\n    # Add blocks here to find two indices.\n    pass',
    )
  })

  it('provides a runnable Two Sum solution demo', () => {
    const solution = PRESETS.find((preset) => preset.id === 'two-sum-solution')
    expect(solution).toBeDefined()
    expect(generatePython(solution!.blocks)).toBe(
      'def two_sum(nums, target):\n    # Try every pair of different positions.\n    for i in range(len(nums)):\n        for j in range(len(nums)):\n            if i != j and nums[i] + nums[j] == target:\n                return [i, j]\n    return []',
    )
  })

  it('generates a function from individual parameter slots', () => {
    expect(
      generatePython([
        {
          id: 'function',
          type: 'function_def',
          funcName: 'two_sum',
          functionArgs: ['nums', 'target', ''],
        },
      ]),
    ).toBe('def two_sum(nums, target):\n    pass')
  })

  it('saves a function return value when a result variable is provided', () => {
    expect(
      generatePython([
        {
          id: 'call',
          type: 'function_call',
          funcName: 'add',
          funcArgs: '2, 3',
          varName: 'total',
        },
      ]),
    ).toBe('total = add(2, 3)')
  })

  it('adds pass when a container only contains empty code', () => {
    expect(
      generatePython([
        {
          id: 'function',
          type: 'function_def',
          funcName: 'example',
          children: [{ id: 'empty', type: 'custom_code', customCode: '' }],
        },
        { id: 'list', type: 'list_create', varName: 'numbers' },
      ]),
    ).toBe('def example():\n    pass\nnumbers = []')
  })

  it('adds pass after a comment-only function body', () => {
    expect(
      generatePython([
        {
          id: 'function',
          type: 'function_def',
          funcName: 'two_sum',
          children: [
            {
              id: 'comment',
              type: 'comment',
              commentText: 'Add blocks here to find two indices.',
            },
          ],
        },
        { id: 'list', type: 'list_create', varName: 'numbers' },
      ]),
    ).toBe(
      'def two_sum():\n    # Add blocks here to find two indices.\n    pass\nnumbers = []',
    )
  })

  it('generates basic variable assignment and print', () => {
    const blocks: BlockItem[] = [
      { id: '1', type: 'var_set', varName: 'score', value: '100' },
      { id: '2', type: 'print', value: 'score' },
    ]
    const code = generatePython(blocks)
    expect(code).toBe('score = 100\nprint(score)')
  })

  it('combines variables and supports increment and decrement blocks', () => {
    expect(
      generatePython([
        {
          id: '1',
          type: 'var_set',
          varName: 'total',
          value: 'price',
          operator: '+',
          rightValue: 'tax',
        },
        { id: '2', type: 'var_change', varName: 'total', value: '1' },
        { id: '3', type: 'var_decrement', varName: 'total', value: 'discount' },
      ]),
    ).toBe('total = price + tax\ntotal += 1\ntotal -= discount')
  })

  it('generates typed number and variable operands', () => {
    expect(
      generatePython([
        {
          id: '1',
          type: 'var_set',
          varName: 'total',
          valueOperand: { kind: 'variable', name: 'price' },
          operator: '*',
          rightOperand: { kind: 'number', value: '2' },
        },
        {
          id: '2',
          type: 'var_change',
          varName: 'total',
          valueOperand: { kind: 'variable', name: 'bonus' },
        },
      ]),
    ).toBe('total = price * 2\ntotal += bonus')
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

  it('generates boolean predicates for loops and conditionals', () => {
    expect(
      generatePython([
        {
          id: '1',
          type: 'while_loop',
          conditionKind: 'boolean',
          conditionBoolean: 'True',
          children: [{ id: '2', type: 'break_loop' }],
        },
        {
          id: '3',
          type: 'if_condition',
          conditionKind: 'boolean',
          conditionBoolean: 'False',
          children: [{ id: '4', type: 'print', value: 'unreachable' }],
        },
      ]),
    ).toBe('while True:\n    break\nif False:\n    print(unreachable)')
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

  it('generates dedicated list get and remove blocks', () => {
    expect(
      generatePython([
        {
          id: '1',
          type: 'list_get',
          varName: 'picked',
          listName: 'scores',
          valueIndexValue: 'score_index',
        },
        {
          id: '2',
          type: 'list_remove',
          listName: 'scores',
          listRemoveMode: 'index',
          value: '0',
        },
        {
          id: '3',
          type: 'list_remove',
          listName: 'scores',
          listRemoveMode: 'value',
          value: 'target',
        },
      ]),
    ).toBe('picked = scores[score_index]\nscores.pop(0)\nscores.remove(target)')
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

  it('generates an indexed loop over a list and can continue', () => {
    expect(
      generatePython([
        {
          id: '1',
          type: 'for_range',
          rangeMode: 'length',
          varName: 'i',
          listName: 'nums',
          children: [{ id: '2', type: 'continue_loop' }],
        },
      ]),
    ).toBe('for i in range(len(nums)):\n    continue')
  })

  it('supports number, variable, and list-length range endpoints', () => {
    expect(
      generatePython([
        { id: 'number', type: 'for_range', rangeCount: '3' },
        {
          id: 'variable',
          type: 'for_range',
          rangeMode: 'variable',
          rangeCount: 'count',
        },
        {
          id: 'length',
          type: 'for_range',
          rangeMode: 'length',
          listName: 'nums',
        },
      ]),
    ).toBe(
      'for i in range(3):\n    pass\nfor i in range(count):\n    pass\nfor i in range(len(nums)):\n    pass',
    )
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

  it('generates else-if chains from separate decision blocks', () => {
    expect(
      generatePython([
        { id: 'if', type: 'if_condition', condition: 'score > 90' },
        {
          id: 'elif',
          type: 'else_if',
          condition: 'score > 70',
          children: [{ id: 'print', type: 'print', value: '"good"' }],
        },
        {
          id: 'else',
          type: 'else_clause',
          children: [{ id: 'fallback', type: 'print', value: '"try again"' }],
        },
      ]),
    ).toBe(
      'if score > 90:\n    pass\nelif score > 70:\n    print("good")\nelse:\n    print("try again")',
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

  it('emits one top-level import for queues in nested branches and functions', () => {
    const blocks: BlockItem[] = [
      { id: '1', type: 'print', value: '"start"' },
      {
        id: '2',
        type: 'if_else',
        condition: 'ready',
        children: [{ id: '3', type: 'queue_create', varName: 'first' }],
        elseChildren: [
          {
            id: '4',
            type: 'function_def',
            funcName: 'make_queue',
            children: [{ id: '5', type: 'queue_create', varName: 'second' }],
          },
        ],
      },
    ]
    expect(generatePython(blocks)).toBe(
      'from collections import deque\nprint("start")\nif ready:\n    first = deque([])\nelse:\n    def make_queue():\n        second = deque([])',
    )
  })

  it('generates random operations with a single import', () => {
    expect(
      generatePython([
        {
          id: '1',
          type: 'random_integer',
          varName: 'roll',
          rangeStart: '1',
          rangeCount: '6',
        },
        {
          id: '2',
          type: 'random_choice',
          varName: 'winner',
          listName: 'players',
        },
        { id: '3', type: 'random_shuffle', listName: 'players' },
      ]),
    ).toBe(
      'import random\nroll = random.randint(1, 6)\nwinner = random.choice(players)\nrandom.shuffle(players)',
    )
  })

  it('generates dictionary mutations and safe lookups', () => {
    expect(
      generatePython([
        {
          id: '1',
          type: 'dict_create',
          varName: 'scores',
          dictionaryEntries: [{ key: 'Ada', value: '10' }],
        },
        {
          id: '2',
          type: 'dict_set',
          listName: 'scores',
          valueVariable: 'Grace',
          value: '12',
        },
        {
          id: '3',
          type: 'dict_get',
          varName: 'ada_score',
          listName: 'scores',
          valueVariable: 'Ada',
        },
        {
          id: '4',
          type: 'dict_remove',
          listName: 'scores',
          valueVariable: 'Grace',
        },
        { id: '5', type: 'dict_keys', varName: 'names', listName: 'scores' },
      ]),
    ).toBe(
      'scores = {"Ada": 10}\nscores["Grace"] = 12\nada_score = scores.get("Ada")\nscores.pop("Grace", None)\nnames = list(scores.keys())',
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
