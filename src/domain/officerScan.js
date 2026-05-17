import { normaliseVehicle, vehicleSearchKey } from './badges';
import { scanEvidenceItems } from './evidence';
import { gpsForKnownLocation } from './locations';
import { scanOutcomeForVerification } from './risk';
import { parseScanInput } from './scanInput';

export function describeScanInput(scanInput) {
  return describeParsedScanInput(parseScanInput(scanInput));
}

export function describeParsedScanInput(parsedScanInput) {
  if (parsedScanInput.kind === 'qr-token') return 'Detected signed QR verification token';
  if (parsedScanInput.kind === 'vehicle') return 'Detected vehicle registration lookup';
  return 'Detected badge ID lookup';
}

export function resolveScannedBadge({ badges, parsedScanInput, verifiedQrPayload }) {
  if (parsedScanInput.kind === 'badge-id') {
    return badges.find((badge) => badge.id.toUpperCase() === parsedScanInput.value);
  }
  if (parsedScanInput.kind === 'qr-token') {
    return badges.find((badge) => badge.id === verifiedQrPayload?.badgeId);
  }
  if (parsedScanInput.kind === 'vehicle') {
    return badges.find((badge) => vehicleSearchKey(badge.vehicle) === vehicleSearchKey(parsedScanInput.value));
  }
  return null;
}

export function explainScanFailure({ parsedScanInput, verifiedQrPayload, candidateBadge, verifiedBadge }) {
  if (verifiedBadge) return '';
  if (parsedScanInput.kind === 'qr-token' && !verifiedQrPayload) {
    return 'QR token could not be trusted. It may be expired, malformed, or signed for a different verification audience.';
  }
  if (parsedScanInput.kind === 'qr-token' && verifiedQrPayload && !candidateBadge) {
    return `QR token is trusted, but no badge record exists for ${verifiedQrPayload.badgeId}.`;
  }
  if (parsedScanInput.kind === 'qr-token' && candidateBadge && !verifiedBadge) {
    return 'QR token does not match the stored badge record or council.';
  }
  if (parsedScanInput.kind === 'vehicle') return 'No badge is linked to that vehicle registration.';
  return 'No badge record matches that badge ID.';
}

export function buildOfficerScanContext({ vehicle, location, scannedAt }) {
  return {
    vehicle: normaliseVehicle(vehicle),
    location,
    gps: gpsForKnownLocation(location),
    time: scannedAt,
    device: location.includes('Heathrow') ? 'NEW-DEVICE' : 'EO-TAB-07',
  };
}

export function buildOfficerScanRecord({ id, badgeId, scanContext, scannedAt, risk, evidence, officerName }) {
  return {
    id,
    badgeId,
    vehicle: scanContext.vehicle,
    location: scanContext.location,
    gps: scanContext.gps,
    officer: officerName,
    time: scannedAt,
    device: scanContext.device,
    scanOutcome: scanOutcomeForVerification(risk),
    contravention: evidence.contravention,
    action: evidence.action,
    officerNote: evidence.officerNote,
    evidenceItems: scanEvidenceItems(evidence, scannedAt, officerName),
  };
}
