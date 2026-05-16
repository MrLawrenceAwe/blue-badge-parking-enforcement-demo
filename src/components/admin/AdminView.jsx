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
  dashboardRecords,
  filterForm,
  selectedBadge,
  caseDraft,
  caseCommands,
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
        <AdminFilters filterForm={filterForm} filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} />
      </div>

      <section className="dashboard-grid">
        {activeSectionId === 'overview' && (
          <AdminOverviewTab
            filteredBadges={dashboardRecords.filteredBadges}
            filteredActiveSessions={dashboardRecords.filteredActiveSessions}
            filteredScans={dashboardRecords.filteredScans}
            reviewQueueCases={dashboardRecords.reviewQueueCases}
            suspendedOrStolenBadges={dashboardRecords.suspendedOrStolenBadges}
            riskByBadge={dashboardRecords.riskByBadge}
            selectBadge={caseCommands.selectBadge}
          />
        )}

        {activeSectionId === 'cases' && (
          <CaseManagementTab
            allBadges={dashboardRecords.allBadges}
            selectedBadge={selectedBadge}
            selectedBadgeCases={dashboardRecords.selectedBadgeCases}
            newCaseDraft={caseDraft.values}
            updateNewCaseDraft={caseDraft.update}
            noteDraftByCaseId={caseDraft.noteDraftByCaseId}
            setNoteDraftByCaseId={caseDraft.setNoteDraftByCaseId}
            adminMessage={adminMessage}
            caseCommands={caseCommands}
          />
        )}

        {activeSectionId === 'riskRules' && <RiskRulesTab riskRules={riskRules.values} updateRiskRule={riskRules.update} riskRuleNotice={riskRules.notice} />}

        {activeSectionId === 'audit' && (
          <AuditTab
            auditEvents={dashboardRecords.auditEvents}
            notifications={dashboardRecords.notifications}
            replacementRequests={dashboardRecords.replacementRequests}
          />
        )}
      </section>
    </div>
  );
}
