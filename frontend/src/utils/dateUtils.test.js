import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeDateValue, isEpochLikeDate } from './dateUtils.js';

test('normalizeDateValue treats null and epoch values as missing', () => {
  assert.equal(normalizeDateValue(null), null);
  assert.equal(normalizeDateValue(''), null);
  assert.equal(normalizeDateValue('0'), null);
  assert.equal(normalizeDateValue('1970-01-01T00:00:00.000Z'), null);
});

test('normalizeDateValue keeps real dates intact', () => {
  const value = '2026-06-09T12:34:56.000Z';
  assert.equal(normalizeDateValue(value), value);
});

test('isEpochLikeDate flags zero and 1970 values', () => {
  assert.equal(isEpochLikeDate('0'), true);
  assert.equal(isEpochLikeDate('1970-01-01T00:00:00.000Z'), true);
  assert.equal(isEpochLikeDate('2026-06-09T12:34:56.000Z'), false);
});
