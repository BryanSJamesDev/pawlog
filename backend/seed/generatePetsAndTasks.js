// Names for synthetic pets
const PET_NAMES = [
  'Biscuit',
  'Maple',
  'Scout',
  'Olive',
  'Gus',
  'Mochi',
  'Pixel',
  'Juno',
  'Waffles',
  'Birdie',
  'Moose',
  'Clover',
  'Ziggy',
  'Poppy',
  'Fudge',
  'Basil',
  'Ginger',
  'Otis',
  'Sunny',
  'Pickles',
  'Marley',
  'Nugget',
  'Comet',
  'Tango',
  'Waffle',
  'Hudson',
  'Sage',
  'Beans',
  'Archie',
  'Peaches',
];

// Species list (repeats make dogs and cats more common)
const SPECIES_POOL = ['dog', 'dog', 'cat', 'cat', 'bird', 'rabbit', 'other'];

const BREEDS = {
  dog: ['Labrador', 'Beagle', 'Poodle', 'Bulldog', 'Husky', 'Terrier'],
  cat: ['Siamese', 'Tabby', 'Persian', 'Maine Coon', 'Bengal', 'Ragdoll'],
  bird: ['Parakeet', 'Cockatiel', 'Canary', 'Finch'],
  rabbit: ['Holland Lop', 'Mini Rex', 'Lionhead', 'Dutch'],
  other: ['Hamster', 'Guinea pig', 'Gecko', 'Turtle'],
};

// Weight range in pounds for each species
const WEIGHTS = {
  dog: { min: 10, max: 90 },
  cat: { min: 6, max: 16 },
  bird: { min: 0.1, max: 3 },
  rabbit: { min: 2, max: 10 },
  other: { min: 0.1, max: 8 },
};

const VET_NAMES = [
  'Fenway Animal Clinic',
  'Back Bay Pet Care',
  'Green Line Vets',
  'Charles River Animal Hospital',
  'Beacon Hill Veterinary',
  'Harbor Pet Wellness',
];

// Number of fake users the pets are spread across
const SEED_USER_COUNT = 10;

const TASK_TYPES = ['med', 'vaccine', 'vet'];

const TASK_TITLES = {
  med: [
    'Flea and tick medicine',
    'Heartworm pill',
    'Joint supplement',
    'Ear drops',
    'Allergy medicine',
  ],
  vaccine: [
    'Rabies booster',
    'Distemper booster',
    'Bordetella vaccine',
    'Annual vaccines',
  ],
  vet: ['Annual checkup', 'Dental cleaning', 'Weight check', 'Follow-up visit'],
};

// Medications usually repeat, vaccines and vet visits usually do not
const TASK_REPEATS = {
  med: ['daily', 'weekly', 'monthly', 'monthly'],
  vaccine: ['none', 'none', 'none', 'monthly'],
  vet: ['none', 'none', 'none', 'none'],
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns a random number between a minimum and maximum value.
 *
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {Function} random - Random number generator
 * @returns {number} Random number between min and max
 */
export function randomBetween(min, max, random = Math.random) {
  return min + random() * (max - min);
}

/**
 * Picks one item from a list.
 *
 * @param {Array} list - Items to pick from
 * @param {Function} random - Random number generator
 * @returns {*} One item from the list
 */
export function pick(list, random = Math.random) {
  return list[Math.floor(random() * list.length)];
}

/**
 * Creates one fake pet.
 *
 * @param {number} index - Pet's position in the generated list
 * @param {Function} random - Random number generator
 * @returns {Object} Fake pet ready to insert
 * @throws {TypeError} If index is not a whole number 0 or higher
 */
export function makePet(index, random = Math.random) {
  if (!Number.isInteger(index) || index < 0) {
    throw new TypeError('Index must be a non-negative integer');
  }

  let name = PET_NAMES[index % PET_NAMES.length];
  if (index >= PET_NAMES.length) {
    name += ` ${Math.floor(index / PET_NAMES.length) + 1}`;
  }

  const species = pick(SPECIES_POOL, random);
  const range = WEIGHTS[species];
  const now = new Date();

  // Born between one month and fifteen years ago
  const ageDays = randomBetween(30, 15 * 365, random);
  const phoneEnd = String(Math.floor(random() * 10000)).padStart(4, '0');

  return {
    userId: `seed-user-${(index % SEED_USER_COUNT) + 1}`,
    name,
    species,
    breed: pick(BREEDS[species], random),
    birthDate: new Date(now.getTime() - ageDays * DAY_MS),
    weight: Math.round(randomBetween(range.min, range.max, random) * 10) / 10,
    vetName: pick(VET_NAMES, random),
    vetPhone: `(617) 555-${phoneEnd}`,
    createdAt: now,
  };
}

/**
 * Creates one fake care task for a pet that is already saved.
 *
 * @param {Object} pet - Saved pet with an _id and userId
 * @param {Function} random - Random number generator
 * @returns {Object} Fake care task ready to insert
 * @throws {TypeError} If the pet has no _id or userId
 */
export function makeTask(pet, random = Math.random) {
  if (!pet?._id || typeof pet.userId !== 'string') {
    throw new TypeError('Pet must have an _id and a userId');
  }

  const type = pick(TASK_TYPES, random);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  // Due anywhere from 45 days ago to 90 days from now
  const offset = Math.floor(randomBetween(-45, 90, random));
  const dueDate = new Date(today + offset * DAY_MS);

  // Most past tasks were done, some were missed (these show as overdue)
  const done = offset < 0 && random() < 0.75;

  return {
    userId: pet.userId,
    petId: String(pet._id),
    type,
    title: pick(TASK_TITLES[type], random),
    dueDate,
    repeat: pick(TASK_REPEATS[type], random),
    done,
    doneAt: done ? dueDate : null,
    createdAt: now,
  };
}

/**
 * Generates fake pets.
 *
 * @param {number} count - How many pets to make
 * @param {Function} random - Random number generator
 * @returns {Array<Object>} Fake pets
 * @throws {TypeError} If count is not a whole number greater than 0
 */
export function generatePets(count = 200, random = Math.random) {
  if (!Number.isInteger(count) || count <= 0) {
    throw new TypeError('count must be a whole number greater than 0.');
  }

  const pets = [];
  for (let i = 0; i < count; i++) {
    pets.push(makePet(i, random));
  }
  return pets;
}

/**
 * Generates fake care tasks for pets that are already saved.
 *
 * @param {Array<Object>} pets - Saved pets (each needs an _id and userId)
 * @param {number} perPet - How many tasks to make for each pet
 * @param {Function} random - Random number generator
 * @returns {Array<Object>} Fake care tasks
 * @throws {TypeError} If pets is not an array or perPet is not valid
 */
export function generateTasks(pets, perPet = 6, random = Math.random) {
  if (!Array.isArray(pets)) {
    throw new TypeError('pets must be an array.');
  }
  if (!Number.isInteger(perPet) || perPet <= 0) {
    throw new TypeError('perPet must be a whole number greater than 0.');
  }

  const tasks = [];
  for (const pet of pets) {
    for (let i = 0; i < perPet; i++) {
      tasks.push(makeTask(pet, random));
    }
  }
  return tasks;
}
