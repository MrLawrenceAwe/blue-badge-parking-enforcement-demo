import { AdminView } from '../admin/AdminView';
import { CarerView } from '../carer/CarerView';
import { HolderView } from '../holder/HolderView';
import { OfficerView } from '../officer/OfficerView';
import { selectAdminDashboardData } from '../../domain/adminDashboardSelectors';

export function RoleViewSwitch({ auth, enforcementStore, badgeActions, officerScan, adminCases, verificationRuleActions }) {
  const selectedBadgeActivity = {
    replacementRequests: enforcementStore.replacementRequests.filter(
      (request) => request.badgeId === auth.selectedBadge.id,
    ),
    notifications: enforcementStore.notifications.filter(
      (notification) => notification.badgeId === auth.selectedBadge.id,
    ),
  };
  const replacementForm = {
    values: badgeActions.replacementDraft,
    setValues: badgeActions.setReplacementDraft,
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
        verificationRuleActions={verificationRuleActions}
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
      verification={enforcementStore.verificationByBadge[auth.selectedBadge.id]}
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
      verification={officerScan.visibleVerificationAssessment}
      scanResult={officerScan.lastScanResult}
      sessions={enforcementStore.activeSessions}
      scanFields={{
        input: officerScan.scanInput,
        inputDescription: officerScan.inputDescription,
        location: officerScan.scanLocation,
        vehicle: officerScan.scanVehicle,
      }}
      scanCaseDraft={{
        values: officerScan.scanCaseDraft,
        setValues: officerScan.updateScanCaseDraft,
      }}
      officerScanActions={{
        setInput: officerScan.setScanInput,
        setLocation: officerScan.setScanLocation,
        setVehicle: officerScan.setScanVehicle,
        verifyBadge: officerScan.recordBadgeScan,
        createCaseFromScan: officerScan.createCaseFromScan,
      }}
      officerMessage={officerScan.officerNotice}
    />
  );
}

function AdminRoute({ auth, enforcementStore, adminCases, verificationRuleActions }) {
  const selectedAdminBadge = auth.roleBadges.find((badge) => badge.id === auth.selectedBadgeId) ?? null;
  const adminDashboardData = selectAdminDashboardData({
    badges: enforcementStore.badges,
    sessions: enforcementStore.sessions,
    scans: enforcementStore.scans,
    cases: enforcementStore.cases,
    filters: adminCases.adminDashboardFilters,
    verificationByBadge: enforcementStore.verificationByBadge,
    selectedBadgeId: auth.selectedBadgeId,
  });
  const filterForm = {
    values: adminCases.adminDashboardFilters,
    setValues: adminCases.setAdminDashboardFilters,
  };
  const caseActions = {
    selectBadge: (badgeId) => {
      adminCases.setFocusedCaseId(null);
      auth.setSelectedBadgeId(badgeId);
    },
    focusCase: adminCases.setFocusedCaseId,
    createCaseForSelectedBadge: adminCases.createCaseForSelectedBadge,
    updateCase: adminCases.updateCase,
    appendCaseNote: adminCases.appendCaseNote,
    reactivateBadge: adminCases.reactivateBadgeAfterReview,
  };
  const selectedCaseRecords = selectedAdminBadge
    ? adminDashboardData.selectedBadgeCases
    : enforcementStore.cases.filter((caseRecord) => caseRecord.id === adminCases.focusedCaseId);

  return (
    <AdminView
      adminDashboardData={{
        allBadges: enforcementStore.badges,
        filteredBadges: adminDashboardData.filteredBadges,
        filteredActiveSessions: adminDashboardData.filteredActiveSessions,
        filteredScans: adminDashboardData.filteredScans,
        selectedBadgeCases: selectedCaseRecords,
        reviewQueueCases: adminDashboardData.reviewQueueCases,
        suspendedOrStolenBadges: adminDashboardData.suspendedOrStolenBadges,
        auditEvents: enforcementStore.auditEvents,
        notifications: enforcementStore.notifications,
        replacementRequests: enforcementStore.replacementRequests,
        verificationByBadge: enforcementStore.verificationByBadge,
      }}
      filterForm={filterForm}
      selectedBadgeId={auth.selectedBadgeId}
      selectedBadge={selectedAdminBadge}
      caseDraft={{
        values: adminCases.caseDraft,
        update: adminCases.updateCaseDraft,
        noteDraftByCaseId: adminCases.noteDraftByCaseId,
        setNoteDraftByCaseId: adminCases.setNoteDraftByCaseId,
      }}
      caseActions={caseActions}
      verificationRules={{
        values: enforcementStore.verificationRules,
        update: verificationRuleActions.updateVerificationRule,
        notice: verificationRuleActions.verificationRuleNotice,
      }}
      adminMessage={adminCases.adminNotice}
    />
  );
}
