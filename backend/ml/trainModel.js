import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { buildTrainingData } from './buildTrainingData.js';
import { train, accuracy, trainTestSplit } from './logisticRegression.js';
import { saveModel } from './modelStore.js';

// Fewer than this and the accuracy score means nothing
const MIN_TRAINING_ROWS = 10;

/**
 * Trains a logistic regression model on historical database entries,
 * evaluates its accuracy, and returns the trained model with performance metrics.
 * 
 * @param {Array} entries - All entry objects from the database
 * @param {Object} [options={}] - Training options (learningRate, epochs, random)
 * @returns {{ model: Object, accuracy: number, trainedOn: number }}
 */
export function trainFromEntries(entries, options = {}) {
  // Pull out settings with defaults
  const { learningRate = 0.5, epochs = 500, random = Math.random } = options;

  // Build training data (this also validates the entries)
  const { X, y } = buildTrainingData(entries);

  // Check for minimum training row requirement
  if (X.length < MIN_TRAINING_ROWS) {
    throw new Error(`Need at least ${MIN_TRAINING_ROWS} labeled entries to train (found ${X.length}).`);
  }

  // Check that y has a mix of 1s and 0s
  if (!y.includes(0) || !y.includes(1)) {
    throw new Error('Training data must contain both positive and negative labels.');
  }

  // Split data into training and testing sets (80% train, 20% test)
  const split = trainTestSplit(X, y, 0.2, random);

  // Train on the training portion
  const model = train(split.XTrain, split.yTrain, { learningRate, epochs });

  // Score on the test portion
  const score = accuracy(split.XTest, split.yTest, model);

  // Return model, accuracy score, and training count
  return {
    model,
    accuracy: score,
    trainedOn: split.XTrain.length,
  };
}

/**
 * Trains the model on every entry in the database and saves it.
 */
async function main() {
    try {
        const { getDB } = await import('../db/connection.js');
        const db = await getDB();
        // All entries, including unlabeled ones, since they count as past for other entries
        const entries = await db.collection('entries').find({}).toArray();
        const result = trainFromEntries(entries);
        await saveModel(db.collection('models'), result.model, {
            accuracy: result.accuracy,
            trainedOn: result.trainedOn,
        });
        console.log(
            `Trained on ${result.trainedOn} entries. Test accuracy: ${(result.accuracy * 100).toFixed(1)}%`
        );
        process.exit(0);
    } catch (error) {
        console.error('Training failed:', error);
        process.exit(1);
    }
}

// Only run when called directly (npm run train), not when a test imports this file
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}