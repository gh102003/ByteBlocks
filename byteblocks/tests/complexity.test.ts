import { describe, expect, it } from 'vitest'
import { estimateComplexity } from '../src/components/complexity'

describe('complexity estimates', () => {
  it('estimates loops and collection growth', () => {
    const result = estimateComplexity(`seen = {}
for item in items:
    seen[item] = True`)
    expect(result.time).toBe('O(n)')
    expect(result.space).toBe('O(n)')
  })

  it('distinguishes nested, sequential, and fixed loops', () => {
    expect(
      estimateComplexity('for x in xs:\n    for y in ys:\n        print(x, y)')
        .time,
    ).toBe('O(n^2)')
    expect(
      estimateComplexity('for x in xs:\n    pass\nfor y in ys:\n    pass').time,
    ).toBe('O(n)')
    expect(estimateComplexity('for x in range(10):\n    pass').time).toBe(
      'O(1)',
    )
  })

  it('does not present unsupported loops or recursion as known', () => {
    expect(estimateComplexity('while n:\n    n //= 2').time).toBe('Unknown')
    expect(estimateComplexity('def f(n):\n    return f(n - 1)').time).toBe(
      'Unknown',
    )
    expect(estimateComplexity('def f(n):\n    return n\nf(1)').time).toBe(
      'O(1)',
    )
  })
})
