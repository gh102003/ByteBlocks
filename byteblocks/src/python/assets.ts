import loader from 'pyodide/pyodide.mjs?raw'
import core from 'pyodide/pyodide.asm.mjs?raw'
import lockfile from 'pyodide/pyodide-lock.json?raw'
import wasmUrl from 'pyodide/pyodide.asm.wasm?url'
import stdlibUrl from 'pyodide/python_stdlib.zip?url'

export type RuntimeAssets = {
  loader: string
  core: string
  lockfile: string
  wasm: ArrayBuffer
  stdlib: ArrayBuffer
}

let cachedAssets: Promise<RuntimeAssets> | undefined

async function readAsset(url: string) {
  const response = await fetch(url, { credentials: 'omit' })
  if (!response.ok)
    throw new Error(
      'Could not load the local Python runtime. Please reload and try again.',
    )
  return response.arrayBuffer()
}

export function loadRuntimeAssets(): Promise<RuntimeAssets> {
  cachedAssets ??= Promise.all([readAsset(wasmUrl), readAsset(stdlibUrl)])
    .then(([wasm, stdlib]) => ({ loader, core, lockfile, wasm, stdlib }))
    .catch((error: unknown) => {
      cachedAssets = undefined
      throw error
    })
  return cachedAssets
}
