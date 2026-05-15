import { badgeVerificationPublicKey, initialSessions, issuedBadgeTokens } from '../data/demoData';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const sessionProofStore = new Map();

let nextSessionNumber = Math.max(
  ...initialSessions.map((session) => Number(session.id.replace('PS-', ''))).filter(Number.isFinite)
) + 1;
let badgePublicKeyPromise;
let sessionAttestationKeysPromise;

function base64UrlToBytes(value) {
  const normalised = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalised + '='.repeat((4 - (normalised.length % 4 || 4)) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function bytesToBase64Url(bytes) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

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

async function getBadgeVerificationPublicKey() {
  if (!badgePublicKeyPromise) {
    badgePublicKeyPromise = crypto.subtle.importKey(
      'jwk',
      badgeVerificationPublicKey,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['verify']
    );
  }
  return badgePublicKeyPromise;
}

async function getSessionAttestationKeys() {
  if (!sessionAttestationKeysPromise) {
    sessionAttestationKeysPromise = crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['sign', 'verify']
    );
  }
  return sessionAttestationKeysPromise;
}

export async function verifyBadgeToken(token) {
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return null;
  try {
    const publicKey = await getBadgeVerificationPublicKey();
    const verified = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      base64UrlToBytes(signaturePart),
      textEncoder.encode(payloadPart)
    );
    if (!verified) return null;
    return JSON.parse(textDecoder.decode(base64UrlToBytes(payloadPart)));
  } catch {
    return null;
  }
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

export function verificationTokenForBadge(badgeId) {
  return issuedBadgeTokens[badgeId] ?? null;
}

export function isSessionRecordTrusted(session) {
  const proof = sessionProofStore.get(session.id);
  return Boolean(proof?.verified) && session.locked && proof.payload === canonicalSessionPayload(session);
}

export function sessionIntegrityState(session) {
  if (!sessionProofStore.has(session.id)) return 'pending';
  return isSessionRecordTrusted(session) ? 'trusted' : 'tampered';
}
