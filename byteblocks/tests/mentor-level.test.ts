import { describe, expect, test } from 'vitest'
import { resolveMentorLevel } from '../src/ai/mentorLevel'
import type { LearningProfile } from '../src/preferences'

const execution = { output: [] }

function profile(score: number): LearningProfile {
  return {
    diagnosticComplete: true,
    concepts: {
      arrays: score,
      loops: score,
      dictionaries: score,
      searching: score,
      stacks: score,
      debugging: score,
    },
  }
}

describe('automatic mentor calibration', () => {
  test('uses the learner skills check ahead of advanced pasted syntax', () => {
    expect(
      resolveMentorLevel(
        'auto',
        'class Solution:\n  async def solve(self): pass',
        execution,
        profile(0),
      ),
    ).toBe('beginner')
  })

  test('uses sustained concept mastery for advanced guidance', () => {
    expect(
      resolveMentorLevel('auto', 'print("hi")', execution, profile(2)),
    ).toBe('senior')
  })

  test('keeps manual mentor selections as an override', () => {
    expect(
      resolveMentorLevel('intermediate', 'print("hi")', execution, profile(0)),
    ).toBe('intermediate')
  })
})
