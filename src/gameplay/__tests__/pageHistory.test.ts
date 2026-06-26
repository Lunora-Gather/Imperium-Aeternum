import { describe, expect, it } from 'vitest';
import { pushPageHistory, resolveBackTarget } from '../pageHistory';

describe('page history navigation', () => {
  it('pushes the current page when navigating to a different page', () => {
    const history = pushPageHistory([], 'dashboard', 'economy');
    expect(history).toEqual(['dashboard']);
  });

  it('does not push duplicates when navigating to the same page', () => {
    const history = pushPageHistory(['dashboard'], 'economy', 'economy');
    expect(history).toEqual(['dashboard']);
  });

  it('resolves back to the latest distinct previous page and pops it', () => {
    const resolved = resolveBackTarget(['dashboard', 'economy', 'province'], 'military', 'dashboard');
    expect(resolved).toEqual({ target: 'province', history: ['dashboard', 'economy'], usedFallback: false });
  });

  it('skips same-page history entries before falling back', () => {
    const resolved = resolveBackTarget(['dashboard', 'economy', 'economy'], 'economy', 'dashboard');
    expect(resolved).toEqual({ target: 'dashboard', history: [], usedFallback: false });
  });

  it('falls back to dashboard when there is no previous page', () => {
    const resolved = resolveBackTarget([], 'dashboard', 'dashboard');
    expect(resolved).toEqual({ target: 'dashboard', history: [], usedFallback: true });
  });

  it('caps long navigation history', () => {
    const history = pushPageHistory(['a', 'b', 'c'], 'd', 'e', 3);
    expect(history).toEqual(['b', 'c', 'd']);
  });
});
