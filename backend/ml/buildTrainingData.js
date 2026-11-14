import { extractFeatures } from './features.js';

// How many earlier entries count as a pet's "normal"
export const PAST_WINDOW = 14;

/**
 * Converts saved entries into feature matrices (X) and labels (y) for machine learning training.
 *
 * @param {Array} entries - Array of entry objects from the database
 * @returns {{ X: Array, y: Array }} The feature vectors and corresponding binary labels
 */
export function buildTrainingData(entries) {
  // Throw a TypeError if entries isn't an array
  if (!Array.isArray(entries)) {
    throw new TypeError('Entries must be an array.');
  }

  // Validate every entry has string userId, petName, and a valid date
  for (const entry of entries) {
    if (
      typeof entry?.userId !== 'string' ||
      typeof entry?.petName !== 'string'
    ) {
      throw new TypeError(
        "Every entry must have a string 'userId' and 'petName'.",
      );
    }
    if (entry.date == null || Number.isNaN(new Date(entry.date).getTime())) {
      throw new TypeError("Every entry must have a valid 'date'.");
    }
  }

  // Group entries by pet using a Map (key: userId::petName)
  const petGroups = new Map();
  for (const entry of entries) {
    const key = `${entry.userId}::${entry.petName}`;
    if (!petGroups.has(key)) {
      petGroups.set(key, []);
    }
    petGroups.get(key).push(entry);
  }

  const X = [];
  const y = [];

  // Process each pet's entries
  for (const list of petGroups.values()) {
    // Sort a copy oldest first
    const sorted = [...list].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      // Get the past entries within the window (up to PAST_WINDOW entries before current index)
      const past = sorted.slice(Math.max(0, i - PAST_WINDOW), i);

      // If needsAttention is explicitly true or false, include it in training data
      if (entry.needsAttention === true || entry.needsAttention === false) {
        X.push(extractFeatures(entry, past));
        y.push(entry.needsAttention ? 1 : 0);
      }
      // Note: Entries with null/unreviewed needsAttention are skipped for X/y
      // but remain in 'sorted' so they contribute to 'past' history for subsequent entries.
    }
  }

  // Return X and y
  return { X, y };
}
