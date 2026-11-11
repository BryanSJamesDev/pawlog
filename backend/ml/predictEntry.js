import { extractFeatures } from './features.js';
import { predict } from './logisticRegression.js';
import { PAST_WINDOW } from './buildTrainingData.js';

/**
 * Scores a single pet entry using the trained logistic regression model
 * and recent historical context.
 *
 * @param {Object} entry - The current entry to evaluate
 * @param {Array} pastEntries - Array of earlier entries for this pet
 * @param {Object} model - The trained model object containing weights and bias
 * @param {number} [threshold=0.5] - Probability threshold to flag for attention (0 to 1)
 * @returns {{ probability: number, flagged: boolean }}
 */
export function predictEntry(entry, pastEntries, model, threshold = 0.5) {
  // Throw a TypeError if model is missing or model.weights isn't an array
  if (!model || !Array.isArray(model.weights)) {
    throw new TypeError('A valid model with an array of weights is required.');
  }

  // Throw a TypeError if threshold isn't a finite number from 0 to 1
  if (
    typeof threshold !== 'number' ||
    !Number.isFinite(threshold) ||
    threshold < 0 ||
    threshold > 1
  ) {
    throw new TypeError('Threshold must be a finite number between 0 and 1.');
  }

  // Throw a TypeError if pastEntries isn't an array
  if (!Array.isArray(pastEntries)) {
    throw new TypeError('Past entries must be an array.');
  }

  // Keep only the 14 most recent past entries (sort newest first, then take first 14)
  const recent = [...pastEntries]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, PAST_WINDOW);

  // Extract features using the entry and recent history window
  const features = extractFeatures(entry, recent);

  // Predict the probability using the logistic regression model
  const probability = predict(features, model.weights, model.bias);

  // Return probability and flagged status
  return {
    probability,
    flagged: probability >= threshold,
  };
}
