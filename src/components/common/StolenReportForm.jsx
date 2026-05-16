import { useState } from 'react';
import { Siren } from 'lucide-react';

export function StolenReportForm({ reportStolen }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button className="danger-button" onClick={() => setIsOpen(true)}>
        <Siren aria-hidden="true" size={21} />
        Report stolen
      </button>
    );
  }

  return (
    <form
      className="stolen-report-form"
      onSubmit={(event) => {
        event.preventDefault();
        const reported = reportStolen(new FormData(event.currentTarget));
        if (reported) setIsOpen(false);
      }}
    >
      <label>Incident details<textarea name="details" required placeholder="Where and when it happened" /></label>
      <label>Contact number<input name="contact" required placeholder="Verification contact" /></label>
      <label className="checkbox-label">
        <input name="confirmed" type="checkbox" value="yes" required />
        I understand this will immediately deactivate the digital badge.
      </label>
      <div className="button-row">
        <button className="danger-button" type="submit">
          <Siren aria-hidden="true" size={21} />
          Deactivate badge
        </button>
        <button className="secondary-button" type="button" onClick={() => setIsOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
