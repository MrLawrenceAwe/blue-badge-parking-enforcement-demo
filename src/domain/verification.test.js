import { describe, expect, it } from 'vitest';
import { assessBadgeVerificationRisk, normaliseVerificationRules, validateVerificationRules, VERIFICATION_STATUS } from './verification';

const validBadge = {
  id: 'BB-WCC-104928',
  status: 'valid',
  vehicle: 'LS24 HRT',
  usualLocations: ['Oxford Street'],
};

describe('assessBadgeVerificationRisk', () => {
  it('marks unknown badge scans as invalid high-priority', () => {
    const verification = assessBadgeVerificationRisk(null, [], []);

    expect(verification.reviewScore).toBe(100);
    expect(verification.verificationStatus).toBe(VERIFICATION_STATUS.invalid);
    expect(verification.triggers[0].type).toBe('unknownBadge');
  });

  it('marks stolen badges as deactivated critical verification', () => {
    const verification = assessBadgeVerificationRisk({ ...validBadge, status: 'stolen' }, [], []);

    expect(verification.reviewScore).toBeGreaterThanOrEqual(85);
    expect(verification.verificationStatus).toBe(VERIFICATION_STATUS.deactivated);
    expect(verification.triggers.some((trigger) => trigger.type === 'stolenBadge')).toBe(true);
  });

  it('flags unregistered vehicle use', () => {
    const verification = assessBadgeVerificationRisk(validBadge, [], [], { vehicle: 'WR64 BAD' });

    expect(verification.verificationStatus).toBe(VERIFICATION_STATUS.suspicious);
    expect(verification.triggers.some((trigger) => trigger.type === 'unregisteredVehicle')).toBe(true);
  });

  it('flags impossible travel between nearby scans in time but distant locations', () => {
    const verification = assessBadgeVerificationRisk(
      validBadge,
      [],
      [
        {
          badgeId: validBadge.id,
          time: '2026-05-16T10:00:00+01:00',
          gps: '51.5152, -0.1419',
          scanOutcome: 'valid',
        },
      ],
      {
        time: '2026-05-16T10:20:00+01:00',
        gps: '51.4700, -0.4543',
      },
    );

    expect(verification.triggers.some((trigger) => trigger.type === 'impossibleTravel')).toBe(true);
  });

  it('normalises malformed persisted verification rules before scoring', () => {
    const verification = assessBadgeVerificationRisk(validBadge, [], [], { vehicle: 'WR64 BAD' }, {
      highRiskThreshold: 200,
      reviewThreshold: 150,
      monitorThreshold: 120,
      impossibleTravelWindowMins: -1,
      impossibleTravelMinDistanceKm: -1,
      longStayMinutes: -1,
      weights: { unregisteredVehicle: 999 },
    });

    expect(verification.reviewScore).toBe(100);
    expect(verification.verificationStatus).toBe(VERIFICATION_STATUS.invalid);
  });

  it('validates threshold ordering for council verification rules', () => {
    expect(validateVerificationRules({
      ...normaliseVerificationRules(),
      highRiskThreshold: 50,
      reviewThreshold: 60,
    })).toEqual({
      valid: false,
      issues: ['highRiskThreshold must be greater than or equal to reviewThreshold'],
    });
  });
});
