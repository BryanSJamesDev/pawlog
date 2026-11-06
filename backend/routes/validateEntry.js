import { SYMPTOMS } from '../ml/features.js';

/**
 * Converts a form value to a number 0 or higher.
 * Rejects blanks, null, and true/false instead of turning them into 0 or 1.
 *
 * @param {*} value - Raw value from the request body
 * @param {string} field - Field name, for the error message
 * @returns {number} The converted number
 * @throws {Error} If the value is missing, blank, or not a number 0 or higher
 */
function toNumber(value, field) {
    let number;

    if (typeof value === 'number') {
        number = value;
    } else if (typeof value === 'string' && value.trim() !== '') {
        number = Number(value);
    } else {
        throw new Error(`Invalid ${field}: must be a number.`);
    }

    if (!Number.isFinite(number) || number < 0) {
        throw new Error(`Invalid ${field}: must be a finite number greater than or equal to 0.`);
    }

    return number;
}

/**
 * Validates and sanitizes a health entry object from request body input.
 * 
 * @param {Object} body - The raw request body to validate.
 * @returns {Object} A new sanitized and validated entry object.
 * @throws {Error} If any validation check fails.
 */
export function validateEntry(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new Error('Invalid body: must be an object.');
    }

    // Validate petName
    if (typeof body.petName !== 'string' || !body.petName.trim()) {
        throw new Error('Invalid petName: must be a non-empty string.');
    }
    const petName = body.petName.trim();

    // Validate petSpecies
    if (typeof body.petSpecies !== 'string' || !body.petSpecies.trim()) {
        throw new Error('Invalid petSpecies: must be a non-empty string.');
    }
    const petSpecies = body.petSpecies.trim();

    // Validate date (null would quietly become January 1, 1970)
    if (body.date === null || body.date === undefined) {
        throw new Error('Invalid date: date is required.');
    }
    const date = new Date(body.date);
    if (Number.isNaN(date.getTime())) {
        throw new Error('Invalid date: must be a valid date representation.');
    }

    // Validate and convert numerical metrics (food, water, activity, weight)
    const food = toNumber(body.food, 'food');
    const water = toNumber(body.water, 'water');
    const activity = toNumber(body.activity, 'activity');
    const weight = toNumber(body.weight, 'weight');

    // Validate symptoms
    let symptoms = [];
    if (body.symptoms !== undefined && body.symptoms !== null) {
        if (!Array.isArray(body.symptoms)) {
            throw new Error('Invalid symptoms: must be an array.');
        }
        symptoms = body.symptoms.map(s => {
            if (typeof s !== 'string') {
                throw new Error('Invalid symptom: each symptom must be a string.');
            }
            const lowerSymptom = s.toLowerCase();
            if (!SYMPTOMS.includes(lowerSymptom)) {
                throw new Error(`Invalid symptom: "${s}" is not in the allowed symptoms list.`);
            }
            return lowerSymptom;
        });

        // Remove duplicates
        symptoms = [...new Set(symptoms)];
    }

    // Return only the fields the user is allowed to set.
    // The route adds userId, predictedProbability, and needsAttention itself.
    return {
        petName,
        petSpecies,
        date,
        food,
        water,
        activity,
        weight,
        symptoms,
    };
}