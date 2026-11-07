type IconName =
  | 'pause'
  | 'first'
  | 'play'
  | 'stop'
  | 'check'
  | 'cross'
  | 'clock'
  | 'info'
  | 'chevron'
  | 'arrow'
  | 'arrowUp'
  | 'flag'
  | 'chart'
  | 'flow'
  | 'terminal'
  | 'sparkle'
  | 'shield'
  | 'code'
  | 'clear'
  | 'puzzle'
  | 'plus'
  | 'trash'
  | 'copy'
  | 'eye'
  | 'refresh'
  | 'mic'
  | 'micOff'

const paths: Record<IconName, string> = {
  pause: 'M9 5v14M15 5v14',
  first: 'M5 5v14M19 5l-9 7 9 7V5Z',
  play: 'm9 5 11 7-11 7V5Z',
  stop: 'M6 6h12v12H6z',
  check: 'm5 12 4 4L19 6',
  cross: 'M6 6l12 12M18 6 6 18',
  clock: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  info: 'M12 11v5m0-9v.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  chevron: 'm9 6 6 6-6 6',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  arrowUp: 'M12 19V5m-6 6 6-6 6 6',
  flag: 'M5 21V4m0 0c5-4 9 4 14 0v10c-5 4-9-4-14 0',
  chart: 'M4 4v16h16M8 15l4-5 4 2 4-7',
  flow: 'M4 4h6v6H4zM14 14h6v6h-6zM7 10v7h7M10 7h7v7',
  terminal: 'm5 7 5 5-5 5m8 0h6',
  sparkle: 'm12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7L12 3Z',
  shield: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm-4 9 3 3 5-6',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
  clear: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6',
  puzzle: 'M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z',
  plus: 'M12 5v14m-7-7h14',
  trash:
    'M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  copy: 'M8 8h11v12H8zM16 8V4H4v12h4',
  eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  refresh:
    'M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15',
  mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Zm-7 10a7 7 0 0 0 14 0m-7 7v3m-4 0h8',
  micOff: 'm2 2 20 20M9 9v3a3 3 0 0 0 5.12 2.12M15 9V5a3 3 0 0 0-5.83-1M5 12a7 7 0 0 0 12 4.9M12 19v3m-4 0h8',
}

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === 'play' || name === 'stop' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
