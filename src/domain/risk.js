import { vehicleSearchKey } from './badges';
import { distanceInKm, gpsForKnownLocation } from './locations';
import { isSessionActive } from './sessions';
import { minutesBetween } from '../utils/date';

export const VERIFICATION_STATUS = {
  valid: 'valid',
  suspicious: 'suspicious',
  deactivated: 'deactivated',
  invalid: 'invalid'
};

export const riskBandLabels = {
  normal: 'Normal',
  monitor: 'Monitor',
  review: 'Officer review',
  high: 'High priority alert'
};

export const verificationStatusLabels = {
  [VERIFICATION_STATUS.valid]: 'Valid',
  [VERIFICATION_STATUS.suspicious]: 'Suspicious',
  [VERIFICATION_STATUS.deactivated]: 'Stolen / deactivated',
  [VERIFICATION_STATUS.invalid]: 'Invalid'
};

const RISK_BAND = {
  normal: 'normal',
  monitor: 'monitor',
  review: 'review',
  high: 'high'
};

const RISK_SEVERITY_CLASS = {
  low: 'risk-low',
  watch: 'risk-watch',
  high: 'risk-high',
  critical: 'risk-critical'
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

const RISK_RULE_LIMITS = {
  highRiskThreshold: { min: 1, max: 100 },
  reviewThreshold: { min: 1, max: 100 },
  monitorThreshold: { min: 1, max: 100 },
  impossibleTravelWindowMins: { min: 5, max: 240 },
  impossibleTravelMinDistanceKm: { min: 0.1, max: 100 },
  longStayMinutes: { min: 30, max: 480 },
};

const RISK_WEIGHT_LIMITS = { min: 0, max: 100 };

export function normaliseRiskRules(rules = defaultRiskRules) {
  const nextRules = {
    ...defaultRiskRules,
    ...rules,
    weights: {
      ...defaultRiskRules.weights,
      ...(rules.weights ?? {}),
    },
  };

  Object.entries(RISK_RULE_LIMITS).forEach(([field, limits]) => {
    nextRules[field] = clampNumber(nextRules[field], defaultRiskRules[field], limits);
  });
  Object.keys(nextRules.weights).forEach((field) => {
    nextRules.weights[field] = clampNumber(nextRules.weights[field], defaultRiskRules.weights[field], RISK_WEIGHT_LIMITS);
  });

  nextRules.reviewThreshold = Math.min(nextRules.reviewThreshold, nextRules.highRiskThreshold);
  nextRules.monitorThreshold = Math.min(nextRules.monitorThreshold, nextRules.reviewThreshold);
  return nextRules;
}

export function validateRiskRules(rules = defaultRiskRules) {
  const issues = [];
  Object.entries(RISK_RULE_LIMITS).forEach(([field, limits]) => {
    if (!Number.isFinite(Number(rules[field])) || Number(rules[field]) < limits.min || Number(rules[field]) > limits.max) {
      issues.push(`${field} must be between ${limits.min} and ${limits.max}`);
    }
  });
  Object.entries(rules.weights ?? {}).forEach(([field, value]) => {
    if (!Number.isFinite(Number(value)) || Number(value) < RISK_WEIGHT_LIMITS.min || Number(value) > RISK_WEIGHT_LIMITS.max) {
      issues.push(`weights.${field} must be between ${RISK_WEIGHT_LIMITS.min} and ${RISK_WEIGHT_LIMITS.max}`);
    }
  });
  if (Number(rules.highRiskThreshold) < Number(rules.reviewThreshold)) {
    issues.push('highRiskThreshold must be greater than or equal to reviewThreshold');
  }
  if (Number(rules.reviewThreshold) < Number(rules.monitorThreshold)) {
    issues.push('reviewThreshold must be greater than or equal to monitorThreshold');
  }
  return {
    valid: issues.length === 0,
    issues,
  };
}

export function evaluateBadgeRisk(badge, sessions, scans, scanContext = {}, rules = defaultRiskRules) {
  rules = normaliseRiskRules(rules);
  const triggeredRules = [];
  if (!badge) {
    return buildRiskAssessment({
      score: 100,
      riskBand: RISK_BAND.high,
      triggers: [buildRiskTrigger('unknownBadge', rules)],
      severityClass: RISK_SEVERITY_CLASS.high,
      verificationStatus: VERIFICATION_STATUS.invalid,
      explanation: ['No matching badge record or trusted QR code was found.']
    });
  }

  triggeredRules.push(...getBadgeStatusTriggers(badge, rules));
  const vehicleTrigger = getVehicleMismatchTrigger(badge, scanContext, rules);
  if (vehicleTrigger) triggeredRules.push(vehicleTrigger);
  const badgeScans = scans.filter((scan) => scan.badgeId === badge.id);
  const failedScans = badgeScans.filter((scan) => scan.scanOutcome !== 'valid').length + (scanContext.includeCurrentFailure ? 1 : 0);
  if (failedScans >= 2) triggeredRules.push(buildRiskTrigger('multipleFailedScans', rules));

  if (hasRecentDistantScan(badgeScans, scanContext, rules)) triggeredRules.push(buildRiskTrigger('impossibleTravel', rules));

  const activeSessions = getActiveSessionsForBadge(badge, sessions, scanContext.time);
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
    return buildRiskAssessment({ score, riskBand: RISK_BAND.high, triggers: triggeredRules, severityClass: RISK_SEVERITY_CLASS.critical, verificationStatus: VERIFICATION_STATUS.deactivated, explanation });
  }

  if (badge.status === 'expired') {
    score = Math.max(score, 70);
    return buildRiskAssessment({
      score,
      riskBand: score >= rules.highRiskThreshold ? RISK_BAND.high : RISK_BAND.review,
      triggers: triggeredRules,
      severityClass: RISK_SEVERITY_CLASS.high,
      verificationStatus: VERIFICATION_STATUS.invalid,
      explanation
    });
  }

  if (score >= rules.highRiskThreshold) {
    return buildRiskAssessment({ score, riskBand: RISK_BAND.high, triggers: triggeredRules, severityClass: RISK_SEVERITY_CLASS.high, verificationStatus: VERIFICATION_STATUS.invalid, explanation });
  }

  if (score >= rules.monitorThreshold || badge.status === 'under review') {
    return buildRiskAssessment({
      score,
      riskBand: score >= rules.reviewThreshold ? RISK_BAND.review : RISK_BAND.monitor,
      triggers: triggeredRules,
      severityClass: RISK_SEVERITY_CLASS.watch,
      verificationStatus: VERIFICATION_STATUS.suspicious,
      explanation
    });
  }

  return buildRiskAssessment({
    score,
    riskBand: RISK_BAND.normal,
    triggers: triggeredRules,
    severityClass: RISK_SEVERITY_CLASS.low,
    verificationStatus: VERIFICATION_STATUS.valid,
    explanation: ['No configured risk rules were triggered.']
  });
}

function clampNumber(value, fallback, { min, max }) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(max, Math.max(min, numericValue));
}

export function riskFromPermissionError(message) {
  return buildRiskAssessment({
    score: 100,
    riskBand: RISK_BAND.high,
    triggers: [{ type: 'permissionError', label: message, score: 100 }],
    severityClass: RISK_SEVERITY_CLASS.high,
    verificationStatus: VERIFICATION_STATUS.invalid
  });
}

export function scanOutcomeForVerification(risk) {
  if (risk.verificationStatus === VERIFICATION_STATUS.valid) return 'valid';
  if (risk.verificationStatus === VERIFICATION_STATUS.suspicious) return 'review';
  if (risk.verificationStatus === VERIFICATION_STATUS.deactivated) return 'deactivated';
  return 'invalid';
}

function buildRiskTrigger(triggerType, rules) {
  const triggerDefinition = RISK_TRIGGER_DEFINITIONS[triggerType] ?? RISK_TRIGGER_DEFINITIONS.unknownBadge;
  return {
    type: triggerType,
    label: triggerDefinition.label,
    score: rules.weights[triggerDefinition.weight] ?? rules.weights.default
  };
}

function getBadgeStatusTriggers(badge, rules) {
  return [
    badge.status === 'stolen' && buildRiskTrigger('stolenBadge', rules),
    badge.status === 'expired' && buildRiskTrigger('expiredBadge', rules),
    badge.status === 'suspended' && buildRiskTrigger('suspendedBadge', rules),
    badge.status === 'under review' && buildRiskTrigger('underReview', rules)
  ].filter(Boolean);
}

function getVehicleMismatchTrigger(badge, scanContext, rules) {
  if (!scanContext.vehicle || vehicleSearchKey(scanContext.vehicle) === vehicleSearchKey(badge.vehicle)) return null;
  return buildRiskTrigger('unregisteredVehicle', rules);
}

function hasRecentDistantScan(badgeScans, scanContext, rules) {
  return badgeScans.some((scan) => {
    const withinImpossibleTravelWindow = scanContext.time ? minutesBetween(scan.time, scanContext.time) < rules.impossibleTravelWindowMins : true;
    const scanGps = scan.gps ?? gpsForKnownLocation(scan.location);
    return withinImpossibleTravelWindow && scanContext.gps && distanceInKm(scanGps, scanContext.gps) >= rules.impossibleTravelMinDistanceKm;
  });
}

function getActiveSessionsForBadge(badge, sessions, activeAt) {
  const activeSessionTime = activeAt ? new Date(activeAt) : new Date();
  return sessions.filter((session) => session.badgeId === badge.id && isSessionActive(session, activeSessionTime));
}

function buildRiskAssessment({ score, riskBand, triggers, severityClass, verificationStatus, explanation = [] }) {
  return {
    score,
    riskBand,
    triggers,
    severityClass,
    verificationStatus,
    scanOutcome: scanOutcomeForVerification({ verificationStatus }),
    explanation
  };
}

function explainRisk(triggers) {
  if (!triggers.length) return ['No configured risk rules were triggered.'];
  return triggers.map((trigger) => `${trigger.label}: +${trigger.score} points`);
}
