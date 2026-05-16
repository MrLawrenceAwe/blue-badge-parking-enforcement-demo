import { useState } from 'react';
import { AdminFilters } from './AdminFilters';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AuditTab } from './AuditTab';
import { CaseManagementTab } from './CaseManagementTab';
import { RiskRulesTab } from './RiskRulesTab';

const adminSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'cases', label: 'Cases' },
  { id: 'riskRules', label: 'Risk rules' },
  { id: 'audit', label: 'Audit' }
];

export function AdminView({
  filteredBadges,
  allBadges,
  filteredActiveSessions,
  filteredScans,
  selectedBadgeCases,
  riskByBadge,
  filters,
  selectedBadge,
  newCaseDraft,
  updateNewCaseDraft,
  noteDraftByCaseId,
  setNoteDraftByCaseId,
  auditEvents,
  notifications,
  replacementRequests,
  riskRules,
  adminActions,
  adminMessage,
  reviewQueueCases,
  restrictedBadges
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('overview');

  return (
    <div className="admin-layout">
      <div className="admin-controls">
        <div className="tab-list" role="tablist" aria-label="Admin sections">
          {adminSections.map((section) => (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={activeSectionId === section.id}
              className={activeSectionId === section.id ? 'active' : ''}
              onClick={() => setActiveSectionId(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>
        <AdminFilters filters={filters} filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} />
      </div>

      <section className="dashboard-grid">
        {activeSectionId === 'overview' && (
          <AdminOverviewTab
            filteredBadges={filteredBadges}
            filteredActiveSessions={filteredActiveSessions}
            filteredScans={filteredScans}
            reviewQueueCases={reviewQueueCases}
            restrictedBadges={restrictedBadges}
            riskByBadge={riskByBadge}
            selectBadge={adminActions.selectBadge}
          />
        )}

        {activeSectionId === 'cases' && (
          <CaseManagementTab
            allBadges={allBadges}
            selectedBadge={selectedBadge}
            selectedBadgeCases={selectedBadgeCases}
            newCaseDraft={newCaseDraft}
            updateNewCaseDraft={updateNewCaseDraft}
            noteDraftByCaseId={noteDraftByCaseId}
            setNoteDraftByCaseId={setNoteDraftByCaseId}
            adminMessage={adminMessage}
            caseActions={adminActions}
          />
        )}

        {activeSectionId === 'riskRules' && <RiskRulesTab riskRules={riskRules} updateRiskRule={adminActions.updateRiskRule} />}

        {activeSectionId === 'audit' && (
          <AuditTab
            auditEvents={auditEvents}
            notifications={notifications}
            replacementRequests={replacementRequests}
          />
        )}
      </section>
    </div>
  );
}
