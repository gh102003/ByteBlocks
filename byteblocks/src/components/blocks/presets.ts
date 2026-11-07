import type { BlockItem } from './types'

export interface PresetTemplate {
  id: string
  name: string
  description: string
  blocks: BlockItem[]
}

export const PRESETS: PresetTemplate[] = [
  {
    id: 'fizzbuzz',
    name: 'FizzBuzz Classic',
    description: 'Loops 1 to 15, printing Fizz, Buzz, or FizzBuzz',
    blocks: [
      {
        id: 'p-fb-1',
        type: 'comment',
        commentText: 'FizzBuzz generated with ByteBlocks visual chunks',
      },
      {
        id: 'p-fb-2',
        type: 'for_range',
        varName: 'i',
        rangeStart: '1',
        rangeCount: '16',
        children: [
          {
            id: 'p-fb-3',
            type: 'if_else',
            condition: 'i % 15 == 0',
            children: [
              {
                id: 'p-fb-4',
                type: 'print',
                value: '"FizzBuzz"',
              },
            ],
            elseChildren: [
              {
                id: 'p-fb-5',
                type: 'if_else',
                condition: 'i % 3 == 0',
                children: [
                  {
                    id: 'p-fb-6',
                    type: 'print',
                    value: '"Fizz"',
                  },
                ],
                elseChildren: [
                  {
                    id: 'p-fb-7',
                    type: 'if_else',
                    condition: 'i % 5 == 0',
                    children: [
                      {
                        id: 'p-fb-8',
                        type: 'print',
                        value: '"Buzz"',
                      },
                    ],
                    elseChildren: [
                      {
                        id: 'p-fb-9',
                        type: 'print',
                        value: 'i',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'two-sum',
    name: 'Two Sum Algorithm',
    description: 'Hash-map solution for the Two Sum problem',
    blocks: [
      {
        id: 'p-ts-1',
        type: 'comment',
        commentText: 'Two Sum O(n) hash-map solution',
      },
      {
        id: 'p-ts-2',
        type: 'function_def',
        funcName: 'two_sum',
        funcArgs: 'nums, target',
        children: [
          {
            id: 'p-ts-3',
            type: 'dict_create',
            varName: 'seen',
            value: '',
          },
          {
            id: 'p-ts-4',
            type: 'for_in',
            itemVar: 'i, num',
            listName: 'enumerate(nums)',
            children: [
              {
                id: 'p-ts-5',
                type: 'var_set',
                varName: 'complement',
                value: 'target - num',
              },
              {
                id: 'p-ts-6',
                type: 'if_condition',
                condition: 'complement in seen',
                children: [
                  {
                    id: 'p-ts-7',
                    type: 'return_val',
                    value: '[seen[complement], i]',
                  },
                ],
              },
              {
                id: 'p-ts-8',
                type: 'var_set',
                varName: 'seen[num]',
                value: 'i',
              },
            ],
          },
          {
            id: 'p-ts-9',
            type: 'return_val',
            value: '[]',
          },
        ],
      },
      {
        id: 'p-ts-10',
        type: 'comment',
        commentText: 'Test the function',
      },
      {
        id: 'p-ts-11',
        type: 'var_set',
        varName: 'result',
        value: 'two_sum([2, 7, 11, 15], 9)',
      },
      {
        id: 'p-ts-12',
        type: 'print_formatted',
        value: 'Indices: {result}',
      },
    ],
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci Sequence',
    description: 'Generates the first 10 numbers in the Fibonacci sequence',
    blocks: [
      {
        id: 'p-fib-1',
        type: 'comment',
        commentText: 'Generate first 10 Fibonacci numbers',
      },
      {
        id: 'p-fib-2',
        type: 'list_create',
        varName: 'fib',
        value: '0, 1',
      },
      {
        id: 'p-fib-3',
        type: 'for_range',
        varName: 'step',
        rangeStart: '0',
        rangeCount: '8',
        children: [
          {
            id: 'p-fib-4',
            type: 'var_set',
            varName: 'next_val',
            value: 'fib[-1] + fib[-2]',
          },
          {
            id: 'p-fib-5',
            type: 'list_append',
            listName: 'fib',
            value: 'next_val',
          },
        ],
      },
      {
        id: 'p-fib-6',
        type: 'print_formatted',
        value: 'Fibonacci numbers: {fib}',
      },
    ],
  },
  {
    id: 'ascii-art',
    name: 'ASCII Art Pyramid',
    description: 'Builds a glowing pyramid in the terminal output',
    blocks: [
      {
        id: 'p-art-1',
        type: 'comment',
        commentText: 'Draw an ASCII Pyramid',
      },
      {
        id: 'p-art-2',
        type: 'var_set',
        varName: 'height',
        value: '6',
      },
      {
        id: 'p-art-3',
        type: 'for_range',
        varName: 'i',
        rangeStart: '0',
        rangeCount: 'height',
        children: [
          {
            id: 'p-art-4',
            type: 'var_set',
            varName: 'spaces',
            value: '" " * (height - i - 1)',
          },
          {
            id: 'p-art-5',
            type: 'var_set',
            varName: 'stars',
            value: '"*" * (2 * i + 1)',
          },
          {
            id: 'p-art-6',
            type: 'print',
            value: 'spaces + stars',
          },
        ],
      },
      {
        id: 'p-art-7',
        type: 'print',
        value: '"✨ Pyramid complete! ✨"',
      },
    ],
  },
]
