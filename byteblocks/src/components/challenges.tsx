import type { ReactNode } from 'react'

export type ChallengeId = 'two-sum' | 'bubble-sort' | 'binary-search'

export const CHALLENGES: Record<
  ChallengeId,
  {
    title: string
    category: string
    difficulty: string
    summary: string
    coachPrompt: string
    detail: ReactNode
    input: string
    output: string
    note: string
  }
> = {
  'two-sum': {
    title: 'Two Sum',
    category: 'ARRAYS',
    difficulty: 'Easy',
    summary: 'Find the two numbers that add up to a target.',
    coachPrompt:
      'Given integers nums and target, return the indices of two distinct elements whose sum is target. Exactly one solution exists.',
    detail: (
      <>
        Given an array of integers <code>nums</code> and an integer{' '}
        <code>target</code>, return the <strong>indices</strong> of the two
        numbers whose sum equals the target.
      </>
    ),
    input: 'nums = [2, 7, 11, 15], target = 9',
    output: '[0, 1]',
    note: 'Exactly one solution exists. You can’t use the same element twice.',
  },
  'bubble-sort': {
    title: 'Bubble Sort',
    category: 'SORTING',
    difficulty: 'Medium',
    summary: 'Sort a list in place by repeatedly swapping adjacent values.',
    coachPrompt:
      'Implement bubble_sort(nums) to sort integers in ascending order. Optimize by stopping after a pass with no swaps.',
    detail: (
      <>
        Implement <code>bubble_sort(nums)</code> to sort integers in ascending
        order. Stop early when a full pass makes no swaps, and return the sorted
        list.
      </>
    ),
    input: 'nums = [5, 1, 4, 2, 8]',
    output: '[1, 2, 4, 5, 8]',
    note: 'Consider an empty list, duplicates, and how many passes are needed.',
  },
  'binary-search': {
    title: 'Binary Search',
    category: 'SEARCHING',
    difficulty: 'Medium',
    summary: 'Find a target in a sorted list in logarithmic time.',
    coachPrompt:
      'Implement binary_search(nums, target) to return its index or -1 when absent. nums is sorted and the algorithm must run in O(log n) time.',
    detail: (
      <>
        Implement <code>binary_search(nums, target)</code> to return the
        target’s index, or <code>-1</code> if it is absent. Your algorithm must
        run in <strong>O(log n)</strong> time.
      </>
    ),
    input: 'nums = [-4, 0, 3, 9, 12], target = 9',
    output: '3',
    note: 'Maintain a correct search interval and handle empty input and missing targets.',
  },
}
