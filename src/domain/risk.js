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
      riskBand: RISK_BAND.high,
      triggers: [buildRiskTrigger('unknownBadge', rules)],
      riskToneClass: 'risk-high',
      verificationStatus: VERIFICATION_STATUS.invalid,
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
  const failedScans = badgeScans.filter((scan) => scan.scanOutcome !== 'valid').length + (scanContext.includeCurrentFailure ? 1 : 0);
  if (failedScans >= 2) triggeredRules.push(buildRiskTrigger('multipleFailedScans', rules));

  const recentDistantScanDetected = badgeScans.some((scan) => {
    const withinImpossibleTravelWindow = scanContext.time ? minutesBetween(scan.time, scanContext.time) < rules.impossibleTravelWindowMins : true;
    const scanGps = scan.gps ?? gpsForKnownLocation(scan.location);
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
    return buildRiskAssessment({ score, riskBand: RISK_BAND.high, triggers: triggeredRules, riskToneClass: 'risk-critical', verificationStatus: VERIFICATION_STATUS.deactivated, explanation });
  }

  if (badge.status === 'expired') {
    score = Math.max(score, 70);
    return buildRiskAssessment({
      score,
      riskBand: score >= rules.highRiskThreshold ? RISK_BAND.high : RISK_BAND.review,
      triggers: triggeredRules,
      riskToneClass: 'risk-high',
      verificationStatus: VERIFICATION_STATUS.invalid,
      explanation
    });
  }

  if (score >= rules.highRiskThreshold) {
    return buildRiskAssessment({ score, riskBand: RISK_BAND.high, triggers: triggeredRules, riskToneClass: 'risk-high', verificationStatus: VERIFICATION_STATUS.invalid, explanation });
  }

  if (score >= rules.monitorThreshold || badge.status === 'under review') {
    return buildRiskAssessment({
      score,
      riskBand: score >= rules.reviewThreshold ? RISK_BAND.review : RISK_BAND.monitor,
      triggers: triggeredRules,
      riskToneClass: 'risk-watch',
      verificationStatus: VERIFICATION_STATUS.suspicious,
      explanation
    });
  }

  return buildRiskAssessment({
    score,
    riskBand: RISK_BAND.normal,
    triggers: triggeredRules,
    riskToneClass: 'risk-low',
    verificationStatus: VERIFICATION_STATUS.valid,
    explanation: ['No configured risk rules were triggered.']
  });
}

export function riskFromPermissionError(message) {
  return buildRiskAssessment({
    score: 100,
    riskBand: RISK_BAND.high,
    triggers: [{ type: 'permissionError', label: message, score: 100 }],
    riskToneClass: 'risk-high',
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

function buildRiskAssessment({ score, riskBand, triggers, riskToneClass, verificationStatus, explanation = [] }) {
  return {
    score,
    riskBand,
    triggers,
    riskToneClass,
    verificationStatus,
    scanOutcome: scanOutcomeForVerification({ verificationStatus }),
    explanation
  };
}

function explainRisk(triggers) {
  if (!triggers.length) return ['No configured risk rules were triggered.'];
  return triggers.map((trigger) => `${trigger.label}: +${trigger.score} points`);
}
