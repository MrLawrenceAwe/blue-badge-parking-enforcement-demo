import { normaliseVehicle, vehicleSearchKey } from './badges';
import { distanceInKm, mockGpsForLocation } from './locations';
import { minutesBetween } from '../utils/date';

const RISK_LEVEL = {
  normal: 'normal',
  monitor: 'monitor',
  review: 'officer review',
  high: 'auto-suspend / high priority alert'
};

export const defaultRiskRules = {
  highRiskThreshold: 81,
  reviewThreshold: 61,
  monitorThreshold: 31,
  closeScanMinutes: 45,
  closeScanDistanceKm: 2,
  longStayMinutes: 210,
  weights: {
    stolenOrSuspended: 85,
    unregisteredVehicle: 45,
    impossibleTravel: 35,
    multipleFailedScans: 25,
    newDeviceUnusualLocation: 30,
    longStay: 25,
    expired: 70,
    default: 20
  }
};

export function evaluateBadgeRisk(badge, sessions, scans, scanContext = {}, rules = defaultRiskRules) {
  const events = [];
  if (!badge) {
    return riskResult({
      score: 100,
      level: RISK_LEVEL.high,
      events: ['Unknown badge or invalid verification token'],
      severity: 'risk-high',
      verdict: 'invalid',
      explanation: ['No matching badge record or trusted QR token was found.']
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
    const closeInTime = scanContext.time ? minutesBetween(scan.time, scanContext.time) < rules.closeScanMinutes : true;
    const scanGps = scan.gps ?? mockGpsForLocation(scan.location);
    return closeInTime && scanContext.gps && distanceInKm(scanGps, scanContext.gps) >= rules.closeScanDistanceKm;
  });
  if (closeLocationScan) events.push('Badge scanned in two locations close together');

  const activeSessions = sessions.filter((session) => session.badgeId === badge.id);
  if (activeSessions.some((session) => session.durationMins > rules.longStayMinutes)) {
    events.push('Long or repeated suspicious parking sessions');
  }

  if (
    scanContext.device === 'NEW-DEVICE' &&
    scanContext.location &&
    !badge.usualLocations.some((place) => scanContext.location.includes(place))
  ) {
    events.push('New device plus unusual location');
  }

  let score = Math.min(100, events.reduce((total, event) => total + scoreForRiskEvent(event, rules), 0));
  const explanation = explainRisk(events, rules);

  if (badge.status === 'stolen' || badge.status === 'suspended') {
    score = Math.max(score, 85);
    return riskResult({ score, level: RISK_LEVEL.high, events, severity: 'risk-critical', verdict: 'stolen / deactivated', explanation });
  }

  if (badge.status === 'expired') {
    score = Math.max(score, 70);
    return riskResult({
      score,
      level: score >= rules.highRiskThreshold ? RISK_LEVEL.high : RISK_LEVEL.review,
      events,
      severity: 'risk-high',
      verdict: 'invalid',
      explanation
    });
  }

  if (score >= rules.highRiskThreshold) {
    return riskResult({ score, level: RISK_LEVEL.high, events, severity: 'risk-high', verdict: 'invalid', explanation });
  }

  if (score >= rules.monitorThreshold || badge.status === 'under review') {
    return riskResult({
      score,
      level: score >= rules.reviewThreshold ? RISK_LEVEL.review : RISK_LEVEL.monitor,
      events,
      severity: 'risk-watch',
      verdict: 'suspicious',
      explanation
    });
  }

  return riskResult({
    score,
    level: RISK_LEVEL.normal,
    events: events.length ? events : ['No active risk events'],
    severity: 'risk-low',
    verdict: 'valid',
    explanation: ['No configured risk rules were triggered.']
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

function scoreForRiskEvent(event, rules) {
  if (event.includes('stolen') || event.includes('suspended')) return rules.weights.stolenOrSuspended;
  if (event.includes('unregistered')) return rules.weights.unregisteredVehicle;
  if (event.includes('two locations')) return rules.weights.impossibleTravel;
  if (event.includes('failed')) return rules.weights.multipleFailedScans;
  if (event.includes('New device')) return rules.weights.newDeviceUnusualLocation;
  if (event.includes('Long')) return rules.weights.longStay;
  if (event.includes('expired')) return rules.weights.expired;
  return rules.weights.default;
}

function explainRisk(events, rules) {
  if (!events.length) return ['No configured risk rules were triggered.'];
  return events.map((event) => `${event}: +${scoreForRiskEvent(event, rules)} points`);
}

function riskResult(result) {
  return {
    ...result,
    vehicle: result.vehicle ? normaliseVehicle(result.vehicle) : result.vehicle
  };
}
