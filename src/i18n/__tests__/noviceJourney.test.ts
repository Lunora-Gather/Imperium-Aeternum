import { describe, expect, it } from 'vitest';
import { NOVICE_JOURNEY_STEPS } from '../../gameplay/noviceJourney';
import { hasExplicitTranslation, translate } from '../index';

describe('novice journey translations', () => {
  it('provides explicit English copy for every dynamic step field', () => {
    const fields = NOVICE_JOURNEY_STEPS.flatMap((step) => [
      step.title,
      step.body,
      step.why,
      step.cta,
      step.completionHint,
    ]);

    for (const source of fields) {
      expect(hasExplicitTranslation(source, 'en'), source).toBe(true);
      expect(translate(source, {}, 'en'), source).not.toMatch(/[\u3400-\u9fff]/u);
    }
  });
});
