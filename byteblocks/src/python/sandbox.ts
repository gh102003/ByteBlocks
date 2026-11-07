import workerSource from './sandbox-worker.js?raw'
import traceSource from './trace.py?raw'

export function createSandboxDocument() {
  const nonce = crypto.randomUUID().replaceAll('-', '')
  // Blob workers inherit this CSP. unsafe-eval is required by Pyodide's FFI,
  // and is granted ONLY inside this opaque-origin execution environment.
  const policy = `default-src 'none'; script-src 'nonce-${nonce}' blob: 'unsafe-eval'; worker-src blob:; connect-src 'none'; frame-src 'none'; img-src 'none'; style-src 'none'; base-uri 'none'; form-action 'none'`
  const script = `
    (() => {
      let connected = false;
      window.addEventListener('message', (event) => {
        if (connected || event.source !== parent || event.data?.type !== 'connect' || !event.ports[0]) return;
        connected = true;
        const port = event.ports[0];
        let worker;
        port.onmessage = (event) => {
          if (worker || event.data?.type !== 'run') return;
          const url = URL.createObjectURL(new Blob([${JSON.stringify(workerSource)}], { type: 'text/javascript' }));
          // The bootstrap has no static imports. A classic blob worker works in
          // WebKit's opaque-origin frames; Pyodide itself is imported as ESM.
          worker = new Worker(url, { name: 'byteblocks-python' });
          worker.onmessage = (event) => { URL.revokeObjectURL(url); port.postMessage(event.data); };
          worker.onerror = (event) => { URL.revokeObjectURL(url); port.postMessage({ type: 'error', text: 'The Python worker failed: ' + (event.message || 'the browser could not load the isolated worker. Please try again.') }); };
          const { code, assets } = event.data;
          worker.postMessage({ code, assets, traceSource: ${JSON.stringify(traceSource)} }, [assets.wasm, assets.stdlib]);
        };
        port.start();
        port.postMessage({ type: 'ready' });
      });
    })();
  `
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"></head><body><script nonce="${nonce}">${script.replaceAll('</script', '<\\/script')}</script></body></html>`
}
