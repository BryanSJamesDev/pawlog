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