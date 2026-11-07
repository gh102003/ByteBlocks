import type { BlockItem } from './types'

export interface PresetTemplate {
  id: string
  name: string
  description: string
  blocks: BlockItem[]
  beginner?: boolean
}

/** Every example is built only from the Scratch-style palette. */
export const PRESETS: PresetTemplate[] = [
  {
    id: 'two-sum-function',
    name: 'Two Sum Function',
    description: 'Start the required two_sum(nums, target) function',
    beginner: true,
    blocks: [
      {
        id: 'p-two-sum-1',
        type: 'function_def',
        funcName: 'two_sum',
        functionArgs: ['nums', 'target'],
        isProblemFunction: true,
        children: [
          {
            id: 'p-two-sum-2',
            type: 'comment',
            commentText: 'Add blocks here to find two indices.',
          },
        ],
      },
    ],
  },
  {
    id: 'hello',
    name: 'Hello, ByteBlocks!',
    description: 'Make a number, then say it',
    beginner: true,
    blocks: [
      {
        id: 'p-hello-1',
        type: 'var_set',
        varName: 'score',
        value: '10',
        valueKind: 'number',
      },
      { id: 'p-hello-2', type: 'print', value: 'My score is:', isText: true },
      { id: 'p-hello-3', type: 'print', value: 'score', isText: false },
    ],
  },
  {
    id: 'list-check',
    name: 'Check a List',
    description: 'Make a list, then check whether it contains a value',
    beginner: true,
    blocks: [
      {
        id: 'p-list-1',
        type: 'list_create',
        varName: 'scores',
        listValues: ['5', '10', '15', ''],
      },
      {
        id: 'p-list-2',
        type: 'var_set',
        varName: 'target',
        value: '10',
        valueKind: 'number',
      },
      {
        id: 'p-list-3',
        type: 'if_collection_contains',
        valueVariable: 'target',
        collectionName: 'scores',
        children: [
          { id: 'p-list-4', type: 'print', value: 'Found it!', isText: true },
        ],
      },
    ],
  },
  {
    id: 'count-up',
    name: 'Count Up',
    description: 'Repeat and say the current count',
    beginner: true,
    blocks: [
      {
        id: 'p-count-1',
        type: 'for_range',
        varName: 'count',
        rangeCount: '5',
        children: [
          { id: 'p-count-2', type: 'print', value: 'count', isText: false },
        ],
      },
    ],
  },
  {
    id: 'last-score',
    name: 'Read the Last Score',
    description: 'Choose an item from a list with a menu',
    beginner: true,
    blocks: [
      {
        id: 'p-last-1',
        type: 'list_create',
        varName: 'scores',
        listValues: ['12', '18', '25', ''],
      },
      {
        id: 'p-last-2',
        type: 'list_get',
        varName: 'latest',
        listName: 'scores',
        valueIndexValue: '-1',
      },
      { id: 'p-last-3', type: 'print', value: 'latest', isText: false },
    ],
  },
]
