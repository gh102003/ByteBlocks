import { beforeEach, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { VisualBlockEditor } from '../src/components/blocks/VisualBlockEditor'

const key = 'byteblocks.visual.blocks.v2'

beforeEach(() => {
  localStorage.setItem(
    key,
    JSON.stringify([
      { id: 'a', type: 'comment', commentText: 'first' },
      { id: 'b', type: 'comment', commentText: 'second' },
      { id: 'c', type: 'if_condition', condition: 'True', children: [] },
    ]),
  )
})

test('dragging reorders and moves blocks into and out of a container', async () => {
  const onPythonChange = vi.fn()
  await render(
    <VisualBlockEditor
      onPythonChange={onPythonChange}
      onRun={() => {}}
      mode="blocks"
      code=""
      onEditCode={() => {}}
      onSelectMode={() => {}}
      onCursorChange={() => {}}
    />,
  )
  const chunks = () =>
    Array.from(document.querySelectorAll<HTMLElement>('.scratch-chunk'))
  const drag = (source: HTMLElement, target: HTMLElement, y = 0) => {
    const dataTransfer = new DataTransfer()
    source
      .querySelector<HTMLElement>('.chunk-handle')!
      .dispatchEvent(
        new DragEvent('dragstart', { bubbles: true, dataTransfer }),
      )
    target.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientY: y,
      }),
    )
  }
  drag(chunks()[1], chunks()[0].querySelector<HTMLElement>('.chunk-header')!)
  await vi.waitFor(() =>
    expect(
      JSON.parse(localStorage.getItem(key)!).map((b: { id: string }) => b.id),
    ).toEqual(['b', 'a', 'c']),
  )
  drag(
    chunks()[0],
    chunks()[2].querySelector<HTMLElement>('.chunk-nested-slot')!,
  )
  await vi.waitFor(() =>
    expect(JSON.parse(localStorage.getItem(key)!)[1].children[0].id).toBe('b'),
  )
  drag(chunks()[2], chunks()[0].querySelector<HTMLElement>('.chunk-header')!)
  await vi.waitFor(() =>
    expect(
      JSON.parse(localStorage.getItem(key)!).map((b: { id: string }) => b.id),
    ).toEqual(['b', 'a', 'c']),
  )
  expect(onPythonChange).toHaveBeenLastCalledWith(
    expect.stringContaining('# second'),
  )
  expect(document.querySelector('[title="Move Up"]')).toBeNull()
})

test('deleting a block requires confirmation', async () => {
  await render(
    <VisualBlockEditor
      onPythonChange={() => {}}
      onRun={() => {}}
      mode="blocks"
      code=""
      onEditCode={() => {}}
      onSelectMode={() => {}}
      onCursorChange={() => {}}
    />,
  )
  const deleteButton = document.querySelector<HTMLButtonElement>(
    '.scratch-chunk [title="Delete Block"]',
  )!
  deleteButton.click()
  await expect
    .element(page.getByRole('alertdialog', { name: 'Delete this block?' }))
    .toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  expect(JSON.parse(localStorage.getItem(key)!)).toHaveLength(3)
  deleteButton.click()
  await page.getByRole('button', { name: 'Delete block' }).click()
  await vi.waitFor(() =>
    expect(JSON.parse(localStorage.getItem(key)!)).toHaveLength(2),
  )
})

test('function parameters are available in collection pickers', async () => {
  localStorage.setItem(
    key,
    JSON.stringify([
      {
        id: 'function',
        type: 'function_def',
        funcName: 'process',
        functionArgs: ['items'],
        children: [
          { id: 'list', type: 'list_get', listName: 'items' },
          { id: 'stack', type: 'stack_peek', listName: 'items' },
          { id: 'queue', type: 'queue_peek', listName: 'items' },
        ],
      },
    ]),
  )

  await render(
    <VisualBlockEditor
      onPythonChange={() => {}}
      onRun={() => {}}
      mode="blocks"
      code=""
      onEditCode={() => {}}
      onSelectMode={() => {}}
      onCursorChange={() => {}}
    />,
  )

  expect(
    Array.from(
      document.querySelectorAll<HTMLOptionElement>('select option'),
    ).filter((option) => option.value === 'items'),
  ).toHaveLength(3)
})
