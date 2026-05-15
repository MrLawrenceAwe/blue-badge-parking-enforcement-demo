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
  caseForm,
  caseNoteDrafts,
  auditEvents,
  notifications,
  replacementRequests,
  riskRules,
  actions,
  adminMessage,
  suspiciousCases,
  stolenOrSuspendedBadges
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="admin-layout">
      <AdminFilters filters={filters} filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} />

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

      <section className="dashboard-grid">
        {activeTab === 'Overview' && (
          <AdminOverviewTab
            filteredBadges={filteredBadges}
            visibleActiveSessions={visibleActiveSessions}
            visibleScans={visibleScans}
            suspiciousCases={suspiciousCases}
            stolenOrSuspendedBadges={stolenOrSuspendedBadges}
            riskByBadge={riskByBadge}
            selectBadge={actions.selectBadge}
          />
        )}

        {activeTab === 'Cases' && (
          <CaseManagementTab
            allBadges={allBadges}
            selectedBadge={selectedBadge}
            selectedBadgeCases={selectedBadgeCases}
            caseForm={caseForm}
            caseNoteDrafts={caseNoteDrafts}
            adminMessage={adminMessage}
            actions={actions}
          />
        )}

        {activeTab === 'Rules' && <RiskRulesTab riskRules={riskRules} updateRiskRule={actions.updateRiskRule} />}

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
