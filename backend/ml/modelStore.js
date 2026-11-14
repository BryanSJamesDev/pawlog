// Fixed id: there is only one current model
const MODEL_ID = 'health-alerts';
// Must match the number of features extractFeatures returns
const FEATURE_COUNT = 10;

/**
 * Validates that a model object has valid weights and bias.
 *
 * @param {Object} model - Model object containing weights and bias
 * @returns {boolean} True if valid, false otherwise
 */
function isValidModel(model) {
  if (
    !model ||
    !Array.isArray(model.weights) ||
    model.weights.length !== FEATURE_COUNT
  ) {
    return false;
  }

  // Check that every weight is a finite number
  for (const w of model.weights) {
    if (typeof w !== 'number' || !Number.isFinite(w)) {
      return false;
    }
  }

  // Check that bias is a finite number
  if (typeof model.bias !== 'number' || !Number.isFinite(model.bias)) {
    return false;
  }

  return true;
}

/**
 * Saves or updates the trained model in the database collection using an upsert.
 *
 * @param {Object} collection - MongoDB collection mock or instance
 * @param {Object} model - Model containing weights and bias
 * @param {Object} [details={}] - Additional details like accuracy and trainedOn counts
 * @returns {Promise<Object>} The saved document object
 */
export async function saveModel(collection, model, details = {}) {
  // Throw a TypeError if collection?.replaceOne isn't a function
  if (typeof collection?.replaceOne !== 'function') {
    throw new TypeError('Collection must have a replaceOne function.');
  }

  // Throw a TypeError if model weights or bias are invalid
  if (!isValidModel(model)) {
    throw new TypeError(
      `Model must have exactly ${FEATURE_COUNT} finite numeric weights and a finite numeric bias.`,
    );
  }

  // Build the document
  const doc = {
    _id: MODEL_ID,
    weights: model.weights,
    bias: model.bias,
    accuracy: details.accuracy ?? null,
    trainedOn: details.trainedOn ?? null,
    trainedAt: new Date(),
  };

  // Save it using replaceOne with upsert
  await collection.replaceOne({ _id: MODEL_ID }, doc, { upsert: true });

  // Return doc
  return doc;
}

/**
 * Loads the current model from the database collection.
 *
 * @param {Object} collection - MongoDB collection mock or instance
 * @returns {Promise<Object|null>} The stored model document, or null if none exists
 */
export async function loadModel(collection) {
  // Throw a TypeError if collection?.findOne isn't a function
  if (typeof collection?.findOne !== 'function') {
    throw new TypeError('Collection must have a findOne function.');
  }

  // Find the model document by fixed ID
  const doc = await collection.findOne({ _id: MODEL_ID });

  // If there's no doc, return null
  if (!doc) {
    return null;
  }

  // If the doc's weights or bias are bad, throw an Error
  if (!isValidModel(doc)) {
    throw new Error('Saved model is invalid. Retrain it.');
  }

  // Return doc
  return doc;
}
