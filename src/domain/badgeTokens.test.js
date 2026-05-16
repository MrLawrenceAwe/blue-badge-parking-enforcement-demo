import { describe, expect, it } from 'vitest';
import { validateBadgeTokenPayload } from './badgeTokens';

const badge = {
  id: 'BB-WCC-104928',
  council: 'Westminster City Council',
  status: 'valid',
};

describe('validateBadgeTokenPayload', () => {
  it('accepts a current token for the expected badge and council', () => {
    const payload = {
      badgeId: badge.id,
      council: badge.council,
      iss: 'blue-badge-demo',
      aud: 'enforcement-scan',
      exp: 1780000000,
    };

    expect(validateBadgeTokenPayload(payload, { badge, now: new Date('2026-05-16T10:00:00+01:00') })).toBe(true);
  });

  it('rejects expired tokens', () => {
    const payload = {
      badgeId: badge.id,
      exp: 100,
    };

    expect(validateBadgeTokenPayload(payload, { badge, now: new Date('2026-05-16T10:00:00+01:00') })).toBe(false);
  });

  it('rejects badge or council mismatches', () => {
    expect(validateBadgeTokenPayload({ badgeId: 'BB-OTHER', council: badge.council }, { badge })).toBe(false);
    expect(validateBadgeTokenPayload({ badgeId: badge.id, council: 'Other Council' }, { badge })).toBe(false);
  });
});
