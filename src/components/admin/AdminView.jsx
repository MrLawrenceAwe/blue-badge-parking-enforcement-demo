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
  records,
  filters,
  selectedBadge,
  caseDraft,
  caseActions,
  riskRules,
  adminMessage
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
            filteredBadges={records.filteredBadges}
            filteredActiveSessions={records.filteredActiveSessions}
            filteredScans={records.filteredScans}
            reviewQueueCases={records.reviewQueueCases}
            restrictedBadges={records.restrictedBadges}
            riskByBadge={records.riskByBadge}
            selectBadge={caseActions.selectBadge}
          />
        )}

        {activeSectionId === 'cases' && (
          <CaseManagementTab
            allBadges={records.allBadges}
            selectedBadge={selectedBadge}
            selectedBadgeCases={records.selectedBadgeCases}
            newCaseDraft={caseDraft.values}
            updateNewCaseDraft={caseDraft.update}
            noteDraftByCaseId={caseDraft.noteDraftByCaseId}
            setNoteDraftByCaseId={caseDraft.setNoteDraftByCaseId}
            adminMessage={adminMessage}
            caseActions={caseActions}
          />
        )}

        {activeSectionId === 'riskRules' && <RiskRulesTab riskRules={riskRules.values} updateRiskRule={riskRules.update} riskRuleNotice={riskRules.notice} />}

        {activeSectionId === 'audit' && (
          <AuditTab
            auditEvents={records.auditEvents}
            notifications={records.notifications}
            replacementRequests={records.replacementRequests}
          />
        )}
      </section>
    </div>
  );
}
