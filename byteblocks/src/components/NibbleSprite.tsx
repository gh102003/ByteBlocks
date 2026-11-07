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
    <span
      className={`nibble-sprite nibble-sprite-${mascot} nibble-sprite-${size} ${standing ? 'nibble-standing' : ''}`}
      role="img"
      aria-label={`${name}, the ByteBlocks assistant`}
    >
      {mascot === 'nibble' && (
        <>
          <span className="nibble-ear nibble-ear-left" />
          <span className="nibble-ear nibble-ear-right" />
        </>
      )}
      {mascot === 'chop' && <span className="chop-spines" />}
      <span className="nibble-face">
        <i className="nibble-eye nibble-eye-left" />
        <i className="nibble-eye nibble-eye-right" />
        {mascot === 'nibble' && (
          <>
            <i className="nibble-tooth nibble-tooth-left" />
            <i className="nibble-tooth nibble-tooth-right" />
          </>
        )}
        {mascot === 'bite' && <i className="bite-mouth" />}
        {mascot === 'chop' && <i className="chop-snout" />}
      </span>
      {standing && (
        <>
          <span className="nibble-arm nibble-arm-left" />
          <span className="nibble-arm nibble-arm-right" />
          <span className="nibble-body">
            <i className="nibble-shirt" />
            <i className="nibble-tie" />
          </span>
          <span className="nibble-foot nibble-foot-left" />
          <span className="nibble-foot nibble-foot-right" />
        </>
      )}
    </span>
  )
}
