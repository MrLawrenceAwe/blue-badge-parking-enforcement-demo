import { useRef, useState } from 'react';
import { AdminFilters } from './AdminFilters';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AuditTab } from './AuditTab';
import { CaseManagementTab } from './CaseManagementTab';
import { VerificationRulesTab } from './VerificationRulesTab';

const adminSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'cases', label: 'Cases' },
  { id: 'verificationRules', label: 'Verification rules' },
  { id: 'audit', label: 'Audit' },
];

export function AdminView({
  adminDashboardData,
  filterForm,
  selectedBadgeId,
  selectedBadge,
  caseDraft,
  caseActions,
  verificationRules,
  adminMessage,
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

  const selectCaseForReview = (caseRecord) => {
    const hasKnownBadge = adminDashboardData.allBadges.some((badge) => badge.id === caseRecord.badgeId);
    if (hasKnownBadge) {
      caseActions.selectBadge(caseRecord.badgeId);
    }
    if (caseRecord.id) {
      caseActions.focusCase(caseRecord.id);
    }
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
        {activeSectionId !== 'verificationRules' && (
          <AdminFilters
            filterForm={filterForm}
            filtersOpen={filtersOpen}
            resultCount={adminDashboardData.filteredBadges.length}
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
            filteredBadges={adminDashboardData.filteredBadges}
            filteredActiveSessions={adminDashboardData.filteredActiveSessions}
            filteredScans={adminDashboardData.filteredScans}
            reviewQueueCases={adminDashboardData.reviewQueueCases}
            suspendedOrStolenBadges={adminDashboardData.suspendedOrStolenBadges}
            verificationByBadge={adminDashboardData.verificationByBadge}
            selectCase={selectCaseForReview}
          />
        )}

        {activeSectionId === 'cases' && (
          <CaseManagementTab
            allBadges={adminDashboardData.allBadges}
            selectedBadgeId={selectedBadgeId}
            selectedBadge={selectedBadge}
            selectedBadgeCases={adminDashboardData.selectedBadgeCases}
            caseDraft={caseDraft.values}
            updateCaseDraft={caseDraft.update}
            noteDraftByCaseId={caseDraft.noteDraftByCaseId}
            setNoteDraftByCaseId={caseDraft.setNoteDraftByCaseId}
            adminMessage={adminMessage}
            caseActions={caseActions}
          />
        )}

        {activeSectionId === 'verificationRules' && (
          <VerificationRulesTab
            verificationRules={verificationRules.values}
            updateVerificationRule={verificationRules.update}
            verificationRuleNotice={verificationRules.notice}
          />
        )}

        {activeSectionId === 'audit' && (
          <AuditTab
            auditEvents={adminDashboardData.auditEvents}
            notifications={adminDashboardData.notifications}
            replacementRequests={adminDashboardData.replacementRequests}
          />
        )}
      </section>
    </div>
  );
}
