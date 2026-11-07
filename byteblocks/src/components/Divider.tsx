import { useRef } from 'react'
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'

export function Divider({
  direction,
  value,
  onChange,
}: {
  direction: 'horizontal' | 'vertical'
  value: number
  onChange: (value: number) => void
}) {
  const dragging = useRef(false)
  const clamp = (next: number) => Math.min(70, Math.max(30, next))
  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const rect = event.currentTarget.parentElement!.getBoundingClientRect()
    const next =
      direction === 'vertical'
        ? ((event.clientX - rect.left) / rect.width) * 100
        : ((event.clientY - rect.top) / rect.height) * 100
    onChange(clamp(next))
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const decrease = direction === 'vertical' ? 'ArrowLeft' : 'ArrowUp'
    const increase = direction === 'vertical' ? 'ArrowRight' : 'ArrowDown'
    if (event.key === decrease || event.key === increase) {
      event.preventDefault()
      onChange(clamp(value + (event.key === increase ? 2 : -2)))
    }
  }
  return (
    <div
      className={`divider divider-${direction}`}
      role="separator"
      tabIndex={0}
      aria-label={
        direction === 'vertical'
          ? 'Resize editor and helpers'
          : 'Resize helpers and coach'
      }
      aria-orientation={direction}
      aria-valuemin={30}
      aria-valuemax={70}
      aria-valuenow={Math.round(value)}
      onKeyDown={onKeyDown}
      onPointerMove={move}
      onPointerDown={(event) => {
        event.currentTarget.focus()
        dragging.current = true
        event.currentTarget.setPointerCapture(event.pointerId)
        event.preventDefault()
      }}
      onPointerUp={() => {
        dragging.current = false
      }}
      onLostPointerCapture={() => {
        dragging.current = false
      }}
    >
      <span />
    </div>
  )
}
