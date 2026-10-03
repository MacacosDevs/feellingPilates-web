import { rmSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, preview } from 'vite';
import productionConfig from '../../vite.config.ts';

const readinessToken = process.env.WEB_UX_TEST_READY;
if (!readinessToken) throw new Error('The test server requires its own readiness token');

const outputDir = await mkdtemp(join(tmpdir(), 'web-ux-playwright-build-'));
// Vite also handles SIGTERM and exits; synchronous exit cleanup covers that
// handler as well as build/start failures.
process.once('exit', () => rmSync(outputDir, { recursive: true, force: true }));

await build({
  ...productionConfig,
  configFile: false,
  envDir: false,
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('https://api.test.invalid/api') },
  build: { outDir: outputDir, emptyOutDir: true },
  plugins: [
    ...(productionConfig.plugins ?? []),
    {
      name: 'verify-production-test-isolation',
      generateBundle() {
        const modules = [...this.getModuleIds()];
        const tooling = modules.filter(id => /\/tests\/|\.test\.[tj]sx?$|\/test-support\/|\/node_modules\/(?:vitest|@vitest|@testing-library|msw|@mswjs|jsdom|playwright|@playwright)\//.test(id));
        if (tooling.length) throw new Error(`Test tooling reached production: ${tooling.join(', ')}`);
        console.log(`PRODUCTION_GRAPH_PROOF: ${modules.length} modules; zero test/tooling/mock modules`);
      },
    },
  ],
});

const server = await preview({
  configFile: false,
  envDir: false,
  build: { outDir: outputDir },
  preview: { host: '127.0.0.1', port: 4179, strictPort: true },
  plugins: [{
      name: 'test-child-readiness',
      configurePreviewServer(vite) {
        vite.middlewares.use((request, response, next) => {
          if (request.url === `/__test_ready/${readinessToken}`) {
            response.statusCode = 200;
            response.end(`web-ux test child ready ${readinessToken}`);
          } else {
            next();
          }
        });
      },
    }],
});

function shutdown() {
  server.httpServer.close(() => process.exit(0));
  if ('closeAllConnections' in server.httpServer) server.httpServer.closeAllConnections();
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
