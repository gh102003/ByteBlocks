import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createEditor } from '../src/editor'
import '../src/index.css'
import '../src/App.css'

let editor: ReturnType<typeof createEditor> | undefined
let container: HTMLDivElement | undefined

afterEach(() => {
  editor?.dispose()
  container?.remove()
})

test('loads the folding icon font and toggles Python code folding', async () => {
  container = document.createElement('div')
  container.style.cssText = 'width: 600px; height: 300px'
  document.body.append(container)
  editor = createEditor(
    container,
    'def two_sum(nums, target):\n    return []\n',
    {
      onChange: () => {},
      onCursorChange: () => {},
      onRun: () => {},
    },
  )

  const expandedIcon = () =>
    container!.querySelector<HTMLElement>('.codicon-folding-expanded')
  await expect.poll(expandedIcon).toBeTruthy()
  const icon = expandedIcon()!
  const glyph = getComputedStyle(icon, '::before').content.slice(1, -1)
  expect(glyph).not.toBe('')
  expect(getComputedStyle(icon).fontFamily).toBe('codicon')
  const fonts = await document.fonts.load('16px codicon', glyph)
  expect(fonts.length).toBeGreaterThan(0)
  expect(fonts.every((font) => font.status === 'loaded')).toBe(true)

  await userEvent.click(icon)
  const collapsedIcon = () =>
    container!.querySelector<HTMLElement>('.codicon-folding-collapsed')
  await expect.poll(collapsedIcon).toBeTruthy()
  await userEvent.click(collapsedIcon()!)
  await expect.poll(expandedIcon).toBeTruthy()
})
