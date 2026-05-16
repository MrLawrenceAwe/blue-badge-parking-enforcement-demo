import { describe, expect, it } from 'vitest';
import { nextRecordId } from './ids';

describe('record IDs', () => {
  it('uses the highest existing matching ID instead of array length', () => {
    expect(nextRecordId([{ id: 'CASE-4200' }, { id: 'CASE-4205' }], 'CASE-', 4199)).toBe('CASE-4206');
  });

  it('ignores non-matching IDs and starts after the fallback', () => {
    expect(nextRecordId([{ id: 'AUD-1001' }], 'CASE-', 4199)).toBe('CASE-4200');
  });
});
