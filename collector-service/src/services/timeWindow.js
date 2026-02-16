/**
 * Utilities for handling time windows in hours
 */

const { env } = require("../config/env");

function resolveHours(platform, requestedHours) {
  if (requestedHours && Number.isFinite(requestedHours) && requestedHours > 0) {
    return requestedHours;
  }
  const platformDefault = env.platformDefaults[platform];
  if (platformDefault && platformDefault > 0) return platformDefault;
  return env.defaultHours;
}

function getWindowRange(hours) {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
  return { start, end };
}

module.exports = {
  resolveHours,
  getWindowRange,
};

