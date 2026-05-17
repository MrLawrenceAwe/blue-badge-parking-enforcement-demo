import { FileText, ShieldCheck } from 'lucide-react';
import { caseStatuses } from '../../domain/cases';

export function CaseDraftForm({
  allBadges,
  selectedBadge,
  caseDraft,
  updateCaseDraft,
  caseWorkflowActions
}) {
  const canReactivateBadge = ['stolen', 'suspended', 'under review'].includes(selectedBadge.status);

  return (
    <>
      <label>Selected badge<select value={selectedBadge.id} onChange={(event) => caseWorkflowActions.selectBadge(event.target.value)}>{allBadges.map((badge) => <option key={badge.id} value={badge.id}>{badge.id} - {badge.holder}</option>)}</select></label>
      <div className="case-scope">
        <strong>Cases for {selectedBadge.holder}</strong>
        <span>{selectedBadge.id} - {selectedBadge.vehicle}</span>
      </div>
      <div className="case-field-grid">
        <label>Status<select value={caseDraft.status} onChange={(event) => updateCaseDraft('status', event.target.value)}>{caseStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label>Assigned team<input value={caseDraft.assignedTeam} onChange={(event) => updateCaseDraft('assignedTeam', event.target.value)} aria-label="Assigned team" /></label>
        <label>Due date<input type="date" value={caseDraft.dueDate} onChange={(event) => updateCaseDraft('dueDate', event.target.value)} aria-label="Case due date" /></label>
        <label>Closure reason<input value={caseDraft.closureReason} onChange={(event) => updateCaseDraft('closureReason', event.target.value)} placeholder="Required when resolving" aria-label="Closure reason" /></label>
      </div>
      <textarea value={caseDraft.note} onChange={(event) => updateCaseDraft('note', event.target.value)} aria-label="Case note" placeholder="Add officer note, evidence reference, or review decision" />
      <label>Evidence reference<input value={caseDraft.evidence} onChange={(event) => updateCaseDraft('evidence', event.target.value)} placeholder="Photo, scan log, witness note, file reference" aria-label="Evidence reference" /></label>
      <div className="button-row">
        <button className="primary-button" onClick={caseWorkflowActions.createCaseForSelectedBadge}><FileText aria-hidden="true" size={20} /> Create case</button>
        {canReactivateBadge && (
          <button className="secondary-button" onClick={caseWorkflowActions.reactivateBadge}><ShieldCheck aria-hidden="true" size={20} /> Reactivate after review</button>
        )}
      </div>
    </>
  );
}
