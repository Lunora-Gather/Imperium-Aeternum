import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../../../../index.html', import.meta.url), 'utf8');

describe('browser security policy', () => {
  it('does not permit arbitrary network or framed content', () => {
    const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("connect-src 'self' https://*.cloud.appwrite.io wss://*.cloud.appwrite.io");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).not.toMatch(/connect-src[^;]*\shttps:\s/);
    expect(csp).not.toMatch(/connect-src[^;]*\swss:\s/);
  });
});
