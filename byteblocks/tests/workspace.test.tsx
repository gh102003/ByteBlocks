import { beforeEach, describe, expect, test } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import App from '../src/App'
import '../src/index.css'

const STORAGE_KEY = 'byteblocks.main.py'

beforeEach(() => {
  localStorage.clear()
})

describe('Desktop coding workspace', () => {
  test('switches helper tabs with the mouse and keyboard and labels the complexity estimate', async () => {
    await render(<App />)
    await expect
      .element(page.getByRole('tab', { name: 'Goal', exact: true }))
      .toHaveAttribute('aria-selected', 'true')
    await expect
      .element(page.getByRole('heading', { name: 'Two Sum.' }))
      .toBeVisible()
    await page.getByRole('tab', { name: 'Complexity', exact: true }).click()
    await expect
      .element(
        page.getByText('Based on the current Python code.', {
          exact: false,
        }),
      )
      .toBeVisible()
    await userEvent.keyboard('{ArrowRight}')
    await expect
      .element(page.getByRole('tab', { name: 'Visualizer', exact: true }))
      .toHaveAttribute('aria-selected', 'true')
    await expect
      .element(page.getByRole('heading', { name: 'No execution recorded' }))
      .toBeVisible()
  })

  test('shows only the current stage and locks future challenges', async () => {
    await render(<App />)
    await page.getByRole('tab', { name: 'Goal', exact: true }).click()
    await expect
      .element(page.getByRole('heading', { name: 'Find a pair' }))
      .toBeVisible()
    expect(document.body.textContent).not.toContain('Handle duplicates')
    const options = document.querySelectorAll<HTMLOptionElement>(
      'select[aria-label="Choose a practice question"] option',
    )
    expect(options).toHaveLength(5)
    expect(options[0].disabled).toBe(false)
    expect(options[1].disabled).toBe(true)
  })

  test('restores the unlocked challenge and stage from local progress', async () => {
    localStorage.setItem(
      'byteblocks.challenge-progress.v1',
      JSON.stringify([
        { stage: 1, bonus: false, complete: true },
        { stage: 1, bonus: false, complete: false },
        ...Array.from({ length: 3 }, () => ({
          stage: 0,
          bonus: false,
          complete: false,
        })),
      ]),
    )
    await render(<App />)
    await page.getByRole('tab', { name: 'Goal', exact: true }).click()
    await expect
      .element(page.getByRole('heading', { name: 'Bubble Sort.' }))
      .toBeVisible()
    await expect
      .element(page.getByRole('heading', { name: 'Cover edge cases' }))
      .toBeVisible()
    const options = document.querySelectorAll<HTMLOptionElement>(
      'select[aria-label="Choose a practice question"] option',
    )
    expect(options[1].disabled).toBe(false)
    expect(options[2].disabled).toBe(true)
  })

  test('switches between generated blocks and editable code', async () => {
    await render(<App />)
    await page.getByRole('button', { name: 'Edit Python code' }).click()
    await expect
      .element(page.getByRole('button', { name: 'Edit blocks' }))
      .toBeVisible()
    expect(
      document.querySelector('.blocks-canvas')?.hasAttribute('inert'),
    ).toBe(true)
    await page.getByRole('button', { name: 'Edit blocks' }).click()
    await expect
      .element(page.getByRole('button', { name: 'Edit Python code' }))
      .toBeVisible()
    expect(
      document.querySelector('.blocks-canvas')?.hasAttribute('inert'),
    ).toBe(false)
  })

  test('both dividers resize with the keyboard', async () => {
    await render(<App />)
    const columns = page.getByRole('separator', {
      name: 'Resize editor and helpers',
    })
    await columns.click()
    await userEvent.keyboard('{ArrowRight}')
    await expect.element(columns).toHaveAttribute('aria-valuenow', '69')
    const rows = page.getByRole('separator', {
      name: 'Resize helpers and coach',
    })
    await rows.click()
    await userEvent.keyboard('{ArrowUp}')
    await expect.element(rows).toHaveAttribute('aria-valuenow', '48')
  })

  test('the live coach offers prompts and starts with an empty composer', async () => {
    await render(<App />)
    const send = page.getByRole('button', { name: 'Send message' })
    await expect.element(send).toBeDisabled()
    await page.getByRole('button', { name: 'How should I start?' }).click()
    await expect
      .element(page.getByRole('textbox', { name: 'Message the coach' }))
      .toHaveValue('How should I start this stage?')
    await expect
      .element(page.getByText('DEMO', { exact: true }))
      .not.toBeInTheDocument()
  })

  test('Run opens Output and renders stdout as text', async () => {
    const output = '<img src=x onerror=alert(1)>'
    localStorage.setItem(STORAGE_KEY, `print(${JSON.stringify(output)})`)
    localStorage.setItem('byteblocks.editor.mode', 'code')
    await render(<App />)
    await page.getByRole('button', { name: 'Run code', exact: false }).click()
    await expect
      .element(page.getByRole('tab', { name: 'Output', exact: true }))
      .toHaveAttribute('aria-selected', 'true')
    await expect
      .element(page.getByText('Execution complete', { exact: true }), {
        timeout: 20000,
      })
      .toBeVisible()
    await expect
      .element(page.getByRole('log', { name: 'Python output' }))
      .toHaveTextContent(output)
    expect(document.querySelector('#panel-Output img')).toBeNull()
  })
})

test('switches themes and remembers the selection', async () => {
  localStorage.setItem('byteblocks.theme', 'dark')
  await render(<App />)
  await page.getByRole('button', { name: 'Switch to light theme' }).click()
  await expect
    .element(page.getByRole('button', { name: 'Switch to dark theme' }))
    .toBeVisible()
  expect(document.documentElement.dataset.theme).toBe('light')
  expect(localStorage.getItem('byteblocks.theme')).toBe('light')
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  expect(document.documentElement.dataset.theme).toBe('dark')
})
