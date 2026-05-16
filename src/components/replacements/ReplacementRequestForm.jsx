export function ReplacementRequestForm({ replacementForm, replacementRequests, requestReplacementBadge, showTemporaryPermit = true }) {
  return (
    <form
      className="replacement-request-form"
      onSubmit={(event) => {
        event.preventDefault();
        requestReplacementBadge(new FormData(event.currentTarget));
      }}
    >
      <h3>Replacement request</h3>
      <label>
        Crime, loss, or council reference
        <input
          name="reference"
          value={replacementForm.values.reference}
          onChange={(event) => replacementForm.setValues((current) => ({ ...current, reference: event.target.value }))}
          required
        />
      </label>
      <label>
        Temporary permit
        <select
          name="temporaryPermit"
          value={replacementForm.values.temporaryPermit}
          onChange={(event) => replacementForm.setValues((current) => ({ ...current, temporaryPermit: event.target.value }))}
        >
          <option>Requested</option>
          <option>Not required</option>
          <option>Pending</option>
        </select>
      </label>
      <button className="secondary-button" type="submit">Request replacement</button>
      {replacementRequests.map((request) => (
        <small key={request.id}>
          {request.id}: {request.status} - {request.reference}
          {showTemporaryPermit && ` - temporary permit ${request.temporaryPermit.toLowerCase()}`}
        </small>
      ))}
    </form>
  );
}
