import { mascotName } from './mascot'
import type { Mascot } from './mascot'

export function NibbleSprite({
  size = 'medium',
  standing = false,
  mascot = 'nibble',
}: {
  size?: 'small' | 'medium' | 'large'
  standing?: boolean
  mascot?: Mascot
}) {
  const name = mascotName(mascot)
  return (
    <svg
      className={`nibble-sprite nibble-sprite-${mascot} nibble-sprite-${size} ${standing ? 'nibble-standing' : ''}`}
      viewBox={standing ? '0 0 60 130' : '0 0 60 70'}
      role="img"
      aria-label={`${name}, the ByteBlocks assistant`}
      shapeRendering="crispEdges"
    >
      <g className="mascot-bob">
        {mascot === 'nibble' && (
          <g className="nibble-ears">
            <rect x="0" y="0" width="20" height="30" fill="#5db5ed" />
            <rect x="10" y="10" width="10" height="10" fill="#a9e5ff" />
            <rect x="40" y="0" width="20" height="30" fill="#5db5ed" />
            <rect x="40" y="10" width="10" height="10" fill="#a9e5ff" />
          </g>
        )}
        {mascot === 'chomp' && (
          <g className="chomp-spines">
            <rect x="10" y="10" width="10" height="10" fill="#d94b42" />
            <rect x="20" y="0" width="10" height="10" fill="#ff8573" />
            <rect x="30" y="10" width="10" height="10" fill="#a62d36" />
          </g>
        )}
        <g className="mascot-head">
          <rect
            className="mascot-face"
            x="0"
            y={standing ? 20 : 20}
            width="60"
            height="50"
          />
          <rect className="mascot-eye" x="10" y="40" width="10" height="10" />
          <rect className="mascot-eye" x="40" y="40" width="10" height="10" />
          {mascot === 'nibble' && (
            <g fill="#fff9dc">
              <rect x="20" y="60" width="10" height="10" />
              <rect
                x="30"
                y="60"
                width="10"
                height="10"
                stroke="#cce4e6"
                strokeWidth="1"
              />
            </g>
          )}
          {mascot === 'bite' && (
            <rect x="10" y="60" width="40" height="10" fill="#3a1820" />
          )}
          {mascot === 'chomp' && (
            <g>
              <rect x="40" y="50" width="20" height="20" fill="#98db80" />
              <rect x="40" y="60" width="20" height="10" fill="#153f36" />
              <rect x="50" y="60" width="10" height="10" fill="#f8f4d8" />
            </g>
          )}
        </g>
        {standing && (
          <g className="mascot-body">
            <rect
              x="10"
              y="60"
              width="40"
              height="50"
              fill="#28669e"
              stroke="#123b66"
              strokeWidth="2"
            />
            <rect x="20" y="60" width="20" height="30" fill="#f5f0df" />
            <path d="M30 70h10v30H30l-5-5 5-5-5-5z" fill="#ef806d" />
            <g className="mascot-arm mascot-arm-left">
              <rect x="0" y="70" width="10" height="30" fill="#5db5ed" />
            </g>
            <g className="mascot-arm mascot-arm-right">
              <rect x="50" y="70" width="10" height="30" fill="#5db5ed" />
            </g>
            <rect x="10" y="110" width="20" height="20" fill="#102e50" />
            <rect x="30" y="110" width="20" height="20" fill="#102e50" />
            <path d="M10 120h20m0 0h20" stroke="#071a30" strokeWidth="10" />
          </g>
        )}
      </g>
    </svg>
  )
}
