/**
 * Time-based Rotation Logic Utility
 *
 * Provides helper functions for computing rotation cycles,
 * epoch determination, and position mapping for the scheduling service.
 */

/**
 * Calculate total cycle duration from a list of schedule items.
 * @param {Array<{duration: number}>} items - Items with duration in minutes
 * @returns {number} Total cycle duration in milliseconds
 */
const calculateTotalCycleDuration = (items) => {
  const totalMinutes = items.reduce((sum, item) => {
    const dur = item.duration > 0 ? item.duration : 5; // default fallback
    return sum + dur;
  }, 0);
  return totalMinutes * 60 * 1000; // convert to ms
};

/**
 * Determine the epoch (reference start time) from a list of content items.
 * Uses the earliest start_time among all items.
 * @param {Array<{start_time: Date|string}>} items
 * @returns {Date|null}
 */
const determineEpoch = (items) => {
  if (!items || items.length === 0) return null;

  let earliest = new Date(items[0].start_time);
  for (let i = 1; i < items.length; i++) {
    const t = new Date(items[i].start_time);
    if (t < earliest) earliest = t;
  }
  return earliest;
};

/**
 * Get elapsed milliseconds from epoch to current time.
 * @param {Date} epoch
 * @param {Date} currentTime
 * @returns {number}
 */
const getElapsedMs = (epoch, currentTime) => {
  return currentTime.getTime() - epoch.getTime();
};

/**
 * Get position within the current rotation cycle.
 * @param {number} elapsedMs
 * @param {number} totalCycleDurationMs
 * @returns {number}
 */
const getCyclePosition = (elapsedMs, totalCycleDurationMs) => {
  if (totalCycleDurationMs <= 0) return 0;
  return elapsedMs % totalCycleDurationMs;
};

module.exports = {
  calculateTotalCycleDuration,
  determineEpoch,
  getElapsedMs,
  getCyclePosition,
};
