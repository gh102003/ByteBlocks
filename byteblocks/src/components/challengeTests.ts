import type { ChallengeId } from './challenges'

type Value =
  string | number | boolean | number[] | string[] | Record<string, number>
export type TestResult = { passed: boolean; actual: string | null }
export type TestCase = { args: Value[]; expected: Value }

const pairs: [number[], number][] = [
  [[2, 7, 11, 15], 9],
  [[3, 2, 4], 6],
  [[1, 5], 6],
  [[-2, 4, 8], 2],
  [[0, 4, 6], 10],
  [[3, 3], 6],
  [[0, 0], 0],
  [[-3, 4, 3, 90], 0],
  [[1, 2, 3, 4], 7],
  [[5, 8, 12], 13],
  [[-5, -2, -1], -7],
  [[10, 1, 20, 3], 4],
  [[9, 8, 7, 5], 14],
  [[100, -100, 1], 0],
  [[4, 6, 1, 2], 3],
]
const firstPairs: [number[], number][] = [
  [[2, 7, 11, 15], 9],
  [[3, 2, 4], 6],
  [[1, 5], 6],
  [[-2, 4, 8], 2],
  [[0, 4, 6], 10],
  [[1, 3, 8], 11],
  [[-3, 4, 3, 90], 0],
  [[1, 2, 3, 4], 7],
  [[5, 8, 12], 13],
  [[-5, -2, -1], -7],
  [[10, 1, 20, 3], 4],
  [[100, -100, 1], 0],
  [[4, 6, 1, 2], 3],
  [[2, 9, 5], 14],
  [[-4, 2, 9], 5],
]
const firstSorts = [
  [5, 1, 4, 2, 8],
  [3, 1, 2],
  [9, 2, 7],
  [4, 3, 1],
  [8, 5],
  [1, 2, 3],
  [2, 1],
  [7, 3, 9],
  [5, 2, 4, 1],
  [10, 7, 8, 9],
  [11, 2, 5],
  [6, 2, 9, 4],
  [8, 7, 6, 5],
  [1, 3, 2],
  [12, 1, 7],
]
const firstSearches: [number[], number][] = [
  [[-4, 0, 3, 9, 12], 9],
  [[1, 3, 5], 3],
  [[2, 4, 6], 2],
  [[2, 4, 6], 6],
  [[1, 2], 1],
  [[1, 2], 2],
  [[-5, 0, 5], -5],
  [[-5, 0, 5], 5],
  [[1, 2, 3, 4], 2],
  [[1, 2, 3, 4], 3],
  [[10, 20, 30, 40, 50], 10],
  [[10, 20, 30, 40, 50], 50],
  [[-9, -5, -2], -5],
  [[1, 3, 7, 9, 11], 7],
  [[3, 6, 9, 12, 15, 18], 12],
]
const sorts = [
  [5, 1, 4, 2, 8],
  [3, 1, 3],
  [1, 2, 3],
  [],
  [1],
  [2, 1],
  [-1, 3, 0],
  [5, 5, 5],
  [9, 8, 7, 6],
  [0, -1, -2],
  [10, 2, 10, 2],
  [4, 3, 2, 1, 0],
  [1, 3, 2],
  [-5, -5, 2],
  [100, -100, 0, 3],
]
const searches: [number[], number][] = [
  [[-4, 0, 3, 9, 12], 9],
  [[1, 3, 5], 2],
  [[], 1],
  [[4], 4],
  [[4], 3],
  [[1, 2, 3], 1],
  [[1, 2, 3], 3],
  [[-9, -4, -1], -4],
  [[0, 2, 4, 6], 6],
  [[1, 4, 8], 9],
  [[1, 4, 8], -1],
  [[2, 4], 2],
  [[2, 4], 4],
  [[1, 2, 3, 4, 5, 6], 3],
  [[1, 2, 3, 4, 5, 6], 5],
]
const brackets = [
  '(())',
  '()',
  '(()',
  ')(',
  '',
  '()()',
  '((()))',
  '())',
  '(()())',
  ')',
  '(',
  '(()))',
  '((())',
  '())(',
  '((()()))',
]
const mixed = [
  '([)]',
  '()[]{}',
  '{[()]}',
  '([{}])',
  '',
  '(',
  ')',
  '[',
  '{]',
  '([])',
  '([)',
  '[][]',
  '{{}}',
  '[({})]',
  '(()',
]
const words = [
  'to be or to be',
  'Hello, hello!',
  '',
  'one',
  'a b a',
  'one  two',
  'A a A',
  'red blue red',
  'x x x',
  'alpha beta gamma',
  'a,b c',
  'hi! hi?',
  '... ...',
  'one\ntwo one',
  'z y x z y',
]

const bonusWords = [
  'b a b a c',
  'pear apple pear apple banana',
  'Solo solo!',
  '',
  'z y x w',
  ...words.slice(5),
]
function prioritize<T>(cases: T[], first: number[]): T[] {
  return [
    ...first.map((index) => cases[index]),
    ...cases.filter((_, index) => !first.includes(index)),
  ]
}

function valid(text: string): boolean {
  const stack: string[] = []
  const openings = '([{'
  const closings = ')]}'
  for (const char of text) {
    if (openings.includes(char)) stack.push(char)
    else if (
      closings.includes(char) &&
      stack.pop() !== openings[closings.indexOf(char)]
    )
      return false
  }
  return stack.length === 0
}
function invalidIndex(text: string): number {
  const stack: string[] = []
  const openings = '([{'
  const closings = ')]}'
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (openings.includes(char)) stack.push(char)
    else if (
      closings.includes(char) &&
      stack.pop() !== openings[closings.indexOf(char)]
    )
      return i
  }
  return -1
}
function frequencies(text: string, normalize: boolean): Record<string, number> {
  const counts: Record<string, number> = {}
  for (let word of text.trim() ? text.trim().split(/\s+/) : []) {
    if (normalize)
      word = word
        .toLowerCase()
        .replace(
          /^[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+|[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+$/g,
          '',
        )
    if (word) counts[word] = (counts[word] ?? 0) + 1
  }
  return counts
}
export function getChallengeTests(
  id: ChallengeId,
  stage: number,
  bonus: boolean,
): { functionName: string; cases: TestCase[]; pair: boolean } {
  if (id === 'two-sum')
    return {
      functionName: 'two_sum',
      pair: true,
      cases: (stage === 0 && !bonus
        ? firstPairs
        : prioritize(pairs, bonus ? [1, 5, 7, 6, 11] : [5, 6, 7, 1, 10])
      ).map(([nums, target]) => {
        const first = nums.findIndex((n, i) =>
          nums.some((m, j) => i !== j && n + m === target),
        )
        return {
          args: [nums, target],
          expected: [
            first,
            nums.findIndex((n, i) => i !== first && n + nums[first] === target),
          ],
        }
      }),
    }
  if (id === 'bubble-sort')
    return {
      functionName: 'bubble_sort',
      pair: false,
      cases: (stage === 0 && !bonus
        ? firstSorts
        : prioritize(sorts, bonus ? [2, 4, 3, 7, 0] : [3, 1, 2, 7, 4])
      ).map((nums) => ({
        args: [nums],
        expected: [...nums].sort((a, b) => a - b),
      })),
    }
  if (id === 'binary-search') {
    const examples = bonus
      ? [
          [[1, 2, 2, 2, 3], 2] as [number[], number],
          [[1, 1], 1] as [number[], number],
          [[1, 1, 2], 1] as [number[], number],
          [[0, 2, 2], 2] as [number[], number],
          [[2, 2, 2], 2] as [number[], number],
          ...searches.slice(0, 10),
        ]
      : stage === 0
        ? firstSearches
        : prioritize(searches, [2, 1, 5, 6, 4])
    return {
      functionName: 'binary_search',
      pair: false,
      cases: examples.map(([nums, target]) => ({
        args: [nums, target],
        expected: nums.indexOf(target),
      })),
    }
  }
  if (id === 'valid-parentheses')
    return {
      functionName: bonus ? 'invalid_index' : 'is_valid',
      pair: false,
      cases: (stage === 0 && !bonus ? brackets : mixed).map((text) => ({
        args: [text],
        expected: bonus ? invalidIndex(text) : valid(text),
      })),
    }
  return {
    functionName: bonus ? 'most_frequent_words' : 'word_frequency',
    pair: false,
    cases: (bonus
      ? bonusWords
      : stage === 0
        ? words
        : prioritize(words, [1, 6, 11, 12, 5])
    ).map((text) => {
      const counts = frequencies(text, stage > 0 || bonus)
      return {
        args: [text],
        expected: bonus
          ? Object.keys(counts)
              .sort(
                (a, b) => counts[b] - counts[a] || (a < b ? -1 : a > b ? 1 : 0),
              )
              .slice(0, 3)
          : counts,
      }
    }),
  }
}

export function buildTestProgram(
  code: string,
  id: ChallengeId,
  stage: number,
  bonus: boolean,
): string {
  const suite = getChallengeTests(id, stage, bonus)
  const payload = JSON.stringify(suite)
  return `${code}\n\nimport json as __bb_json\n__bb_suite = __bb_json.loads(${JSON.stringify(payload)})\n__bb_results = []\nfor __bb_case in __bb_suite['cases']:\n    try:\n        __bb_args = __bb_case['args']\n        __bb_actual = globals()[__bb_suite['functionName']](*__bb_args)\n        if __bb_suite['pair']:\n            __bb_pass = (isinstance(__bb_actual, (list, tuple)) and len(__bb_actual) == 2 and all(type(i) is int for i in __bb_actual) and 0 <= __bb_actual[0] < len(__bb_args[0]) and 0 <= __bb_actual[1] < len(__bb_args[0]) and __bb_actual[0] != __bb_actual[1] and __bb_args[0][__bb_actual[0]] + __bb_args[0][__bb_actual[1]] == __bb_args[1])\n        else:\n            __bb_expected = __bb_case['expected']\n            __bb_pass = (__bb_actual == __bb_expected and (type(__bb_expected) not in (bool, int) or type(__bb_actual) is type(__bb_expected)))\n        __bb_results.append({'passed': bool(__bb_pass), 'actual': repr(__bb_actual)[:300] if len(__bb_results) < 5 else None})\n    except Exception as __bb_error:\n        __bb_results.append({'passed': False, 'actual': (type(__bb_error).__name__ + ': ' + str(__bb_error))[:300] if len(__bb_results) < 5 else None})\nprint('BYTEBLOCKS_TEST_RESULTS:' + __bb_json.dumps(__bb_results))\n`
}
