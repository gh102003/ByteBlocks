import { useCallback, useEffect, useRef, useState } from 'react'
import { INITIAL_RUNNER_STATE, PythonRunner } from './runner'

export function usePythonRunner() {
  const [state, setState] = useState(INITIAL_RUNNER_STATE)
  const runner = useRef<PythonRunner | null>(null)

  useEffect(() => {
    const current = new PythonRunner(setState)
    runner.current = current
    return () => {
      current.dispose()
      runner.current = null
    }
  }, [])

  const run = useCallback((code: string) => runner.current?.run(code), [])
  const stop = useCallback(() => runner.current?.stop(), [])
  const clear = useCallback(() => runner.current?.clear(), [])
  return { ...state, run, stop, clear }
}
