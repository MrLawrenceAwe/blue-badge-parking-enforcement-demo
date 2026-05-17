import { FileText } from 'lucide-react';
import { caseStatuses } from '../../domain/cases';

export function CaseStatusFields({ values, onChange, idPrefix = 'case', showAssignedTeam = true }) {
  return (
    <div className="case-field-grid">
      <label>
        Status
        <select value={values.status} onChange={(event) => onChange({ status: event.target.value })}>
          {caseStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
      {showAssignedTeam && (
        <label>
          Assigned team
          <input
            value={values.assignedTeam}
            onChange={(event) => onChange({ assignedTeam: event.target.value })}
            aria-label={`Assigned team for ${idPrefix}`}
          />
        </label>
      )}
      <label>
        Due date
        <input
          type="date"
          value={values.dueDate ?? ''}
          onChange={(event) => onChange({ dueDate: event.target.value })}
          aria-label={`Due date for ${idPrefix}`}
        />
      </label>
      <label>
        Resolution reason
        <input
          value={values.closureReason ?? ''}
          onChange={(event) => onChange({ closureReason: event.target.value })}
          placeholder="Required when resolving"
          aria-label={`Resolution reason for ${idPrefix}`}
        />
      </label>
    </div>
  );
}

export function CaseEvidenceUpload({ caseRecord, caseActions }) {
  return (
    <label>
      Upload evidence
      <input
        type="file"
        onChange={(event) => {
          const fileName = event.target.files?.[0]?.name;
          if (!fileName) return;
          caseActions.updateCase(caseRecord.id, {
            evidence: fileName,
            evidenceItems: [
              ...(caseRecord.evidenceItems ?? []),
              {
                type: 'Uploaded file',
                reference: fileName,
                addedBy: 'Council Admin',
                addedAt: new Date().toISOString(),
              },
            ],
          });
        }}
        aria-label={`Upload evidence for ${caseRecord.id}`}
      />
    </label>
  );
}

export function CaseNoteComposer({ caseRecord, noteDraft, setNoteDraftByCaseId, appendCaseNote }) {
  return (
    <>
      <label>
        Add note
        <textarea
          value={noteDraft ?? ''}
          onChange={(event) => setNoteDraftByCaseId((current) => ({ ...current, [caseRecord.id]: event.target.value }))}
          aria-label={`Add note to ${caseRecord.id}`}
          placeholder="Officer update, holder contact, evidence summary"
        />
      </label>
      <button className="secondary-button" type="button" onClick={() => appendCaseNote(caseRecord.id)}>
        <FileText aria-hidden="true" size={18} />
        Add note
      </button>
    </>
  );
}
