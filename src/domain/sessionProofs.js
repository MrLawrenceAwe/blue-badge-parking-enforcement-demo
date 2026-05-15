import { initialSessions } from '../data/demoData';
import { bytesToBase64Url } from './base64Url';

const textEncoder = new TextEncoder();
const sessionProofStore = new Map();

let nextSessionNumber = Math.max(
  ...initialSessions.map((session) => Number(session.id.replace('PS-', ''))).filter(Number.isFinite)
) + 1;
let sessionProofKeysPromise;

function canonicalSessionPayload(session) {
  return JSON.stringify({
    badgeId: session.badgeId,
    vehicle: session.vehicle,
    location: session.location,
    gps: session.gps,
    startedAt: session.startedAt,
    durationMins: session.durationMins
  });
}

async function getSessionAttestationKeys() {
  if (!sessionProofKeysPromise) {
    sessionProofKeysPromise = crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['sign', 'verify']
    );
  }
  return sessionProofKeysPromise;
}

export async function createSignedSessionRecord(sessionRecord) {
  const { privateKey, publicKey } = await getSessionAttestationKeys();
  const payload = canonicalSessionPayload(sessionRecord);
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    textEncoder.encode(payload)
  );
  const verified = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    signatureBuffer,
    textEncoder.encode(payload)
  );
  sessionProofStore.set(sessionRecord.id, {
    payload,
    signature: bytesToBase64Url(new Uint8Array(signatureBuffer)),
    verified
  });
  return {
    ...sessionRecord,
    locked: true
  };
}

export function createSessionId() {
  const id = `PS-${nextSessionNumber}`;
  nextSessionNumber += 1;
  return id;
}

export function isSessionRecordTrusted(session) {
  const proof = sessionProofStore.get(session.id);
  return Boolean(proof?.verified) && session.locked && proof.payload === canonicalSessionPayload(session);
}

export function sessionIntegrityState(session) {
  if (!sessionProofStore.has(session.id)) return 'pending';
  return isSessionRecordTrusted(session) ? 'trusted' : 'tampered';
}
