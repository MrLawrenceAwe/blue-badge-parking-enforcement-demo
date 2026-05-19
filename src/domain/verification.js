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

export const verificationPriorityLabels = {
  normal: 'Normal',
  monitor: 'Monitor',
  review: 'Needs review',
  high: 'High-priority alert'
};

export const verificationStatusLabels = {
  [VERIFICATION_STATUS.valid]: 'Valid',
  [VERIFICATION_STATUS.suspicious]: 'Suspicious',
  [VERIFICATION_STATUS.deactivated]: 'Stolen / deactivated',
  [VERIFICATION_STATUS.invalid]: 'Invalid'
};

const REVIEW_PRIORITY = {
  normal: 'normal',
  monitor: 'monitor',
  review: 'review',
  high: 'high'
};

const VERIFICATION_SEVERITY_CLASS = {
  low: 'verification-low',
  watch: 'verification-watch',
  high: 'verification-high',
  critical: 'verification-critical'
};

const VERIFICATION_TRIGGER_DEFINITIONS = {
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

export const defaultVerificationScoringRules = {
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

const VERIFICATION_RULE_LIMITS = {
  highRiskThreshold: { min: 1, max: 100 },
  reviewThreshold: { min: 1, max: 100 },
  monitorThreshold: { min: 1, max: 100 },
  impossibleTravelWindowMins: { min: 5, max: 240 },
  impossibleTravelMinDistanceKm: { min: 0.1, max: 100 },
  longStayMinutes: { min: 30, max: 480 },
};

const VERIFICATION_WEIGHT_LIMITS = { min: 0, max: 100 };

export function normaliseVerificationRules(rules = defaultVerificationScoringRules) {
  const nextRules = {
    ...defaultVerificationScoringRules,
    ...rules,
    weights: {
      ...defaultVerificationScoringRules.weights,
      ...(rules.weights ?? {}),
    },
  };

  Object.entries(VERIFICATION_RULE_LIMITS).forEach(([field, limits]) => {
    nextRules[field] = clampNumber(nextRules[field], defaultVerificationScoringRules[field], limits);
  });
  Object.keys(nextRules.weights).forEach((field) => {
    nextRules.weights[field] = clampNumber(nextRules.weights[field], defaultVerificationScoringRules.weights[field], VERIFICATION_WEIGHT_LIMITS);
  });

  nextRules.reviewThreshold = Math.min(nextRules.reviewThreshold, nextRules.highRiskThreshold);
  nextRules.monitorThreshold = Math.min(nextRules.monitorThreshold, nextRules.reviewThreshold);
  return nextRules;
}

export function validateVerificationRules(rules = defaultVerificationScoringRules) {
  const issues = [];
  Object.entries(VERIFICATION_RULE_LIMITS).forEach(([field, limits]) => {
    if (!Number.isFinite(Number(rules[field])) || Number(rules[field]) < limits.min || Number(rules[field]) > limits.max) {
      issues.push(`${field} must be between ${limits.min} and ${limits.max}`);
    }
  });
  Object.entries(rules.weights ?? {}).forEach(([field, value]) => {
    if (!Number.isFinite(Number(value)) || Number(value) < VERIFICATION_WEIGHT_LIMITS.min || Number(value) > VERIFICATION_WEIGHT_LIMITS.max) {
      issues.push(`weights.${field} must be between ${VERIFICATION_WEIGHT_LIMITS.min} and ${VERIFICATION_WEIGHT_LIMITS.max}`);
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

export function assessBadgeVerificationRisk(badge, sessions, scans, scanContext = {}, rules = defaultVerificationScoringRules) {
  rules = normaliseVerificationRules(rules);
  const triggeredRules = [];
  if (!badge) {
    return buildVerificationAssessment({
      reviewScore: 100,
      reviewPriority: REVIEW_PRIORITY.high,
      triggers: [buildVerificationTrigger('unknownBadge', rules)],
      severityClass: VERIFICATION_SEVERITY_CLASS.high,
      verificationStatus: VERIFICATION_STATUS.invalid,
      explanation: ['No matching badge record or trusted QR code was found.']
    });
  }

  triggeredRules.push(...getBadgeStatusTriggers(badge, rules));
  const vehicleTrigger = getVehicleMismatchTrigger(badge, scanContext, rules);
  if (vehicleTrigger) triggeredRules.push(vehicleTrigger);
  const badgeScans = scans.filter((scan) => scan.badgeId === badge.id);
  const failedScans = badgeScans.filter((scan) => scan.scanOutcome !== 'valid').length + (scanContext.includeCurrentFailure ? 1 : 0);
  if (failedScans >= 2) triggeredRules.push(buildVerificationTrigger('multipleFailedScans', rules));

  if (hasRecentDistantScan(badgeScans, scanContext, rules)) triggeredRules.push(buildVerificationTrigger('impossibleTravel', rules));

  const activeSessions = getActiveSessionsForBadge(badge, sessions, scanContext.time);
  if (activeSessions.some((session) => session.durationMins > rules.longStayMinutes)) {
    triggeredRules.push(buildVerificationTrigger('longStay', rules));
  }

  if (
    scanContext.device === 'NEW-DEVICE' &&
    scanContext.location &&
    !badge.usualLocations.some((place) => scanContext.location.includes(place))
  ) {
    triggeredRules.push(buildVerificationTrigger('newDeviceUnusualLocation', rules));
  }

  let reviewScore = Math.min(100, triggeredRules.reduce((total, trigger) => total + trigger.points, 0));
  const explanation = explainVerificationTriggers(triggeredRules);

  if (badge.status === 'stolen' || badge.status === 'suspended') {
    reviewScore = Math.max(reviewScore, 85);
    return buildVerificationAssessment({ reviewScore, reviewPriority: REVIEW_PRIORITY.high, triggers: triggeredRules, severityClass: VERIFICATION_SEVERITY_CLASS.critical, verificationStatus: VERIFICATION_STATUS.deactivated, explanation });
  }

  if (badge.status === 'expired') {
    reviewScore = Math.max(reviewScore, 70);
    return buildVerificationAssessment({
      reviewScore,
      reviewPriority: reviewScore >= rules.highRiskThreshold ? REVIEW_PRIORITY.high : REVIEW_PRIORITY.review,
      triggers: triggeredRules,
      severityClass: VERIFICATION_SEVERITY_CLASS.high,
      verificationStatus: VERIFICATION_STATUS.invalid,
      explanation
    });
  }

  if (reviewScore >= rules.highRiskThreshold) {
    return buildVerificationAssessment({ reviewScore, reviewPriority: REVIEW_PRIORITY.high, triggers: triggeredRules, severityClass: VERIFICATION_SEVERITY_CLASS.high, verificationStatus: VERIFICATION_STATUS.invalid, explanation });
  }

  if (reviewScore >= rules.monitorThreshold || badge.status === 'under review') {
    return buildVerificationAssessment({
      reviewScore,
      reviewPriority: reviewScore >= rules.reviewThreshold ? REVIEW_PRIORITY.review : REVIEW_PRIORITY.monitor,
      triggers: triggeredRules,
      severityClass: VERIFICATION_SEVERITY_CLASS.watch,
      verificationStatus: VERIFICATION_STATUS.suspicious,
      explanation
    });
  }

  return buildVerificationAssessment({
    reviewScore,
    reviewPriority: REVIEW_PRIORITY.normal,
    triggers: triggeredRules,
    severityClass: VERIFICATION_SEVERITY_CLASS.low,
    verificationStatus: VERIFICATION_STATUS.valid,
    explanation: ['No configured verification rules were triggered.']
  });
}

function clampNumber(value, fallback, { min, max }) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(max, Math.max(min, numericValue));
}

export function verificationAssessmentFromPermissionError(message) {
  return buildVerificationAssessment({
    reviewScore: 100,
    reviewPriority: REVIEW_PRIORITY.high,
    triggers: [{ type: 'permissionError', label: message, points: 100 }],
    severityClass: VERIFICATION_SEVERITY_CLASS.high,
    verificationStatus: VERIFICATION_STATUS.invalid
  });
}

export function scanOutcomeForVerification(verification) {
  if (verification.verificationStatus === VERIFICATION_STATUS.valid) return 'valid';
  if (verification.verificationStatus === VERIFICATION_STATUS.suspicious) return 'review';
  if (verification.verificationStatus === VERIFICATION_STATUS.deactivated) return 'deactivated';
  return 'invalid';
}

function buildVerificationTrigger(triggerType, rules) {
  const triggerDefinition = VERIFICATION_TRIGGER_DEFINITIONS[triggerType] ?? VERIFICATION_TRIGGER_DEFINITIONS.unknownBadge;
  return {
    type: triggerType,
    label: triggerDefinition.label,
    points: rules.weights[triggerDefinition.weight] ?? rules.weights.default
  };
}

function getBadgeStatusTriggers(badge, rules) {
  return [
    badge.status === 'stolen' && buildVerificationTrigger('stolenBadge', rules),
    badge.status === 'expired' && buildVerificationTrigger('expiredBadge', rules),
    badge.status === 'suspended' && buildVerificationTrigger('suspendedBadge', rules),
    badge.status === 'under review' && buildVerificationTrigger('underReview', rules)
  ].filter(Boolean);
}

function getVehicleMismatchTrigger(badge, scanContext, rules) {
  if (!scanContext.vehicle || vehicleSearchKey(scanContext.vehicle) === vehicleSearchKey(badge.vehicle)) return null;
  return buildVerificationTrigger('unregisteredVehicle', rules);
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

function buildVerificationAssessment({ reviewScore, reviewPriority, triggers, severityClass, verificationStatus, explanation = [] }) {
  return {
    reviewScore,
    reviewPriority,
    triggers,
    severityClass,
    verificationStatus,
    scanOutcome: scanOutcomeForVerification({ verificationStatus }),
    explanation
  };
}

function explainVerificationTriggers(triggers) {
  if (!triggers.length) return ['No configured verification rules were triggered.'];
  return triggers.map((trigger) => `${trigger.label}: +${trigger.points} points`);
}
