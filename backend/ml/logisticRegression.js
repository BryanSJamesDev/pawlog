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

/**
 * Trains a logistic regression model using gradient descent.
 *
 * @param {number[][]} X - Training examples and their features
 * @param {number[]} y - Actual answers (0 or 1)
 * @param {Object} options - Training settings
 * @param {number} options.learningRate - Size of each update
 * @param {number} options.epochs - Number of training iterations
 * @returns {{weights: number[], bias: number}} Trained model parameters
 */
export function train(X, y, options = {}) {
    // Check that X and y are arrays
    if (!Array.isArray(X) || !Array.isArray(y)) {
        throw new TypeError('X and y must be arrays');
    }

    // Check that X and y are not empty and have the same length
    if (X.length === 0 || y.length === 0 || X.length !== y.length) {
        throw new Error('X and y must have the same non-empty length');
    }

    // Check that every row is an array with the same non-empty length
    if (!Array.isArray(X[0]) || X[0].length === 0) {
        throw new Error('Each row must be a non-empty array');
    }

    const n = X[0].length;

    for (let i = 0; i < X.length; i++) {
        if (!Array.isArray(X[i]) || X[i].length !== n) {
            throw new Error('All rows must have the same non-empty length');
        }
    }

    // Check that every answer is either 0 or 1
    for (let i = 0; i < y.length; i++) {
        if (y[i] !== 0 && y[i] !== 1) {
            throw new Error('All y values must be 0 or 1');
        }
    }

    // Set training options with defaults
    const { learningRate = 0.1, epochs = 1000 } = options;

    // Validate learning rate
    if (typeof learningRate !== 'number' ||
        !Number.isFinite(learningRate) ||
        learningRate <= 0) {
        throw new Error('Learning rate must be a finite number greater than 0');
    }

    // Validate epochs
    if (!Number.isInteger(epochs) || epochs <= 0) {
        throw new Error('Epochs must be a whole number greater than 0');
    }

    // Get the number of examples and features
    const m = X.length;

    // Initialize weights and bias
    const weights = new Array(n).fill(0);
    let bias = 0;

    // Repeat the training process for each epoch
    for (let epoch = 0; epoch < epochs; epoch++) {
        // Reset gradients at the beginning of each epoch
        const weightGradients = new Array(n).fill(0);
        let biasGradient = 0;

        // Calculate gradients for every training example
        for (let i = 0; i < m; i++) {
            const error = predict(X[i], weights, bias) - y[i];

            for (let j = 0; j < n; j++) {
                weightGradients[j] += error * X[i][j];
            }

            biasGradient += error;
        }

        // Update weights using the average gradient
        for (let j = 0; j < n; j++) {
            weights[j] -= learningRate * weightGradients[j] / m;
        }

        // Update bias using the average gradient
        bias -= learningRate * biasGradient / m;
    }

    // Return the trained model
    return { weights, bias };
}