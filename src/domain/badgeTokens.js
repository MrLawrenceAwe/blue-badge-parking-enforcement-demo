import { badgeVerificationPublicKey, issuedBadgeTokens } from '../data/demoTokens';
import { base64UrlToBytes } from './base64Url';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

let badgePublicKeyPromise;

async function getBadgeVerificationPublicKey() {
  if (!badgePublicKeyPromise) {
    badgePublicKeyPromise = crypto.subtle.importKey(
      'jwk',
      badgeVerificationPublicKey,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['verify'],
    );
  }
  return badgePublicKeyPromise;
}

export async function verifyBadgeToken(token, validationContext = {}) {
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return null;
  try {
    const publicKey = await getBadgeVerificationPublicKey();
    const verified = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      base64UrlToBytes(signaturePart),
      textEncoder.encode(payloadPart),
    );
    if (!verified) return null;
    const payload = JSON.parse(textDecoder.decode(base64UrlToBytes(payloadPart)));
    return validateBadgeTokenPayload(payload, validationContext) ? payload : null;
  } catch {
    return null;
  }
}

export function validateBadgeTokenPayload(
  payload,
  { badge, now = new Date(), expectedIssuer = 'blue-badge-demo', expectedAudience = 'enforcement-scan' } = {},
) {
  if (!payload || typeof payload.badgeId !== 'string') return false;
  if (badge) {
    if (payload.badgeId !== badge.id) return false;
    if (payload.council && payload.council !== badge.council) return false;
  }
  if (payload.iss && payload.iss !== expectedIssuer) return false;
  if (payload.aud && payload.aud !== expectedAudience) return false;
  if (payload.nbf && Number(payload.nbf) * 1000 > now.getTime()) return false;
  if (payload.exp && Number(payload.exp) * 1000 <= now.getTime()) return false;
  return true;
}

export function issuedVerificationTokenForBadge(badgeId) {
  return issuedBadgeTokens[badgeId] ?? null;
}
