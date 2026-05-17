import { FileText } from 'lucide-react';
import { CaseDraftForm } from './CaseDraftForm';
import { CaseRecordCard } from './CaseRecordCard';

export function CaseManagementTab({
  allBadges,
  selectedBadgeId,
  selectedBadge,
  selectedBadgeCases,
  caseDraft,
  updateCaseDraft,
  noteDraftByCaseId,
  setNoteDraftByCaseId,
  adminMessage,
  caseWorkflowActions
}) {
  return (
    <div className="app-panel case-management-panel full-span">
      <div className="app-panel-heading"><h2>Case management</h2><FileText aria-hidden="true" /></div>
      <CaseDraftForm
        allBadges={allBadges}
        selectedBadgeId={selectedBadgeId}
        selectedBadge={selectedBadge}
        caseDraft={caseDraft}
        updateCaseDraft={updateCaseDraft}
        caseWorkflowActions={caseWorkflowActions}
      />
      {adminMessage && <p className="form-message" role="status">{adminMessage}</p>}
      <div className="record-list constrained-list">
        {!selectedBadgeCases.length && <p className="muted-text">No case records for this selection.</p>}
        {selectedBadgeCases.map((caseRecord) => (
          <CaseRecordCard
            key={caseRecord.id}
            caseRecord={caseRecord}
            noteDraft={noteDraftByCaseId[caseRecord.id]}
            setNoteDraftByCaseId={setNoteDraftByCaseId}
            caseWorkflowActions={caseWorkflowActions}
          />
        ))}
      </div>
    </div>
  );
}
