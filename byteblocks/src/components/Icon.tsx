type IconName =
  | 'play'
  | 'stop'
  | 'check'
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

const paths: Record<IconName, string> = {
  play: 'm9 5 11 7-11 7V5Z',
  stop: 'M6 6h12v12H6z',
  check: 'm5 12 4 4L19 6',
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
