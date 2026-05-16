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
  adminDashboard,
  filterForm,
  selectedBadge,
  caseForm,
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
        <AdminFilters filterForm={filterForm} filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} />
      </div>

      <section className="dashboard-grid">
        {activeSectionId === 'overview' && (
          <AdminOverviewTab
            filteredBadges={adminDashboard.filteredBadges}
            filteredActiveSessions={adminDashboard.filteredActiveSessions}
            filteredScans={adminDashboard.filteredScans}
            reviewQueueCases={adminDashboard.reviewQueueCases}
            suspendedOrStolenBadges={adminDashboard.suspendedOrStolenBadges}
            riskByBadge={adminDashboard.riskByBadge}
            selectBadge={caseActions.selectBadge}
          />
        )}

        {activeSectionId === 'cases' && (
          <CaseManagementTab
            allBadges={adminDashboard.allBadges}
            selectedBadge={selectedBadge}
            selectedBadgeCases={adminDashboard.selectedBadgeCases}
            caseForm={caseForm.values}
            updateCaseForm={caseForm.update}
            noteDraftByCaseId={caseForm.noteDraftByCaseId}
            setNoteDraftByCaseId={caseForm.setNoteDraftByCaseId}
            adminMessage={adminMessage}
            caseActions={caseActions}
          />
        )}

        {activeSectionId === 'riskRules' && <RiskRulesTab riskRules={riskRules.values} updateRiskRule={riskRules.update} riskRuleNotice={riskRules.notice} />}

        {activeSectionId === 'audit' && (
          <AuditTab
            auditEvents={adminDashboard.auditEvents}
            notifications={adminDashboard.notifications}
            replacementRequests={adminDashboard.replacementRequests}
          />
        )}
      </section>
    </div>
  );
}
