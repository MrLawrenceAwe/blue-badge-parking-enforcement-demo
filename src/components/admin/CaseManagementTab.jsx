import { FileText, ShieldCheck } from 'lucide-react';
import { caseStatuses } from '../../domain/cases';

export function CaseManagementTab({
  allBadges,
  selectedBadge,
  selectedBadgeCases,
  draftCase,
  updateDraftCase,
  caseNoteDraftsById,
  setCaseNoteDraftsById,
  adminMessage,
  caseActions
}) {
  return (
    <div className="app-panel case-management-panel full-span">
      <div className="app-panel-heading"><h2>Case management</h2><FileText aria-hidden="true" /></div>
      <label>Selected badge<select value={selectedBadge.id} onChange={(event) => caseActions.selectBadge(event.target.value)}>{allBadges.map((badge) => <option key={badge.id} value={badge.id}>{badge.id} - {badge.holder}</option>)}</select></label>
      <div className="case-scope">
        <strong>Cases for {selectedBadge.holder}</strong>
        <span>{selectedBadge.id} - {selectedBadge.vehicle}</span>
      </div>
      <div className="case-field-grid">
        <label>Status<select value={draftCase.status} onChange={(event) => updateDraftCase('status', event.target.value)}>{caseStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label>Assigned to<input value={draftCase.assignee} onChange={(event) => updateDraftCase('assignee', event.target.value)} aria-label="Assigned case officer or team" /></label>
        <label>Due date<input type="date" value={draftCase.dueDate} onChange={(event) => updateDraftCase('dueDate', event.target.value)} aria-label="Case due date" /></label>
        <label>Closure reason<input value={draftCase.closureReason} onChange={(event) => updateDraftCase('closureReason', event.target.value)} placeholder="Required when resolving" aria-label="Closure reason" /></label>
      </div>
      <textarea value={draftCase.note} onChange={(event) => updateDraftCase('note', event.target.value)} aria-label="Case note" placeholder="Add officer note, evidence reference, or review outcome" />
      <label>Evidence reference<input value={draftCase.evidence} onChange={(event) => updateDraftCase('evidence', event.target.value)} placeholder="Photo, scan log, witness note, file reference" aria-label="Evidence reference" /></label>
      <div className="button-row">
        <button className="primary-button" onClick={caseActions.addCase}><FileText aria-hidden="true" size={20} /> Create case</button>
        <button className="secondary-button" onClick={caseActions.reactivateBadge}><ShieldCheck aria-hidden="true" size={20} /> Reactivate after review</button>
      </div>
      {adminMessage && <p className="form-message" role="status">{adminMessage}</p>}
      <div className="record-list constrained-list">
        {!selectedBadgeCases.length && <p className="muted-text">No case records for this badge.</p>}
        {selectedBadgeCases.map((caseRecord) => (
          <article key={caseRecord.id} className="case-card">
            <strong>{caseRecord.id}: {caseRecord.title}</strong>
            <small>{caseRecord.badgeId}</small>
            <label>Status<select value={caseRecord.status} onChange={(event) => caseActions.updateCase(caseRecord.id, { status: event.target.value })}>{caseStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label>Assigned to<input value={caseRecord.assignedTo} onChange={(event) => caseActions.updateCase(caseRecord.id, { assignedTo: event.target.value })} aria-label={`Assignee for ${caseRecord.id}`} /></label>
            <div className="case-field-grid">
              <label>Due date<input type="date" value={caseRecord.dueDate ?? ''} onChange={(event) => caseActions.updateCase(caseRecord.id, { dueDate: event.target.value })} aria-label={`Due date for ${caseRecord.id}`} /></label>
              <label>Closure reason<input value={caseRecord.closureReason ?? ''} onChange={(event) => caseActions.updateCase(caseRecord.id, { closureReason: event.target.value })} aria-label={`Closure reason for ${caseRecord.id}`} /></label>
            </div>
            <div className="case-notes">
              <strong>Notes</strong>
              {caseRecord.notes.map((note, index) => <small key={`${caseRecord.id}-note-${index}`}>{note}</small>)}
            </div>
            <div className="case-notes">
              <strong>Evidence details</strong>
              {(caseRecord.evidenceItems ?? []).map((item, index) => <small key={`${caseRecord.id}-evidence-${index}`}>{item.type}: {item.reference} - {item.addedBy}</small>)}
              {!(caseRecord.evidenceItems ?? []).length && <small>No structured evidence metadata yet.</small>}
            </div>
            <label>Add note<textarea value={caseNoteDraftsById[caseRecord.id] ?? ''} onChange={(event) => setCaseNoteDraftsById((current) => ({ ...current, [caseRecord.id]: event.target.value }))} aria-label={`Add note to ${caseRecord.id}`} placeholder="Officer update, holder contact, evidence summary" /></label>
            <button className="secondary-button" type="button" onClick={() => caseActions.appendCaseNote(caseRecord.id)}><FileText aria-hidden="true" size={18} /> Add note</button>
            <small>{caseRecord.evidence}</small>
            <label>Upload evidence<input type="file" onChange={(event) => {
              const fileName = event.target.files?.[0]?.name;
              if (!fileName) return;
              caseActions.updateCase(caseRecord.id, {
                evidence: fileName,
                evidenceItems: [
                  ...(caseRecord.evidenceItems ?? []),
                  { type: 'Uploaded file', reference: fileName, addedBy: 'Council Admin', addedAt: new Date().toISOString() }
                ]
              });
            }} aria-label={`Upload evidence for ${caseRecord.id}`} /></label>
          </article>
        ))}
      </div>
    </div>
  );
}
