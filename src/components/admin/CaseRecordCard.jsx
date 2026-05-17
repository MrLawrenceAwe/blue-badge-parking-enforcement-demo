import { CaseEvidenceUpload, CaseNoteComposer, CaseStatusFields } from './CaseStatusFields';

export function CaseRecordCard({ caseRecord, noteDraft, setNoteDraftByCaseId, caseActions }) {
  const updateCaseFields = (updates) => caseActions.updateCase(caseRecord.id, updates);

  return (
    <article className="case-card">
      <strong>
        {caseRecord.id}: {caseRecord.title}
      </strong>
      <small>{caseRecord.badgeId}</small>
      <CaseStatusFields values={caseRecord} onChange={updateCaseFields} idPrefix={caseRecord.id} />
      <div className="case-notes">
        <strong>Notes</strong>
        {caseRecord.notes.map((note, index) => (
          <small key={`${caseRecord.id}-note-${index}`}>{note}</small>
        ))}
      </div>
      <div className="case-notes">
        <strong>Evidence details</strong>
        {(caseRecord.evidenceItems ?? []).map((item, index) => (
          <small key={`${caseRecord.id}-evidence-${index}`}>
            {item.type}: {item.reference} - {item.addedBy}
          </small>
        ))}
        {!(caseRecord.evidenceItems ?? []).length && <small>No structured evidence metadata yet.</small>}
      </div>
      <CaseNoteComposer
        caseRecord={caseRecord}
        noteDraft={noteDraft}
        setNoteDraftByCaseId={setNoteDraftByCaseId}
        appendCaseNote={caseActions.appendCaseNote}
      />
      <small>{caseRecord.evidence}</small>
      <CaseEvidenceUpload caseRecord={caseRecord} caseActions={caseActions} />
    </article>
  );
}
