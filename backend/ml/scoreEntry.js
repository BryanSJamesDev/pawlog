import { loadModel } from './modelStore.js';
import { predictEntry } from './predictEntry.js';
import { PAST_WINDOW } from './buildTrainingData.js';

/**
 * Scores an entry to calculate its attention probability using the trained model 
 * and historical past entries.
 * 
 * @param {Object} params - Named parameters
 * @param {Object} params.entries - Entries collection
 * @param {Object} params.models - Models collection
 * @param {string} params.userId - User ID
 * @param {Object} params.entry - Entry object being scored
 * @param {string|Object} [params.excludeId=null] - Entry ID to exclude (used during updates)
 * @returns {Promise<number|null>} Probability score or null if scoring fails or no model exists
 */
export async function scoreEntry({ entries, models, userId, entry, excludeId = null }) {
  try {
    // Load model; if null, return null (does not block saving)
    const model = await loadModel(models);
    if (!model) {
      return null;
    }

    // Find this pet's earlier entries
    const filter = { userId, petName: entry.petName, date: { $lt: entry.date } };
    if (excludeId) {
        filter._id = { $ne: excludeId };
    }
    const past = await entries.find(filter).sort({ date: -1 }).limit(PAST_WINDOW).toArray();

    // Return prediction probability
    const prediction = predictEntry(entry, past, model);
    return prediction.probability;
  } catch (error) {
    // Catch any error, log it, and return null so saving never gets blocked
    console.error('Could not score entry', error);
    return null;
  }
}