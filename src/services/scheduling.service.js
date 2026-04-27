/**
 * SCHEDULING SERVICE — Core Rotation Algorithm
 *
 * Implements a stateless, epoch-based time rotation system.
 * No cron jobs or timers required — the active content is computed
 * purely from the current time and the schedule metadata.
 */

const {
  calculateTotalCycleDuration,
  determineEpoch,
  getElapsedMs,
  getCyclePosition,
} = require('../utils/scheduler.util');

/**
 * Determine which content item is currently active based on time-based rotation.
 *
 * Algorithm:
 * 1. Sort contentList by rotation_order ASC
 * 2. Calculate total_cycle_duration = sum of all durations (in ms)
 * 3. Use the earliest start_time among the list as the epoch
 * 4. elapsed = currentTime - epoch (in ms)
 * 5. position = elapsed % total_cycle_duration (position within current cycle)
 * 6. Walk through sorted list, accumulating durations
 *    When accumulated_duration > position → that item is currently active
 * 7. Return that content item
 *
 * @param {Array} contentList - Array of content records with schedule info.
 *   Each item should have:
 *     - schedule.rotation_order (integer)
 *     - schedule.duration (integer, minutes)
 *     - start_time (Date or ISO string)
 * @param {Date} currentTime - The current time (defaults to new Date())
 * @returns {Object|null} The currently active content item, or null
 */
const getActiveContent = (contentList, currentTime = new Date()) => {
  // ── Edge Case: empty list ──────────────────────────────
  if (!contentList || contentList.length === 0) {
    return null;
  }

  // ── Edge Case: single item → always active ─────────────
  if (contentList.length === 1) {
    return contentList[0];
  }

  // 1. Sort by rotation_order ASC
  const sorted = [...contentList].sort((a, b) => {
    const orderA = a.schedule ? a.schedule.rotation_order : 0;
    const orderB = b.schedule ? b.schedule.rotation_order : 0;
    return orderA - orderB;
  });

  // Build items array with duration in ms
  const items = sorted.map((item) => {
    let durationMinutes = item.schedule ? item.schedule.duration : 5;
    // Edge Case: duration=0 → treat as 5 minutes default
    if (!durationMinutes || durationMinutes <= 0) {
      durationMinutes = 5;
    }
    return {
      content: item,
      durationMs: durationMinutes * 60 * 1000,
      duration: durationMinutes,
    };
  });

  // 2. Calculate total cycle duration
  const totalCycleDurationMs = calculateTotalCycleDuration(items);

  // Edge Case: if total is 0 (shouldn't happen after fallback, but safety)
  if (totalCycleDurationMs <= 0) {
    return sorted[0];
  }

  // 3. Determine epoch (earliest start_time)
  const epoch = determineEpoch(sorted);
  if (!epoch) {
    return sorted[0];
  }

  // 4. Calculate elapsed time
  const elapsedMs = getElapsedMs(epoch, currentTime);

  // Edge Case: epoch is in the future → not started yet
  if (elapsedMs < 0) {
    return null;
  }

  // 5. Get position within current cycle
  const position = getCyclePosition(elapsedMs, totalCycleDurationMs);

  // 6. Walk through sorted items, accumulating durations
  let accumulated = 0;
  for (const item of items) {
    accumulated += item.durationMs;
    if (accumulated > position) {
      return item.content;
    }
  }

  // Fallback: return the first item (should not reach here)
  return sorted[0];
};

module.exports = { getActiveContent };
