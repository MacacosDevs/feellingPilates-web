import { expect, test } from 'vitest';
import { aIso } from './fechas';

test('aIso preserves the local calendar day and pads month and day', () => {
  expect(aIso(new Date(2026, 0, 2, 23, 30))).toBe('2026-01-02');
});
