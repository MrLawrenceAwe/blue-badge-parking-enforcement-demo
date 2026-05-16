import { vehicleSearchKey } from './badges';
import { distanceInKm, demoGpsForLocation } from './locations';
import { isSessionActive } from './sessions';
import { minutesBetween } from '../utils/date';

export const VERIFICATION_VERDICT = {
  valid: 'valid',
  suspicious: 'suspicious',
  deactivated: 'deactivated',
  invalid: 'invalid'
};

export const riskLevelLabels = {
  normal: 'Normal',
  monitor: 'Monitor',
  review: 'Officer review',
  high: 'High priority alert'
};

export const verificationVerdictLabels = {
  [VERIFICATION_VERDICT.valid]: 'Valid',
  [VERIFICATION_VERDICT.suspicious]: 'Suspicious',
  [VERIFICATION_VERDICT.deactivated]: 'Stolen / deactivated',
  [VERIFICATION_VERDICT.invalid]: 'Invalid'
};

const RISK_LEVEL = {
  normal: 'normal',
  monitor: 'monitor',
  review: 'review',
  high: 'high'
};

const RISK_TRIGGER_DEFINITIONS = {
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
};

export const defaultRiskRules = {
  highRiskThreshold: 81,
  reviewThreshold: 61,
  monitorThreshold: 31,
  impossibleTravelWindowMins: 45,
  impossibleTravelMinDistanceKm: 2,
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
  const triggeredRules = [];
  if (!badge) {
    return buildRiskAssessment({
      score: 100,
      level: RISK_LEVEL.high,
      triggers: [buildRiskTrigger('unknownBadge', rules)],
      severityClass: 'risk-high',
      verdict: VERIFICATION_VERDICT.invalid,
      explanation: ['No matching badge record or trusted QR code was found.']
    });
  }

  if (badge.status === 'stolen') triggeredRules.push(buildRiskTrigger('stolenBadge', rules));
  if (badge.status === 'expired') triggeredRules.push(buildRiskTrigger('expiredBadge', rules));
  if (badge.status === 'suspended') triggeredRules.push(buildRiskTrigger('suspendedBadge', rules));
  if (badge.status === 'under review') triggeredRules.push(buildRiskTrigger('underReview', rules));
  if (scanContext.vehicle && vehicleSearchKey(scanContext.vehicle) !== vehicleSearchKey(badge.vehicle)) {
    triggeredRules.push(buildRiskTrigger('unregisteredVehicle', rules));
  }

  const badgeScans = scans.filter((scan) => scan.badgeId === badge.id);
  const failedScans = badgeScans.filter((scan) => scan.outcome !== 'valid').length + (scanContext.includeCurrentFailure ? 1 : 0);
  if (failedScans >= 2) triggeredRules.push(buildRiskTrigger('multipleFailedScans', rules));

  const recentDistantScanDetected = badgeScans.some((scan) => {
    const withinImpossibleTravelWindow = scanContext.time ? minutesBetween(scan.time, scanContext.time) < rules.impossibleTravelWindowMins : true;
    const scanGps = scan.gps ?? demoGpsForLocation(scan.location);
    return withinImpossibleTravelWindow && scanContext.gps && distanceInKm(scanGps, scanContext.gps) >= rules.impossibleTravelMinDistanceKm;
  });
  if (recentDistantScanDetected) triggeredRules.push(buildRiskTrigger('impossibleTravel', rules));

  const activeSessionTime = scanContext.time ? new Date(scanContext.time) : new Date();
  const activeSessions = sessions.filter((session) => session.badgeId === badge.id && isSessionActive(session, activeSessionTime));
  if (activeSessions.some((session) => session.durationMins > rules.longStayMinutes)) {
    triggeredRules.push(buildRiskTrigger('longStay', rules));
  }

  if (
    scanContext.device === 'NEW-DEVICE' &&
    scanContext.location &&
    !badge.usualLocations.some((place) => scanContext.location.includes(place))
  ) {
    triggeredRules.push(buildRiskTrigger('newDeviceUnusualLocation', rules));
  }

  let score = Math.min(100, triggeredRules.reduce((total, trigger) => total + trigger.score, 0));
  const explanation = explainRisk(triggeredRules);

  if (badge.status === 'stolen' || badge.status === 'suspended') {
    score = Math.max(score, 85);
    return buildRiskAssessment({ score, level: RISK_LEVEL.high, triggers: triggeredRules, severityClass: 'risk-critical', verdict: VERIFICATION_VERDICT.deactivated, explanation });
  }

  if (badge.status === 'expired') {
    score = Math.max(score, 70);
    return buildRiskAssessment({
      score,
      level: score >= rules.highRiskThreshold ? RISK_LEVEL.high : RISK_LEVEL.review,
      triggers: triggeredRules,
      severityClass: 'risk-high',
      verdict: VERIFICATION_VERDICT.invalid,
      explanation
    });
  }

  if (score >= rules.highRiskThreshold) {
    return buildRiskAssessment({ score, level: RISK_LEVEL.high, triggers: triggeredRules, severityClass: 'risk-high', verdict: VERIFICATION_VERDICT.invalid, explanation });
  }

  if (score >= rules.monitorThreshold || badge.status === 'under review') {
    return buildRiskAssessment({
      score,
      level: score >= rules.reviewThreshold ? RISK_LEVEL.review : RISK_LEVEL.monitor,
      triggers: triggeredRules,
      severityClass: 'risk-watch',
      verdict: VERIFICATION_VERDICT.suspicious,
      explanation
    });
  }

  return buildRiskAssessment({
    score,
    level: RISK_LEVEL.normal,
    triggers: triggeredRules,
    severityClass: 'risk-low',
    verdict: VERIFICATION_VERDICT.valid,
    explanation: ['No configured risk rules were triggered.']
  });
}

export function riskFromPermissionError(message) {
  return buildRiskAssessment({
    score: 100,
    level: RISK_LEVEL.high,
    triggers: [{ type: 'permissionError', label: message, score: 100 }],
    severityClass: 'risk-high',
    verdict: VERIFICATION_VERDICT.invalid
  });
}

export function scanOutcomeForVerification(risk) {
  if (risk.verdict === VERIFICATION_VERDICT.valid) return 'valid';
  if (risk.verdict === VERIFICATION_VERDICT.suspicious) return 'review';
  if (risk.verdict === VERIFICATION_VERDICT.deactivated) return 'deactivated';
  return 'invalid';
}

function buildRiskTrigger(type, rules) {
  const triggerDefinition = RISK_TRIGGER_DEFINITIONS[type] ?? RISK_TRIGGER_DEFINITIONS.unknownBadge;
  return {
    type,
    label: triggerDefinition.label,
    score: rules.weights[triggerDefinition.weight] ?? rules.weights.default
  };
}

function buildRiskAssessment({ score, level, triggers, severityClass, verdict, explanation = [] }) {
  return {
    score,
    level,
    triggers,
    severityClass,
    verdict,
    outcome: scanOutcomeForVerification({ verdict }),
    explanation
  };
}

function explainRisk(triggers) {
  if (!triggers.length) return ['No configured risk rules were triggered.'];
  return triggers.map((trigger) => `${trigger.label}: +${trigger.score} points`);
}
