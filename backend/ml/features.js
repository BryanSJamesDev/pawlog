// Numeric fields used to calculate a pet's baseline
const NUMERIC_FIELDS = ['food', 'water', 'activity', 'weight'];

/**
 * Calculates the average food, water, activity, and weight
 * from a pet's past health entries.
 *
 * @param {Object[]} pastEntries - Previous health entries for a pet
 * @returns {{food: number, water: number, activity: number, weight: number} | null}
 */
export function getBaseline(pastEntries) {
    // Check that pastEntries is an array
    if (!Array.isArray(pastEntries)) {
        throw new TypeError('Past entries must be an array');
    }

    // Return null if there are no past entries
    if (pastEntries.length === 0) {
        return null;
    }

    // Initialize totals for each numeric field
    const totals = {
        food: 0,
        water: 0,
        activity: 0,
        weight: 0
    };

    // Loop through each entry
    for (const entry of pastEntries) {
        // Check that each entry is an object
        if (!entry || typeof entry !== 'object') {
            throw new TypeError('Each entry must be an object');
        }
        
        // Check that each entry contains valid numeric fields
        for (const field of NUMERIC_FIELDS) {
            if (typeof entry[field] !== 'number' || !Number.isFinite(entry[field])) {
                throw new TypeError(`Each entry must have a valid ${field} value`);
            }

            // Add the value to its running total
            totals[field] += entry[field];
        }
    }

    // Calculate the average for each field
    const baseline = {};

    for (const field of NUMERIC_FIELDS) {
        baseline[field] = totals[field] / pastEntries.length;
    }

    return baseline;
}