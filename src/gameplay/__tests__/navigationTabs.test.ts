import { describe, expect, it } from 'vitest';
import {
  ALL_NAVIGATION_ITEMS,
  NAVIGATION_GROUPS,
  NAVIGATION_TABS,
  centeredTabScrollLeft,
  isNavigationTab,
  shouldBlockGlobalShortcut,
} from '../navigationTabs';
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

  it('keeps desktop, mobile and shortcut navigation on the same metadata registry', () => {
    expect(new Set(ALL_NAVIGATION_ITEMS.map((item) => item.id))).toEqual(new Set(NAVIGATION_TABS));
    expect(ALL_NAVIGATION_ITEMS).toHaveLength(NAVIGATION_TABS.length);
    expect(NAVIGATION_GROUPS.every((group) => group.group && group.tabs.length > 0)).toBe(true);
    expect(new Set(ALL_NAVIGATION_ITEMS.map((item) => item.key)).size).toBe(ALL_NAVIGATION_ITEMS.length);
    expect(ALL_NAVIGATION_ITEMS.every((item) => item.label && item.icon)).toBe(true);
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

  it('blocks background shortcuts while a dialog or editor owns keyboard focus', () => {
    expect(shouldBlockGlobalShortcut({ hasOpenDialog: true })).toBe(true);
    expect(shouldBlockGlobalShortcut({ hasOpenDialog: false, targetTagName: 'input' })).toBe(true);
    expect(shouldBlockGlobalShortcut({ hasOpenDialog: false, targetIsContentEditable: true })).toBe(true);
    expect(shouldBlockGlobalShortcut({ hasOpenDialog: false, targetTagName: 'button' })).toBe(false);
  });

  it('centers the active mobile tab without scrolling beyond either edge', () => {
    expect(centeredTabScrollLeft({
      currentScrollLeft: 120,
      activeOffsetLeft: 260,
      activeWidth: 80,
      containerWidth: 360,
      maxScrollLeft: 540,
    })).toBe(240);
    expect(centeredTabScrollLeft({
      currentScrollLeft: 0,
      activeOffsetLeft: 10,
      activeWidth: 70,
      containerWidth: 360,
      maxScrollLeft: 540,
    })).toBe(0);
    expect(centeredTabScrollLeft({
      currentScrollLeft: 500,
      activeOffsetLeft: 350,
      activeWidth: 90,
      containerWidth: 360,
      maxScrollLeft: 540,
    })).toBe(540);
  });
});
