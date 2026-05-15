export function parseScanInput(value) {
  const trimmed = value.trim();
  const qrPrefix = 'bluebadge://verify/';
  if (trimmed.toLowerCase().startsWith(qrPrefix)) {
    return { kind: 'qr-token', value: trimmed.slice(qrPrefix.length) };
  }

  const normalised = trimmed.toUpperCase();
  const vehiclePattern = /^[A-Z0-9]{2,8}(?:\s?[A-Z0-9]{1,4})?$/;
  if (normalised.startsWith('BB-')) return { kind: 'badge-id', value: normalised };
  if (vehiclePattern.test(normalised)) return { kind: 'vehicle', value: normalised };
  return { kind: 'badge-id', value: normalised };
}
