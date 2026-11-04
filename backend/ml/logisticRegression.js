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