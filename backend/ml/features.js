// Numeric fields used to calculate a pet's baseline
const NUMERIC_FIELDS = ['food', 'water', 'activity', 'weight'];

// Fixed list of symptoms used by the ML model
export const SYMPTOMS = ['not eating', 'vomiting', 'diarrhea', 'low energy', 'coughing'];

// Food below this fraction of normal counts as a low day
const LOW_FOOD_RATIO = 0.8;

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

    // Add the number of consecutive low-food days
    features.push(countLowDays(entry, pastEntries));
    
    return features;
}

/**
 * Counts consecutive days of low food intake, ending with today's entry.
 *
 * @param {Object} entry - Today's health entry
 * @param {Object[]} pastEntries - Previous health entries for the pet
 * @returns {number} Number of consecutive low-food days
 */
export function countLowDays(entry, pastEntries) {
    // Validate today's entry
    checkEntry(entry);

    // Calculate the pet's baseline
    const baseline = getBaseline(pastEntries);

    // Return 0 if there is no usable food baseline
    if (baseline === null || baseline.food === 0) {
        return 0;
    }

    // Check that every past entry has a valid date
    for (const pastEntry of pastEntries) {
        if (pastEntry.date === null ||
            pastEntry.date === undefined ||
            Number.isNaN(new Date(pastEntry.date).getTime())) {
            throw new TypeError('Each past entry must have a valid date');
        }
    }

    // Calculate the low-food threshold
    const limit = baseline.food * LOW_FOOD_RATIO;

    // Return 0 if today's food intake is not below the limit
    if (entry.food >= limit) {
        return 0;
    }

    // Start the count at 1 for today's low-food entry
    let count = 1;

    // Sort a copy of past entries, newest first
    const sorted = [...pastEntries].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    // Count consecutive past days with low food intake
    for (const pastEntry of sorted) {
        if (pastEntry.food < limit) {
            count++;
        } else {
            break;
        }
    }

    return count;
}