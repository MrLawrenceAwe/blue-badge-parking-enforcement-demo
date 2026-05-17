import { describe, expect, it } from 'vitest';
import { migratePersistedEnforcementState } from './useEnforcementStore';

describe('migratePersistedEnforcementState', () => {
  it('maps legacy case assignment fields into assignedTeam', () => {
    const migratedState = migratePersistedEnforcementState({
      badges: [],
      sessions: [],
      scans: [],
      cases: [
        {
          id: 'CASE-1',
          badgeId: 'UNKNOWN',
          title: 'Legacy case',
          status: 'Officer review',
          assignedTo: 'Legacy Team',
          notes: [],
          evidenceItems: [],
        },
      ],
      auditEvents: [],
      notifications: [],
      replacementRequests: [],
      riskRules: {},
    });

    expect(migratedState.cases[0].assignedTeam).toBe('Legacy Team');
  });
});
