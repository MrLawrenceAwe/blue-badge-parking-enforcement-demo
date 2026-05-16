import { FileText, ShieldCheck } from 'lucide-react';
import { caseStatuses } from '../../domain/cases';

export function CaseDraftForm({
  allBadges,
  selectedBadge,
  newCaseDraft,
  updateNewCaseDraft,
  caseCommands
}) {
  return (
    <>
      <label>Selected badge<select value={selectedBadge.id} onChange={(event) => caseCommands.selectBadge(event.target.value)}>{allBadges.map((badge) => <option key={badge.id} value={badge.id}>{badge.id} - {badge.holder}</option>)}</select></label>
      <div className="case-scope">
        <strong>Cases for {selectedBadge.holder}</strong>
        <span>{selectedBadge.id} - {selectedBadge.vehicle}</span>
      </div>
      <div className="case-field-grid">
        <label>Status<select value={newCaseDraft.status} onChange={(event) => updateNewCaseDraft('status', event.target.value)}>{caseStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label>Case owner<input value={newCaseDraft.assignee} onChange={(event) => updateNewCaseDraft('assignee', event.target.value)} aria-label="Case owner or team" /></label>
        <label>Due date<input type="date" value={newCaseDraft.dueDate} onChange={(event) => updateNewCaseDraft('dueDate', event.target.value)} aria-label="Case due date" /></label>
        <label>Closure reason<input value={newCaseDraft.closureReason} onChange={(event) => updateNewCaseDraft('closureReason', event.target.value)} placeholder="Required when resolving" aria-label="Closure reason" /></label>
      </div>
      <textarea value={newCaseDraft.note} onChange={(event) => updateNewCaseDraft('note', event.target.value)} aria-label="Case note" placeholder="Add officer note, evidence reference, or review decision" />
      <label>Evidence reference<input value={newCaseDraft.evidence} onChange={(event) => updateNewCaseDraft('evidence', event.target.value)} placeholder="Photo, scan log, witness note, file reference" aria-label="Evidence reference" /></label>
      <div className="button-row">
        <button className="primary-button" onClick={caseCommands.createCaseForSelectedBadge}><FileText aria-hidden="true" size={20} /> Create case</button>
        <button className="secondary-button" onClick={caseCommands.reactivateBadge}><ShieldCheck aria-hidden="true" size={20} /> Reactivate after review</button>
      </div>
    </>
  );
}
