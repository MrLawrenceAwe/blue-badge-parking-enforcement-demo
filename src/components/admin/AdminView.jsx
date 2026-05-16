import { useRef, useState } from 'react';
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
  const tabRefs = useRef({});

  const selectSection = (sectionId, shouldFocus = false) => {
    setActiveSectionId(sectionId);
    if (shouldFocus) {
      requestAnimationFrame(() => tabRefs.current[sectionId]?.focus());
    }
  };

  const handleTabKeyDown = (event, currentIndex) => {
    const lastIndex = adminSections.length - 1;
    let nextIndex;

    if (event.key === 'ArrowRight') {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = lastIndex;
    } else {
      return;
    }

    event.preventDefault();
    selectSection(adminSections[nextIndex].id, true);
  };

  const selectBadgeForCaseReview = (badgeId) => {
    caseActions.selectBadge(badgeId);
    selectSection('cases', true);
  };

  return (
    <div className="admin-layout">
      <div className="admin-controls">
        <div className="tab-list" role="tablist" aria-label="Admin sections">
          {adminSections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              role="tab"
              id={`admin-tab-${section.id}`}
              ref={(element) => {
                tabRefs.current[section.id] = element;
              }}
              aria-controls={`admin-panel-${section.id}`}
              aria-selected={activeSectionId === section.id}
              tabIndex={activeSectionId === section.id ? 0 : -1}
              className={activeSectionId === section.id ? 'active' : ''}
              onClick={() => selectSection(section.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              {section.label}
            </button>
          ))}
        </div>
        {activeSectionId !== 'riskRules' && (
          <AdminFilters
            filterForm={filterForm}
            filtersOpen={filtersOpen}
            resultCount={adminDashboard.filteredBadges.length}
            setFiltersOpen={setFiltersOpen}
          />
        )}
      </div>

      <section
        className="dashboard-grid"
        role="tabpanel"
        id={`admin-panel-${activeSectionId}`}
        aria-labelledby={`admin-tab-${activeSectionId}`}
      >
        {activeSectionId === 'overview' && (
          <AdminOverviewTab
            filteredBadges={adminDashboard.filteredBadges}
            filteredActiveSessions={adminDashboard.filteredActiveSessions}
            filteredScans={adminDashboard.filteredScans}
            reviewQueueCases={adminDashboard.reviewQueueCases}
            suspendedOrStolenBadges={adminDashboard.suspendedOrStolenBadges}
            riskByBadge={adminDashboard.riskByBadge}
            selectBadge={selectBadgeForCaseReview}
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
