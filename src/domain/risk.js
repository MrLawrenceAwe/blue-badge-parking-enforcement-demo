import { normaliseVehicle, vehicleSearchKey } from './badges';
import { distanceInKm, mockGpsForLocation } from './locations';
import { minutesBetween } from '../utils/date';

const RISK_LEVEL = {
  normal: 'normal',
  monitor: 'monitor',
  review: 'officer review',
  high: 'auto-suspend / high priority alert'
};

export function evaluateBadgeRisk(badge, sessions, scans, scanContext = {}) {
  const events = [];
  if (!badge) {
    return riskResult({
      score: 100,
      level: RISK_LEVEL.high,
      events: ['Unknown badge or invalid verification token'],
      severity: 'risk-high',
      verdict: 'invalid'
    });
  }

  if (badge.status === 'stolen') events.push('Badge used after being reported stolen');
  if (badge.status === 'expired') events.push('Badge is expired');
  if (badge.status === 'suspended') events.push('Badge is suspended');
  if (badge.status === 'under review') events.push('Badge already under review');
  if (scanContext.vehicle && vehicleSearchKey(scanContext.vehicle) !== vehicleSearchKey(badge.vehicle)) {
    events.push('Badge used with unregistered vehicle');
  }

  const badgeScans = scans.filter((scan) => scan.badgeId === badge.id);
  const failedScans = badgeScans.filter((scan) => scan.outcome !== 'valid').length + (scanContext.includeCurrentFailure ? 1 : 0);
  if (failedScans >= 2) events.push('Multiple failed scans');

  const closeLocationScan = badgeScans.some((scan) => {
    const closeInTime = scanContext.time ? minutesBetween(scan.time, scanContext.time) < 45 : true;
    const scanGps = scan.gps ?? mockGpsForLocation(scan.location);
    return closeInTime && scanContext.gps && distanceInKm(scanGps, scanContext.gps) >= 2;
  });
  if (closeLocationScan) events.push('Badge scanned in two locations close together');

  const activeSessions = sessions.filter((session) => session.badgeId === badge.id);
  if (activeSessions.some((session) => session.durationMins > 210)) {
    events.push('Long or repeated suspicious parking sessions');
  }

  if (
    scanContext.device === 'NEW-DEVICE' &&
    scanContext.location &&
    !badge.usualLocations.some((place) => scanContext.location.includes(place))
  ) {
    events.push('New device plus unusual location');
  }

  let score = Math.min(100, events.reduce((total, event) => total + scoreForRiskEvent(event), 0));

  if (badge.status === 'stolen' || badge.status === 'suspended') {
    score = Math.max(score, 85);
    return riskResult({ score, level: RISK_LEVEL.high, events, severity: 'risk-critical', verdict: 'stolen / deactivated' });
  }

  if (badge.status === 'expired') {
    score = Math.max(score, 70);
    return riskResult({
      score,
      level: score >= 81 ? RISK_LEVEL.high : RISK_LEVEL.review,
      events,
      severity: 'risk-high',
      verdict: 'invalid'
    });
  }

  if (score >= 81) {
    return riskResult({ score, level: RISK_LEVEL.high, events, severity: 'risk-high', verdict: 'invalid' });
  }

  if (score >= 31 || badge.status === 'under review') {
    return riskResult({
      score,
      level: score >= 61 ? RISK_LEVEL.review : RISK_LEVEL.monitor,
      events,
      severity: 'risk-watch',
      verdict: 'suspicious'
    });
  }

  return riskResult({
    score,
    level: RISK_LEVEL.normal,
    events: events.length ? events : ['No active risk events'],
    severity: 'risk-low',
    verdict: 'valid'
  });
}

export function riskFromPermissionError(message) {
  return riskResult({
    score: 100,
    level: RISK_LEVEL.high,
    events: [message],
    severity: 'risk-high',
    verdict: 'invalid'
  });
}

export function scanOutcomeForRisk(risk) {
  if (risk.verdict === 'valid') return 'valid';
  if (risk.verdict === 'suspicious') return 'review';
  if (risk.verdict === 'stolen / deactivated') return 'deactivated';
  return 'invalid';
}

function scoreForRiskEvent(event) {
  if (event.includes('stolen') || event.includes('suspended')) return 85;
  if (event.includes('unregistered')) return 45;
  if (event.includes('two locations')) return 35;
  if (event.includes('failed')) return 25;
  if (event.includes('New device')) return 30;
  if (event.includes('Long')) return 25;
  if (event.includes('expired')) return 70;
  return 20;
}

function riskResult(result) {
  return {
    ...result,
    vehicle: result.vehicle ? normaliseVehicle(result.vehicle) : result.vehicle
  };
}
