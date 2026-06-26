import { describe, expect, it } from 'vitest';
import { getOnboardingStep, nextOnboardingIndex, onboardingProgress, ONBOARDING_STEPS, prevOnboardingIndex } from '../onboarding';

describe('guided onboarding route', () => {
  it('covers the complete new-player and returning-player loop', () => {
    expect(ONBOARDING_STEPS.map((step) => step.id)).toEqual([
      'dashboard',
      'ambition',
      'readiness',
      'action',
      'turn',
      'save',
    ]);
    expect(new Set(ONBOARDING_STEPS.map((step) => step.id)).size).toBe(ONBOARDING_STEPS.length);
  });

  it('each step has actionable text and a valid target tab', () => {
    const allowedTabs = new Set(['dashboard', 'province', 'economy', 'politics', 'military', 'diplomacy', 'tech', 'report', 'save']);
    for (const step of ONBOARDING_STEPS) {
      expect(step.title.length).toBeGreaterThan(3);
      expect(step.body.length).toBeGreaterThan(20);
      expect(step.cta.length).toBeGreaterThan(2);
      expect(allowedTabs.has(step.tab)).toBe(true);
    }
  });

  it('clamps navigation indices safely', () => {
    expect(getOnboardingStep(-99)).toBe(ONBOARDING_STEPS[0]);
    expect(getOnboardingStep(999)).toBe(ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1]);
    expect(prevOnboardingIndex(-1)).toBe(0);
    expect(nextOnboardingIndex(999)).toBe(ONBOARDING_STEPS.length - 1);
  });

  it('reports progress consistently', () => {
    expect(onboardingProgress(0)).toEqual({ current: 1, total: ONBOARDING_STEPS.length, done: false });
    expect(onboardingProgress(ONBOARDING_STEPS.length - 1)).toEqual({ current: ONBOARDING_STEPS.length, total: ONBOARDING_STEPS.length, done: true });
  });
});
