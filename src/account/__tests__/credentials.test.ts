import { describe, expect, it } from 'vitest';
import { checkDisplayName, checkEmail, checkPassword, normalizeOtp } from '../credentials';

describe('account credential validation', () => {
  it('requires a plausible email', () => {
    expect(checkEmail('ruler@example.com').valid).toBe(true);
    expect(checkEmail('ruler@').valid).toBe(false);
  });

  it('requires a useful password and display name', () => {
    expect(checkPassword('Imperium42').valid).toBe(true);
    expect(checkPassword('abcdefgh').valid).toBe(false);
    expect(checkDisplayName('执政官').valid).toBe(true);
    expect(checkDisplayName('王').valid).toBe(false);
  });

  it('normalizes pasted verification codes', () => {
    expect(normalizeOtp('12 34-567')).toBe('123456');
  });
});
