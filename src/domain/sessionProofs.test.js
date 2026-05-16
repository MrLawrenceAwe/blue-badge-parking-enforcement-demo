import { describe, expect, it } from 'vitest';
import {
  createSignedSessionRecord,
  isSessionRecordTrusted,
  sessionIntegrityState,
  verifyStoredSessionRecord,
} from './sessionProofs';

const session = {
  id: 'PS-TEST-1',
  badgeId: 'BB-WCC-104928',
  vehicle: 'LS24 HRT',
  location: 'Oxford Street W1C',
  gps: '51.5152, -0.1419',
  startedAt: '2026-05-16T10:00:00+01:00',
  durationMins: 180,
};

describe('session proofing', () => {
  it('trusts signed locked session records', async () => {
    const signedSession = await createSignedSessionRecord(session);

    expect(signedSession.locked).toBe(true);
    expect(signedSession.proof).toEqual({
      payload: expect.any(String),
      signature: expect.any(String),
      verified: true,
    });
    expect(isSessionRecordTrusted(signedSession)).toBe(true);
    await expect(verifyStoredSessionRecord(signedSession)).resolves.toBe(true);
    expect(sessionIntegrityState(signedSession)).toBe('trusted');
  });

  it('detects lifecycle tampering after signing', async () => {
    const signedSession = await createSignedSessionRecord(session);

    expect(isSessionRecordTrusted({ ...signedSession, endedAt: '2026-05-16T10:30:00+01:00' })).toBe(false);
  });

  it('reports unsigned records as pending instead of re-signing them implicitly', () => {
    expect(sessionIntegrityState({ ...session, id: 'PS-UNSIGNED', locked: true })).toBe('pending');
  });
});
