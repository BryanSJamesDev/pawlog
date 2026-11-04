// Numeric fields used to calculate a pet's baseline
const NUMERIC_FIELDS = ['food', 'water', 'activity', 'weight'];

// Fixed list of symptoms used by the ML model
export const SYMPTOMS = ['not eating', 'vomiting', 'diarrhea', 'low energy', 'coughing'];


/**
 * Checks that an entry is an object with valid numeric fields.
 *
 * @param {Object} entry - Health entry to validate
 * @throws {TypeError} If the entry or its numeric fields are invalid
 */
function checkEntry(entry) {
    // Check that entry is an object
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new TypeError('Entry must be an object');
    }

    // Check that each numeric field is a finite number
    for (const field of NUMERIC_FIELDS) {
        if (typeof entry[field] !== 'number' || !Number.isFinite(entry[field])) {
            throw new TypeError(`Entry must have a valid ${field} value`);
        }
    }
}

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
        // Check that each entry is valid
        checkEntry(entry);

        // Add each value to its running total
        for (const field of NUMERIC_FIELDS) {
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

/**
 * Extracts numeric features from a health entry for the ML model.
 *
 * @param {Object} entry - Current health entry
 * @param {Object[]} pastEntries - Previous health entries for the pet
 * @returns {number[]} Extracted features in a fixed order
 */
export function extractFeatures(entry, pastEntries) {
    // Validate the current entry
    checkEntry(entry);

    // Get symptoms, defaulting to an empty array if missing
    const symptoms = entry.symptoms === undefined ? [] : entry.symptoms;

    // Check that symptoms is an array
    if (!Array.isArray(symptoms)) {
        throw new TypeError('Symptoms must be an array');
    }

    // Check that every symptom is a string
    for (const symptom of symptoms) {
        if (typeof symptom !== 'string') {
            throw new TypeError('All symptoms must be strings');
        }
    }

    // Calculate the pet's baseline
    const baseline = getBaseline(pastEntries);

    // Store extracted features
    const features = [];

    // Calculate change from normal for each numeric field
    for (const field of NUMERIC_FIELDS) {
        if (baseline === null || baseline[field] === 0) {
            features.push(0);
        } else {
            features.push((entry[field] - baseline[field]) / baseline[field]);
        }
    }

    // Add symptom flags in the fixed order
    for (const symptom of SYMPTOMS) {
        features.push(symptoms.includes(symptom) ? 1 : 0);
    }

    return features;
}