import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { it, expect } from 'vitest';

const run = promisify(execFile);

it('verifies lazy assets and rejects a stale build carrying the same release version', async () => {
  const dist = await mkdtemp(join(tmpdir(), 'imperium-pages-'));
  const server = createServer(async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname.slice('/game/'.length) || 'index.html';
    try { res.end(await readFile(join(dist, path))); }
    catch { res.writeHead(404).end(); }
  });
  try {
    const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    const html = '<title>Imperium Aeternum</title><meta http-equiv="Content-Security-Policy"><div id="root"></div><script src="assets/main.js"></script><link href="assets/game.css">';
    await mkdir(join(dist, 'assets'));
    await writeFile(join(dist, 'index.html'), html);
    await writeFile(join(dist, '404.html'), html);
    await writeFile(join(dist, 'assets/main.js'), JSON.stringify([version, '刷新并恢复']));
    await writeFile(join(dist, 'assets/game.css'), '.ia-screen-stack{}.ia-map-search{}');
    const lazyFile = join(dist, 'assets/report.js');
    await writeFile(lazyFile, 'export default "year-end report"');
    const script = 'scripts/verify-production.mjs';
    const { stdout } = await run(process.execPath, [script, '--manifest', dist]);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/game/`;
    const verify = () => run(process.execPath, [script, url], {
      env: { ...process.env, EXPECTED_PAGES_FILES: stdout.trim(), PRODUCTION_VERIFY_ATTEMPTS: '1' },
    });
    expect(JSON.parse((await verify()).stdout)).toMatchObject({ ok: true, verifiedFiles: 5 });
    await writeFile(join(dist, 'index.html'), html + '<!-- previous build -->');
    await expect(verify()).rejects.toMatchObject({ stderr: expect.stringContaining('differs from the candidate: index.html') });
    await writeFile(join(dist, 'index.html'), html);
    await writeFile(lazyFile, 'export default null');
    await expect(verify()).rejects.toMatchObject({ stderr: expect.stringContaining('differs from the candidate: assets/report.js') });
    await rm(lazyFile);
    await expect(verify()).rejects.toMatchObject({ stderr: expect.stringContaining('report.js returned HTTP 404') });
  } finally {
    if (server.listening) await new Promise(resolve => server.close(resolve));
    await rm(dist, { recursive: true, force: true });
  }
});
