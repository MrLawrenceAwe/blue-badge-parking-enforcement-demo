import { useState } from 'react';
import { AdminFilters } from './AdminFilters';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AuditTab } from './AuditTab';
import { CaseManagementTab } from './CaseManagementTab';
import { RiskRulesTab } from './RiskRulesTab';

const adminTabs = ['Overview', 'Cases', 'Rules', 'Audit'];

export function AdminView({
  filteredBadges,
  allBadges,
  visibleActiveSessions,
  visibleScans,
  selectedBadgeCases,
  riskByBadge,
  filters,
  selectedBadge,
  draftCase,
  updateDraftCase,
  caseNoteDraftsById,
  setCaseNoteDraftsById,
  auditEvents,
  notifications,
  replacementRequests,
  riskRules,
  adminActions,
  adminMessage,
  reviewQueueCases,
  deactivatedBadges
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="admin-layout">
      <div className="admin-controls">
        <div className="tab-list" role="tablist" aria-label="Admin sections">
          {adminTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <AdminFilters filters={filters} filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} />
      </div>

      <section className="dashboard-grid">
        {activeTab === 'Overview' && (
          <AdminOverviewTab
            filteredBadges={filteredBadges}
            visibleActiveSessions={visibleActiveSessions}
            visibleScans={visibleScans}
            reviewQueueCases={reviewQueueCases}
            deactivatedBadges={deactivatedBadges}
            riskByBadge={riskByBadge}
            selectBadge={adminActions.selectBadge}
          />
        )}

        {activeTab === 'Cases' && (
          <CaseManagementTab
            allBadges={allBadges}
            selectedBadge={selectedBadge}
            selectedBadgeCases={selectedBadgeCases}
            draftCase={draftCase}
            updateDraftCase={updateDraftCase}
            caseNoteDraftsById={caseNoteDraftsById}
            setCaseNoteDraftsById={setCaseNoteDraftsById}
            adminMessage={adminMessage}
            caseActions={adminActions}
          />
        )}

        {activeTab === 'Rules' && <RiskRulesTab riskRules={riskRules} updateRiskRule={adminActions.updateRiskRule} />}

        {activeTab === 'Audit' && (
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
