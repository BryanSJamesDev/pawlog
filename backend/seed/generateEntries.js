import { SYMPTOMS } from '../ml/features.js';

// Names for synthetic pets
const PET_NAMES = [
    'Luna', 'Max', 'Bella', 'Charlie', 'Milo', 'Lucy', 'Cooper', 'Daisy',
    'Oliver', 'Nala', 'Rocky', 'Chloe', 'Bear', 'Zoe', 'Leo', 'Penny',
    'Toby', 'Lily', 'Finn', 'Rosie', 'Jack', 'Ruby', 'Ollie', 'Pepper',
    'Teddy', 'Willow', 'Winston', 'Hazel', 'Simba', 'Stella',
];

// Normal ranges for each species (food/water in cups, activity in minutes, weight in pounds)
const SPECIES_PROFILES = {
    dog: {
        food: { min: 2, max: 4 },
        water: { min: 3, max: 6 },
        activity: { min: 30, max: 90 },
        weight: { min: 20, max: 80 },
    },
    cat: {
        food: { min: 0.5, max: 1 },
        water: { min: 0.5, max: 1.5 },
        activity: { min: 10, max: 40 },
        weight: { min: 7, max: 15 },
    },
};

// Number of fake users the pets are spread across
const SEED_USER_COUNT = 10;

// How much each value can wiggle on a normal day (90% to 110% of normal)
const NORMAL_CHANGE = { min: 0.9, max: 1.1 };

// How much each value changes on a sick day (fraction of normal)
const SICK_CHANGES = {
    food: { min: 0.3, max: 0.7 },
    water: { min: 0.6, max: 1.3 },
    activity: { min: 0.3, max: 0.6 },
    weight: { min: 0.97, max: 1.0 },
};

// Chance that a healthy day still has one random symptom
const HEALTHY_SYMPTOM_CHANCE = 0.05;

/**
 * Returns a random number between a minimum and maximum value.
 *
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {Function} random - Random number generator
 * @returns {number} Random number between min and max
 * @throws {TypeError} If min or max is not a finite number
 * @throws {Error} If min is greater than max
 */
export function randomBetween(min, max, random = Math.random) {
    // Check that min and max are finite numbers
    if (typeof min !== 'number' || !Number.isFinite(min) ||
        typeof max !== 'number' || !Number.isFinite(max)) {
        throw new TypeError('Min and max must be finite numbers');
    }

    // Check that the minimum is not greater than the maximum
    if (min > max) {
        throw new Error('Min cannot be greater than max');
    }

    // Return a random number within the range
    return min + random() * (max - min);
}

/**
 * Creates a fake pet with its own normal daily values.
 *
 * @param {number} index - Pet's position in the generated list
 * @param {Function} random - Random number generator
 * @returns {Object} Fake pet with its name, species, user ID, and normal values
 * @throws {TypeError} If index is not a whole number 0 or higher
 */
export function makePet(index, random = Math.random) {
    // Check that index is a non-negative whole number
    if (!Number.isInteger(index) || index < 0) {
        throw new TypeError('Index must be a non-negative integer');
    }

    // Pick a name from the list
    let petName = PET_NAMES[index % PET_NAMES.length];

    // Add a number when the name list runs out
    if (index >= PET_NAMES.length) {
        petName += ` ${Math.floor(index / PET_NAMES.length) + 1}`;
    }

    // Randomly choose the pet's species
    const petSpecies = random() < 0.5 ? 'dog' : 'cat';

    // Assign the pet to a seed user
    const userId = `seed-user-${(index % SEED_USER_COUNT) + 1}`;

    // Get the normal ranges for this pet's species
    const profile = SPECIES_PROFILES[petSpecies];

    // Generate the pet's usual values
    const normal = {};

    for (const field of Object.keys(profile)) {
        normal[field] = randomBetween(
            profile[field].min,
            profile[field].max,
            random
        );
    }

    return { petName, petSpecies, userId, normal };
}

/**
 * Creates one day’s entry for one pet.
 * 
 * @param {Object} pet - Pet object containing normal metrics, name, species, and userId.
 * @param {Date} date - Date instance for the entry.
 * @param {boolean} isSick - Boolean indicating if it's a sick day.
 * @param {Function} [random=Math.random] - Random number generator function.
 * @returns {Object} The generated day entry.
 */
export function makeDay(pet, date, isSick, random = Math.random) {
    // Validation checks
    if (!pet || typeof pet !== 'object' || !pet.normal || typeof pet.normal !== 'object') {
        throw new TypeError('Invalid pet object: must contain a "normal" object.');
    }

    const fields = ['food', 'water', 'activity', 'weight'];
    for (const field of fields) {
        if (typeof pet.normal[field] !== 'number' || !Number.isFinite(pet.normal[field])) {
            throw new TypeError(`Invalid or non-finite number for pet.normal.${field}`);
        }
    }

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        throw new TypeError('Invalid date: must be a valid Date instance.');
    }

    if (typeof isSick !== 'boolean') {
        throw new TypeError('Invalid isSick: must be a boolean.');
    }

    // Find values based on normal/sick ranges
    const entryValues = {};
    for (const field of fields) {
        const range = isSick ? SICK_CHANGES[field] : NORMAL_CHANGE;
        const rawValue = pet.normal[field] * randomBetween(range.min, range.max, random);

        if (field === 'activity') {
            entryValues[field] = Math.round(rawValue);
        } else {
            // food, water, weight rounded to 2 decimal places
            entryValues[field] = Math.round(rawValue * 100) / 100;
        }
    }

    // Determine symptoms without an unsafe loop
    let symptomCount = 0;
    if (isSick) {
        symptomCount = random() < 0.5 ? 1 : 2;
    } else {
        symptomCount = random() < HEALTHY_SYMPTOM_CHANCE ? 1 : 0;
    }

    const symptoms = [];
    if (symptomCount > 0 && SYMPTOMS && SYMPTOMS.length > 0) {
        const start = Math.floor(random() * SYMPTOMS.length);
        symptoms.push(SYMPTOMS[start]);

        if (symptomCount > 1) {
            const nextIndex = (start + 1) % SYMPTOMS.length;
            symptoms.push(SYMPTOMS[nextIndex]);
        }
    }

    // Return the constructed day entry object
    return {
        petName: pet.petName,
        petSpecies: pet.petSpecies,
        userId: pet.userId,
        date,
        food: entryValues.food,
        water: entryValues.water,
        activity: entryValues.activity,
        weight: entryValues.weight,
        symptoms,
        predictedProbability: null,
        needsAttention: isSick
    };
}

/**
 * Generates synthetic entries for multiple pets over a given number of days.
 * 
 * @param {Object} [options={}] - Configuration options for entry generation.
 * @param {number} [options.petCount=50] - Number of pets to generate.
 * @param {number} [options.days=30] - Number of days of history per pet.
 * @param {Date} [options.endDate=new Date()] - The end date for the entries.
 * @param {number} [options.sickChance=0.08] - Probability of a sick spell starting on a healthy day.
 * @param {number} [options.labelNoise=0.05] - Probability that the needsAttention label is flipped.
 * @param {Function} [options.random=Math.random] - Random number generator function.
 * @returns {Array<Object>} An array of all generated daily pet entries.
 * @throws {TypeError} If any option fails validation.
 */
export function generateEntries(options = {}) {
    const {
        petCount = 50,
        days = 30,
        endDate = new Date(),
        sickChance = 0.08,
        labelNoise = 0.05,
        random = Math.random,
    } = options;

    // 1. Validation checks
    if (!Number.isInteger(petCount) || petCount <= 0) {
        throw new TypeError('petCount must be a whole number greater than 0.');
    }

    if (!Number.isInteger(days) || days <= 0) {
        throw new TypeError('days must be a whole number greater than 0.');
    }

    if (!(endDate instanceof Date) || Number.isNaN(endDate.getTime())) {
        throw new TypeError('endDate must be a valid Date instance.');
    }

    if (typeof sickChance !== 'number' || !Number.isFinite(sickChance) || sickChance < 0 || sickChance > 1) {
        throw new TypeError('sickChance must be a finite number between 0 and 1.');
    }

    if (typeof labelNoise !== 'number' || !Number.isFinite(labelNoise) || labelNoise < 0 || labelNoise > 1) {
        throw new TypeError('labelNoise must be a finite number between 0 and 1.');
    }

    if (typeof random !== 'function') {
        throw new TypeError('random must be a function.');
    }

    // 2. Generate entries across pets and days
    const entries = [];

    for (let p = 0; p < petCount; p++) {
        const pet = makePet(p, random);
        let sickDaysLeft = 0;

        // Loop from oldest day to newest day (days - 1 down to 0)
        for (let d = days - 1; d >= 0; d--) {
            // Copy endDate first to avoid mutating the original
            const date = new Date(endDate.getTime());
            date.setDate(date.getDate() - d);

            // Check if a new sick spell should start
            if (sickDaysLeft === 0 && random() < sickChance) {
                sickDaysLeft = 1 + Math.floor(random() * 4); // Lasts 1 to 4 days
            }

            const isSick = sickDaysLeft > 0;
            if (isSick) {
                sickDaysLeft--;
            }

            // Create the entry for this specific day
            const day = makeDay(pet, date, isSick, random);

            // Apply label noise (5% chance to flip needsAttention)
            if (random() < labelNoise) {
                day.needsAttention = !day.needsAttention;
            }

            entries.push(day);
        }
    }

    return entries;
}