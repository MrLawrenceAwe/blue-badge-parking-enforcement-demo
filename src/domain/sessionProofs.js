import { initialSessions } from '../data/demoActivity';
import { base64UrlToBytes, bytesToBase64Url } from './base64Url';

const textEncoder = new TextEncoder();
const sessionProofsById = new Map();

let nextSessionNumber =
  Math.max(...initialSessions.map((session) => Number(session.id.replace('PS-', ''))).filter(Number.isFinite)) + 1;
let sessionSigningKeysPromise;

function canonicalSessionPayload(session) {
  return JSON.stringify({
    badgeId: session.badgeId,
    vehicle: session.vehicle,
    location: session.location,
    gps: session.gps,
    startedAt: session.startedAt,
    durationMins: session.durationMins,
    endedAt: session.endedAt ?? null,
  });
}

async function getSessionSigningKeys() {
  if (!sessionSigningKeysPromise) {
    sessionSigningKeysPromise = crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['sign', 'verify'],
    );
  }
  return sessionSigningKeysPromise;
}

export async function createSignedSessionRecord(sessionRecord) {
  const { privateKey, publicKey } = await getSessionSigningKeys();
  const payload = canonicalSessionPayload(sessionRecord);
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    textEncoder.encode(payload),
  );
  const verified = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    signatureBuffer,
    textEncoder.encode(payload),
  );
  const proof = {
    payload,
    signature: bytesToBase64Url(new Uint8Array(signatureBuffer)),
    verified,
  };
  sessionProofsById.set(sessionRecord.id, proof);
  return {
    ...sessionRecord,
    locked: true,
    proof,
  };
}

export function createSessionId() {
  const id = `PS-${nextSessionNumber}`;
  nextSessionNumber += 1;
  return id;
}

export async function verifyStoredSessionRecord(session) {
  const proof = session.proof ?? sessionProofsById.get(session.id);
  if (!proof?.signature || !proof?.payload || !session.locked) return false;
  if (proof.payload !== canonicalSessionPayload(session)) return false;
  try {
    const { publicKey } = await getSessionSigningKeys();
    return crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      base64UrlToBytes(proof.signature),
      textEncoder.encode(proof.payload),
    );
  } catch {
    return false;
  }
}

export function isSessionRecordTrusted(session) {
  const proof = session.proof ?? sessionProofsById.get(session.id);
  return Boolean(proof?.verified) && session.locked && proof.payload === canonicalSessionPayload(session);
}

export function sessionIntegrityState(session) {
  if (!session.proof && !sessionProofsById.has(session.id)) return 'pending';
  return isSessionRecordTrusted(session) ? 'trusted' : 'tampered';
}
