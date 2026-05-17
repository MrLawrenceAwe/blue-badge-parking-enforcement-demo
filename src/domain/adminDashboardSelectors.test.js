import { describe, expect, it } from 'vitest';
import { buildAdminDashboard } from './adminDashboardSelectors';

describe('buildAdminDashboard', () => {
  it('filters admin records by risk and selected badge', () => {
    const badges = [
      { id: 'BB-1', holder: 'One', vehicle: 'AA11 AAA', council: 'Council', status: 'valid' },
      { id: 'BB-2', holder: 'Two', vehicle: 'BB22 BBB', council: 'Council', status: 'stolen' },
    ];
    const cases = [
      { id: 'CASE-1', badgeId: 'BB-2', status: 'High priority' },
      { id: 'CASE-2', badgeId: 'UNKNOWN', status: 'Officer review' },
    ];
    const verificationByBadge = {
      'BB-1': { score: 0, riskBand: 'normal' },
      'BB-2': { score: 90, riskBand: 'high' },
    };

    const dashboard = buildAdminDashboard({
      badges,
      sessions: [],
      scans: [],
      cases,
      filters: { search: '', risk: 'high', location: '', date: '', badgeStatus: 'all' },
      verificationByBadge,
      selectedBadgeId: 'BB-2',
    });

    expect(dashboard.filteredBadges.map((badge) => badge.id)).toEqual(['BB-2']);
    expect(dashboard.selectedBadgeCases.map((caseRecord) => caseRecord.id)).toEqual(['CASE-1']);
    expect(dashboard.reviewQueueCases.map((caseRecord) => caseRecord.id)).toEqual(['CASE-1', 'CASE-2']);
  });
});
