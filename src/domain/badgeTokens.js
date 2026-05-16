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
        namedCurve: 'P-256'
      },
      false,
      ['verify']
    );
  }
  return badgePublicKeyPromise;
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

export function verificationTokenForBadge(badgeId) {
  return issuedBadgeTokens[badgeId] ?? null;
}
