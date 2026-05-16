import { describe, expect, it } from 'vitest';
import { evaluateBadgeRisk, normaliseRiskRules, validateRiskRules, VERIFICATION_STATUS } from './risk';

const validBadge = {
  id: 'BB-WCC-104928',
  status: 'valid',
  vehicle: 'LS24 HRT',
  usualLocations: ['Oxford Street'],
};

describe('evaluateBadgeRisk', () => {
  it('marks unknown badge scans as invalid high risk', () => {
    const risk = evaluateBadgeRisk(null, [], []);

    expect(risk.score).toBe(100);
    expect(risk.verificationStatus).toBe(VERIFICATION_STATUS.invalid);
    expect(risk.triggers[0].type).toBe('unknownBadge');
  });

  it('marks stolen badges as deactivated critical risk', () => {
    const risk = evaluateBadgeRisk({ ...validBadge, status: 'stolen' }, [], []);

    expect(risk.score).toBeGreaterThanOrEqual(85);
    expect(risk.verificationStatus).toBe(VERIFICATION_STATUS.deactivated);
    expect(risk.triggers.some((trigger) => trigger.type === 'stolenBadge')).toBe(true);
  });

  it('flags unregistered vehicle use', () => {
    const risk = evaluateBadgeRisk(validBadge, [], [], { vehicle: 'WR64 BAD' });

    expect(risk.verificationStatus).toBe(VERIFICATION_STATUS.suspicious);
    expect(risk.triggers.some((trigger) => trigger.type === 'unregisteredVehicle')).toBe(true);
  });

  it('flags impossible travel between nearby scans in time but distant locations', () => {
    const risk = evaluateBadgeRisk(
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

    expect(risk.triggers.some((trigger) => trigger.type === 'impossibleTravel')).toBe(true);
  });

  it('normalises malformed persisted risk rules before scoring', () => {
    const risk = evaluateBadgeRisk(validBadge, [], [], { vehicle: 'WR64 BAD' }, {
      highRiskThreshold: 200,
      reviewThreshold: 150,
      monitorThreshold: 120,
      impossibleTravelWindowMins: -1,
      impossibleTravelMinDistanceKm: -1,
      longStayMinutes: -1,
      weights: { unregisteredVehicle: 999 },
    });

    expect(risk.score).toBe(100);
    expect(risk.verificationStatus).toBe(VERIFICATION_STATUS.invalid);
  });

  it('validates threshold ordering for council risk rules', () => {
    expect(validateRiskRules({
      ...normaliseRiskRules(),
      highRiskThreshold: 50,
      reviewThreshold: 60,
    })).toEqual({
      valid: false,
      issues: ['highRiskThreshold must be greater than or equal to reviewThreshold'],
    });
  });
});
