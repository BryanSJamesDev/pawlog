/**
 * Calculates the sigmoid of a number.
 * Converts any real number into a probability between 0 and 1.
 *
 * @param {number} z - Input value
 * @returns {number} Sigmoid probability
 */
export function sigmoid(z) {
    if (typeof z !== 'number' || !Number.isFinite(z)) {
        throw new TypeError('Input must be a finite number');
    }

    return 1 / (1 + Math.exp(-z));
}

/**
 * Predicts the probability of a health problem using features and model weights.
 *
 * @param {number[]} features - Input values for the health entry
 * @param {number[]} weights - Model weights corresponding to each feature
 * @param {number} bias - Additional value added to the weighted total
 * @returns {number} Predicted probability between 0 and 1
 */
export function predict(features, weights, bias) {
    if (!Array.isArray(features) || !Array.isArray(weights)) {
        throw new TypeError('Features and weights must be arrays');
    }

    if (features.length !== weights.length || features.length === 0) {
        throw new Error('Features and weights must have the same non-empty length');
    }

    if (typeof bias !== 'number' || !Number.isFinite(bias)) {
        throw new TypeError('Bias must be a finite number');
    }

    let total = bias;

    for (let i = 0; i < features.length; i++) {
        if (typeof features[i] !== 'number' || typeof weights[i] !== 'number') {
            throw new TypeError('All features and weights must be numbers');
        }

        total += features[i] * weights[i];
    }

    return sigmoid(total);
}