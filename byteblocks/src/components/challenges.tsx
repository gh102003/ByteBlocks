export type ChallengeId =
  | 'two-sum'
  | 'bubble-sort'
  | 'binary-search'
  | 'valid-parentheses'
  | 'word-frequency'

type Stage = { title: string; detail: string; input: string; output: string }
type Challenge = {
  id: ChallengeId
  title: string
  category: string
  difficulty: string
  summary: string
  stages: Stage[]
  bonus: Stage
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    category: 'ARRAYS',
    difficulty: 'Easy',
    summary: 'Find two numbers that add up to a target.',
    stages: [
      {
        title: 'Find a pair',
        detail:
          'Write two_sum(nums, target) to return the indices of two distinct numbers whose sum is target. The input contains distinct values and exactly one solution.',
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
      },
      {
        title: 'Handle duplicates',
        detail:
          'Make sure your solution handles repeated values and never uses the same element twice.',
        input: 'nums = [3, 3], target = 6',
        output: '[0, 1]',
      },
    ],
    bonus: {
      title: 'One-pass solution',
      detail:
        'Improve two_sum to find the pair in one pass using a dictionary. Explain its time and space complexity.',
      input: 'nums = [3, 2, 4], target = 6',
      output: '[1, 2]',
    },
  },
  {
    id: 'bubble-sort',
    title: 'Bubble Sort',
    category: 'SORTING',
    difficulty: 'Easy',
    summary: 'Sort a list by swapping adjacent values.',
    stages: [
      {
        title: 'Sort the list',
        detail:
          'Write bubble_sort(nums) to return a non-empty list of distinct numbers in ascending order using adjacent swaps.',
        input: '[5, 1, 4, 2, 8]',
        output: '[1, 2, 4, 5, 8]',
      },
      {
        title: 'Cover edge cases',
        detail:
          'Make your sort work for an empty list, duplicates, and an already sorted list.',
        input: '[3, 1, 3]',
        output: '[1, 3, 3]',
      },
    ],
    bonus: {
      title: 'Stop early',
      detail:
        'Stop after a full pass with no swaps and explain the best-case time complexity.',
      input: '[1, 2, 3]',
      output: '[1, 2, 3]',
    },
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    category: 'SEARCHING',
    difficulty: 'Medium',
    summary: 'Find a target in a sorted list.',
    stages: [
      {
        title: 'Find the target',
        detail:
          'Write binary_search(nums, target) to return the index of a target in a non-empty sorted list. The target is present; use binary search.',
        input: 'nums = [-4, 0, 3, 9, 12], target = 9',
        output: '3',
      },
      {
        title: 'Check the boundaries',
        detail:
          'Handle empty lists, missing targets, and targets at either end of the list.',
        input: 'nums = [1, 3, 5], target = 2',
        output: '-1',
      },
    ],
    bonus: {
      title: 'First occurrence',
      detail:
        'Adapt binary search to return the first index of a target when duplicates exist, in O(log n) time.',
      input: 'nums = [1, 2, 2, 2, 3], target = 2',
      output: '1',
    },
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    category: 'STACKS',
    difficulty: 'Medium',
    summary: 'Check whether brackets are balanced.',
    stages: [
      {
        title: 'Match parentheses',
        detail:
          'Write is_valid(text) to return whether parentheses in a string are balanced and correctly ordered.',
        input: '"(())"',
        output: 'True',
      },
      {
        title: 'Support bracket types',
        detail:
          'Also support square and curly brackets, requiring each closing bracket to match the most recent opening bracket.',
        input: '"([)]"',
        output: 'False',
      },
    ],
    bonus: {
      title: 'Locate the problem',
      detail:
        'Write invalid_index(text) to return the index of the first invalid closing bracket, or -1 when there is none, including when opening brackets remain unmatched.',
      input: '"([)]"',
      output: '2',
    },
  },
  {
    id: 'word-frequency',
    title: 'Word Frequency',
    category: 'DICTIONARIES',
    difficulty: 'Medium',
    summary: 'Count and compare words in a sentence.',
    stages: [
      {
        title: 'Count words',
        detail:
          'Write word_frequency(text) to return a dictionary mapping each whitespace-separated word to its count.',
        input: '"to be or to be"',
        output: "{'to': 2, 'be': 2, 'or': 1}",
      },
      {
        title: 'Normalize words',
        detail:
          'Count words case-insensitively and ignore ASCII punctuation at the beginning and end of each word, omitting words that become empty.',
        input: '"Hello, hello!"',
        output: "{'hello': 2}",
      },
    ],
    bonus: {
      title: 'Most frequent words',
      detail:
        'Write most_frequent_words(text) to return the three most frequent normalized words, breaking ties alphabetically. Handle fewer than three unique words.',
      input: '"b a b a c"',
      output: "['a', 'b', 'c']",
    },
  },
]
