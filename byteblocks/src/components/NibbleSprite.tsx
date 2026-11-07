export function NibbleSprite({
  size = 'medium',
  standing = false,
}: {
  size?: 'small' | 'medium' | 'large'
  standing?: boolean
}) {
  return (
    <span
      className={`nibble-sprite nibble-sprite-${size} ${standing ? 'nibble-standing' : ''}`}
      role="img"
      aria-label="Nibble, the ByteBlocks assistant"
    >
      <span className="nibble-ear nibble-ear-left" />
      <span className="nibble-ear nibble-ear-right" />
      <span className="nibble-face">
        <i className="nibble-eye nibble-eye-left" />
        <i className="nibble-eye nibble-eye-right" />
        <i className="nibble-tooth nibble-tooth-left" />
        <i className="nibble-tooth nibble-tooth-right" />
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
