export function nextNumberFromRecords(records, prefix, fallback) {
  const highestExistingId = Math.max(
    fallback,
    ...records
      .map((record) => Number(String(record.id).replace(prefix, '')))
      .filter(Number.isFinite)
  );
  return highestExistingId + 1;
}

export function formatRecordId(prefix, number) {
  return `${prefix}${number}`;
}

export function nextRecordId(records, prefix, fallback) {
  return formatRecordId(prefix, nextNumberFromRecords(records, prefix, fallback));
}
