import { describe, expect, it } from 'vitest';
import { selectAdminDashboardData } from './adminDashboardSelectors';

describe('selectAdminDashboardData', () => {
  it('filters admin records by review priority and selected badge', () => {
    const badges = [
      { id: 'BB-1', holder: 'One', vehicle: 'AA11 AAA', council: 'Council', status: 'valid' },
      { id: 'BB-2', holder: 'Two', vehicle: 'BB22 BBB', council: 'Council', status: 'stolen' },
    ];
    const cases = [
      { id: 'CASE-1', badgeId: 'BB-2', status: 'High-priority' },
      { id: 'CASE-2', badgeId: 'UNKNOWN', status: 'Needs review' },
    ];
    const verificationByBadge = {
      'BB-1': { reviewScore: 0, reviewPriority: 'normal' },
      'BB-2': { reviewScore: 90, reviewPriority: 'high' },
    };

    const dashboard = selectAdminDashboardData({
      badges,
      sessions: [],
      scans: [],
      cases,
      filters: { search: '', reviewPriority: 'high', location: '', date: '', badgeStatus: 'all' },
      verificationByBadge,
      selectedBadgeId: 'BB-2',
    });

    expect(dashboard.filteredBadges.map((badge) => badge.id)).toEqual(['BB-2']);
    expect(dashboard.selectedBadgeCases.map((caseRecord) => caseRecord.id)).toEqual(['CASE-1']);
    expect(dashboard.reviewQueueCases.map((caseRecord) => caseRecord.id)).toEqual(['CASE-1', 'CASE-2']);
  });
});
