import { useState } from 'react';
import { AdminFilters } from './AdminFilters';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AuditTab } from './AuditTab';
import { CaseManagementTab } from './CaseManagementTab';
import { RiskRulesTab } from './RiskRulesTab';

const adminTabs = ['Overview', 'Cases', 'Risk rules', 'Audit'];

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
            filteredActiveSessions={filteredActiveSessions}
            filteredScans={filteredScans}
            reviewQueueCases={reviewQueueCases}
            restrictedBadges={restrictedBadges}
            riskByBadge={riskByBadge}
            selectBadge={adminActions.selectBadge}
          />
        )}

        {activeTab === 'Cases' && (
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

        {activeTab === 'Risk rules' && <RiskRulesTab riskRules={riskRules} updateRiskRule={adminActions.updateRiskRule} />}

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
