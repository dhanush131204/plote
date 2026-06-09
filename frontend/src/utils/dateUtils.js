const EPOCH_LIKE_VALUES = new Set([
  '',
  '0',
  '0000-00-00',
  '0000-00-00T00:00:00.000Z',
  '0001-01-01T00:00:00.000Z',
  '1970-01-01',
  '1970-01-01T00:00:00.000Z',
]);

export function isEpochLikeDate(value) {
  if (value === null || value === undefined) return true;

  if (typeof value === 'number') {
    return Number.isFinite(value) && value <= 0;
  }

  const normalized = String(value).trim();
  if (!normalized) return true;
  if (EPOCH_LIKE_VALUES.has(normalized)) return true;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) || date.getTime() <= 0;
}

export function normalizeDateValue(value) {
  if (isEpochLikeDate(value)) return null;

  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return null;
    return value;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) || value.getTime() <= 0 ? null : value;
  }

  return value;
}
