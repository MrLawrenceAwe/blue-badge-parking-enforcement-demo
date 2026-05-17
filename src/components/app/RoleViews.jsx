import { AdminView } from '../admin/AdminView';
import { CarerView } from '../carer/CarerView';
import { HolderView } from '../holder/HolderView';
import { OfficerView } from '../officer/OfficerView';
import { buildAdminDashboard } from '../../domain/adminDashboardSelectors';

export function RoleViews({ auth, enforcementStore, badgeActions, officerScan, adminCases, riskRuleActions }) {
  const selectedBadgeActivity = {
    replacementRequests: enforcementStore.replacementRequests.filter((request) => request.badgeId === auth.selectedBadge.id),
    notifications: enforcementStore.notifications.filter((notification) => notification.badgeId === auth.selectedBadge.id)
  };
  const replacementForm = {
    values: badgeActions.replacementDraft,
    setValues: badgeActions.setReplacementDraft
  };

  if (auth.role === 'holder') {
    return (
      <HolderRoute
        auth={auth}
        enforcementStore={enforcementStore}
        badgeActions={badgeActions}
        replacementForm={replacementForm}
        selectedBadgeActivity={selectedBadgeActivity}
      />
    );
  }

  if (auth.role === 'carer') {
    return (
      <CarerRoute
        auth={auth}
        enforcementStore={enforcementStore}
        badgeActions={badgeActions}
        replacementForm={replacementForm}
        selectedBadgeActivity={selectedBadgeActivity}
      />
    );
  }

  if (auth.role === 'officer') {
    return <OfficerRoute auth={auth} enforcementStore={enforcementStore} officerScan={officerScan} />;
  }

  if (auth.role === 'admin') {
    return (
      <AdminRoute
        auth={auth}
        enforcementStore={enforcementStore}
        adminCases={adminCases}
        riskRuleActions={riskRuleActions}
      />
    );
  }

  return null;
}

function HolderRoute({ auth, enforcementStore, badgeActions, replacementForm, selectedBadgeActivity }) {
  return (
    <HolderView
      badge={auth.selectedBadge}
      badges={auth.roleBadges}
      setSelectedBadgeId={auth.setSelectedBadgeId}
      sessions={enforcementStore.sessions}
      badgeActions={badgeActions}
      replacementForm={replacementForm}
      replacementRequests={selectedBadgeActivity.replacementRequests}
      notifications={selectedBadgeActivity.notifications}
      risk={enforcementStore.verificationByBadge[auth.selectedBadge.id]}
    />
  );
}

function CarerRoute({ auth, enforcementStore, badgeActions, replacementForm, selectedBadgeActivity }) {
  return (
    <CarerView
      badges={auth.roleBadges}
      selectedBadge={auth.selectedBadge}
      setSelectedBadgeId={auth.setSelectedBadgeId}
      sessions={enforcementStore.sessions}
      badgeActions={badgeActions}
      replacementForm={replacementForm}
      replacementRequests={selectedBadgeActivity.replacementRequests}
      notifications={selectedBadgeActivity.notifications}
    />
  );
}

function OfficerRoute({ auth, enforcementStore, officerScan }) {
  return (
    <OfficerView
      badge={officerScan.lastScanResult ? officerScan.lastScanResult.badge : auth.selectedBadge}
      risk={officerScan.displayedRisk}
      scanResult={officerScan.lastScanResult}
      sessions={enforcementStore.activeSessions}
      scanFields={{
        input: officerScan.scanInput,
        inputDescription: officerScan.inputDescription,
        location: officerScan.scanLocation,
        vehicle: officerScan.scanVehicle
      }}
      scanEvidenceDraft={{ values: officerScan.scanEvidenceDraft, setValues: officerScan.updateScanEvidenceDraft }}
      officerScanActions={{
        setInput: officerScan.setScanInput,
        setLocation: officerScan.setScanLocation,
        setVehicle: officerScan.setScanVehicle,
        verifyBadge: officerScan.recordBadgeScan,
        createCaseFromScan: officerScan.createCaseFromScan
      }}
      officerMessage={officerScan.officerNotice}
    />
  );
}

function AdminRoute({ auth, enforcementStore, adminCases, riskRuleActions }) {
  const adminDashboardData = buildAdminDashboard({
    badges: enforcementStore.badges,
    sessions: enforcementStore.sessions,
    scans: enforcementStore.scans,
    cases: enforcementStore.cases,
    filters: adminCases.dashboardFilters,
    verificationByBadge: enforcementStore.verificationByBadge,
    selectedBadgeId: auth.selectedBadge.id
  });
  const filterForm = {
    values: adminCases.dashboardFilters,
    setValues: adminCases.setDashboardFilters
  };
  const caseWorkflowActions = {
    selectBadge: auth.setSelectedBadgeId,
    createCaseForSelectedBadge: adminCases.createCaseForSelectedBadge,
    updateCase: adminCases.updateCase,
    appendCaseNote: adminCases.appendCaseNote,
    reactivateBadge: adminCases.reactivateBadgeAfterReview
  };

  return (
    <AdminView
      adminDashboardData={{
        allBadges: enforcementStore.badges,
        filteredBadges: adminDashboardData.filteredBadges,
        filteredActiveSessions: adminDashboardData.filteredActiveSessions,
        filteredScans: adminDashboardData.filteredScans,
        selectedBadgeCases: adminDashboardData.selectedBadgeCases,
        reviewQueueCases: adminDashboardData.reviewQueueCases,
        suspendedOrStolenBadges: adminDashboardData.suspendedOrStolenBadges,
        auditEvents: enforcementStore.auditEvents,
        notifications: enforcementStore.notifications,
        replacementRequests: enforcementStore.replacementRequests,
        verificationByBadge: enforcementStore.verificationByBadge
      }}
      filterForm={filterForm}
      selectedBadge={auth.selectedBadge}
      caseDraft={{
        values: adminCases.caseDraft,
        update: adminCases.updateCaseDraft,
        noteDraftByCaseId: adminCases.noteDraftByCaseId,
        setNoteDraftByCaseId: adminCases.setNoteDraftByCaseId
      }}
      caseWorkflowActions={caseWorkflowActions}
      riskRules={{
        values: enforcementStore.riskRules,
        update: riskRuleActions.updateRiskRule,
        notice: riskRuleActions.riskRuleNotice
      }}
      adminMessage={adminCases.adminNotice}
    />
  );
}
