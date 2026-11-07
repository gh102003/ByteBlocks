import type { ExperienceLevel } from '../preferences'

export type Mascot = 'nibble' | 'bite' | 'chomp'

export function mascotForLevel(level?: ExperienceLevel): Mascot {
  if (level === 'intermediate') return 'bite'
  if (level === 'senior') return 'chomp'
  return 'nibble'
}

export function mascotName(mascot: Mascot): string {
  return mascot.charAt(0).toUpperCase() + mascot.slice(1)
}
