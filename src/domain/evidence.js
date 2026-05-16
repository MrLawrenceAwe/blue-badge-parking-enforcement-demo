export function scanEvidenceItems(evidence, addedAt, addedBy = 'Officer') {
  return [
    evidence.vehiclePhotoRef && { type: 'Vehicle photo', reference: evidence.vehiclePhotoRef, addedBy, addedAt },
    evidence.badgePhotoRef && { type: 'Badge photo', reference: evidence.badgePhotoRef, addedBy, addedAt },
    evidence.officerNote && { type: 'Officer note', reference: evidence.officerNote, addedBy, addedAt }
  ].filter(Boolean);
}
