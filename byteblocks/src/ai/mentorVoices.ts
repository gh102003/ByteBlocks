import type { ResolvedMentorLevel } from './mentorLevel'

// Ordered by mentor size: bright/high, warm/middle, deep/low. These are
// account-available ElevenLabs voices; IDs are public configuration, not keys.
export const MENTOR_VOICES = {
  beginner: {
    voiceId: '1lXLcaBSLzgfQ2dCVmRt',
    name: 'Minty',
    description:
      'Goofy, mischievous American elf; high-pitched and slightly raspy.',
  },
  intermediate: {
    voiceId: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    description: 'Warm British storyteller; middle pitch.',
  },
  senior: {
    voiceId: 'nPczCjzI2devNBz1zQrb',
    name: 'Brian',
    description: 'Deep, resonant American voice; lowest pitch.',
  },
} as const satisfies Record<
  ResolvedMentorLevel,
  { voiceId: string; name: string; description: string }
>
