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
  test('switches helper tabs with the mouse and keyboard and labels sample analysis', async () => {
    await render(<App />)
    await expect
      .element(page.getByRole('heading', { name: 'Two Sum.' }))
      .toBeVisible()
    await page.getByRole('tab', { name: 'Complexity', exact: true }).click()
    await expect
      .element(
        page.getByText('This is not an analysis of your current code.', {
          exact: false,
        }),
      )
      .toBeVisible()
    await userEvent.keyboard('{ArrowRight}')
    await expect
      .element(page.getByRole('tab', { name: 'Dataflow', exact: true }))
      .toHaveAttribute('aria-selected', 'true')
    await expect
      .element(page.getByText('Live tracing comes later.', { exact: false }))
      .toBeVisible()
  })

  test('both dividers resize with the keyboard', async () => {
    await render(<App />)
    const columns = page.getByRole('separator', {
      name: 'Resize editor and helpers',
    })
    await columns.click()
    await userEvent.keyboard('{ArrowRight}')
    await expect.element(columns).toHaveAttribute('aria-valuenow', '52')
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
    await page.getByRole('button', { name: 'Why use a dictionary?' }).click()
    await expect
      .element(page.getByRole('textbox', { name: 'Message the coach' }))
      .toHaveValue('Why use a dictionary here?')
    await expect
      .element(page.getByText('DEMO', { exact: true }))
      .not.toBeInTheDocument()
  })

  test('Run opens Output and renders stdout as text', async () => {
    const output = '<img src=x onerror=alert(1)>'
    localStorage.setItem(STORAGE_KEY, `print(${JSON.stringify(output)})`)
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
