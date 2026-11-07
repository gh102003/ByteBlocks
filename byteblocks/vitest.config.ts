import { defineConfig, mergeConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    optimizeDeps: { include: ['vitest-browser-react'] },
    plugins: [
      {
        name: 'sandbox-network-probe',
        configureServer(server) {
          let attempts = 0
          server.middlewares.use('/__sandbox_probe__', (request, response) => {
            response.setHeader('Access-Control-Allow-Origin', '*')
            response.setHeader('Cache-Control', 'no-store')
            if (request.url?.startsWith('/count')) {
              response.setHeader('Content-Type', 'application/json')
              response.end(JSON.stringify({ attempts }))
            } else {
              attempts++
              response.setHeader('Content-Type', 'text/javascript')
              response.end('export const probe = true;')
            }
          })
        },
      },
    ],
    test: {
      include: ['tests/**/*.test.{ts,tsx}'],
      testTimeout: 75000,
      fileParallelism: false,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [
          {
            browser:
              process.env.VITEST_BROWSER === 'webkit' ? 'webkit' : 'chromium',
          },
        ],
        viewport: { width: 1440, height: 1000 },
      },
    },
  }),
)
