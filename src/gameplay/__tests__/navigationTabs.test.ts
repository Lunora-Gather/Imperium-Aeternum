import { describe, expect, it } from 'vitest';
import { NAVIGATION_TABS, isNavigationTab } from '../navigationTabs';
import { ONBOARDING_STEPS } from '../onboarding';

describe('navigation tab contract', () => {
  it('keeps the central tab registry unique and complete for the app shell', () => {
    expect(new Set(NAVIGATION_TABS).size).toBe(NAVIGATION_TABS.length);
    expect(NAVIGATION_TABS).toEqual([
      'dashboard',
      'map',
      'province',
      'economy',
      'population',
      'politics',
      'military',
      'diplomacy',
      'tech',
      'stats',
      'report',
      'chronicle',
      'save',
    ]);
  });

  it('accepts known tabs and rejects invalid route strings', () => {
    expect(isNavigationTab('dashboard')).toBe(true);
    expect(isNavigationTab('save')).toBe(true);
    expect(isNavigationTab('unknown')).toBe(false);
    expect(isNavigationTab('')).toBe(false);
    expect(isNavigationTab(null)).toBe(false);
  });

  it('keeps onboarding route targets valid', () => {
    expect(ONBOARDING_STEPS.every((step) => isNavigationTab(step.tab))).toBe(true);
  });
});
