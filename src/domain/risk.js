import { normaliseVehicle, vehicleSearchKey } from './badges';
import { distanceInKm, mockGpsForLocation } from './locations';
import { minutesBetween } from '../utils/date';

export const riskLevelLabel = {
  normal: 'Normal',
  monitor: 'Monitor',
  review: 'Officer review',
  high: 'Auto-suspend / high priority alert'
};

const RISK_LEVEL = {
  normal: 'normal',
  monitor: 'monitor',
  review: 'review',
  high: 'high'
};

const RISK_EVENTS = {
  unknownBadge: {
    label: 'Unknown badge or invalid verification token',
    weight: 'default'
  },
  stolenBadge: {
    label: 'Badge used after being reported stolen',
    weight: 'stolenOrSuspended'
  },
  expiredBadge: {
    label: 'Badge is expired',
    weight: 'expired'
  },
  suspendedBadge: {
    label: 'Badge is suspended',
    weight: 'stolenOrSuspended'
  },
  underReview: {
    label: 'Badge already under review',
    weight: 'default'
  },
  unregisteredVehicle: {
    label: 'Badge used with unregistered vehicle',
    weight: 'unregisteredVehicle'
  },
  multipleFailedScans: {
    label: 'Multiple failed scans',
    weight: 'multipleFailedScans'
  },
  impossibleTravel: {
    label: 'Badge scanned in two locations close together',
    weight: 'impossibleTravel'
  },
  longStay: {
    label: 'Long or repeated suspicious parking sessions',
    weight: 'longStay'
  },
  newDeviceUnusualLocation: {
    label: 'New device plus unusual location',
    weight: 'newDeviceUnusualLocation'
  },
  noActiveRisk: {
    label: 'No active risk events',
    weight: 'default'
  }
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
      events: [riskEvent('unknownBadge', rules)],
      severity: 'risk-high',
      verdict: 'invalid',
      explanation: ['No matching badge record or trusted QR token was found.']
    });
  }

  if (badge.status === 'stolen') events.push(riskEvent('stolenBadge', rules));
  if (badge.status === 'expired') events.push(riskEvent('expiredBadge', rules));
  if (badge.status === 'suspended') events.push(riskEvent('suspendedBadge', rules));
  if (badge.status === 'under review') events.push(riskEvent('underReview', rules));
  if (scanContext.vehicle && vehicleSearchKey(scanContext.vehicle) !== vehicleSearchKey(badge.vehicle)) {
    events.push(riskEvent('unregisteredVehicle', rules));
  }

  const badgeScans = scans.filter((scan) => scan.badgeId === badge.id);
  const failedScans = badgeScans.filter((scan) => scan.outcome !== 'valid').length + (scanContext.includeCurrentFailure ? 1 : 0);
  if (failedScans >= 2) events.push(riskEvent('multipleFailedScans', rules));

  const closeLocationScan = badgeScans.some((scan) => {
    const closeInTime = scanContext.time ? minutesBetween(scan.time, scanContext.time) < rules.closeScanMinutes : true;
    const scanGps = scan.gps ?? mockGpsForLocation(scan.location);
    return closeInTime && scanContext.gps && distanceInKm(scanGps, scanContext.gps) >= rules.closeScanDistanceKm;
  });
  if (closeLocationScan) events.push(riskEvent('impossibleTravel', rules));

  const activeSessions = sessions.filter((session) => session.badgeId === badge.id);
  if (activeSessions.some((session) => session.durationMins > rules.longStayMinutes)) {
    events.push(riskEvent('longStay', rules));
  }

  if (
    scanContext.device === 'NEW-DEVICE' &&
    scanContext.location &&
    !badge.usualLocations.some((place) => scanContext.location.includes(place))
  ) {
    events.push(riskEvent('newDeviceUnusualLocation', rules));
  }

  let score = Math.min(100, events.reduce((total, event) => total + event.score, 0));
  const explanation = explainRisk(events);

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
    events: events.length ? events : [riskEvent('noActiveRisk', rules)],
    severity: 'risk-low',
    verdict: 'valid',
    explanation: ['No configured risk rules were triggered.']
  });
}

export function riskFromPermissionError(message) {
  return riskResult({
    score: 100,
    level: RISK_LEVEL.high,
    events: [{ type: 'permissionError', label: message, score: 100 }],
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

function riskEvent(type, rules) {
  const event = RISK_EVENTS[type] ?? RISK_EVENTS.unknownBadge;
  return {
    type,
    label: event.label,
    score: rules.weights[event.weight] ?? rules.weights.default
  };
}

function explainRisk(events) {
  if (!events.length) return ['No configured risk rules were triggered.'];
  return events.map((event) => `${event.label}: +${event.score} points`);
}

function riskResult(result) {
  return {
    ...result,
    vehicle: result.vehicle ? normaliseVehicle(result.vehicle) : result.vehicle
  };
}
