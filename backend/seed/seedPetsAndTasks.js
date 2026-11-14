import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { generatePets, generateTasks } from './generatePetsAndTasks.js';

/**
 * Replaces the old seed pets and care tasks with fresh ones. Only data
 * whose userId starts with 'seed-user-' is ever deleted, so real accounts
 * are never touched.
 *
 * @param {Object} petsCollection - MongoDB pets collection
 * @param {Object} tasksCollection - MongoDB careTasks collection
 * @returns {Promise<Object>} How many were deleted and inserted
 */
export async function seedPetsAndTasks(petsCollection, tasksCollection) {
  const seedFilter = { userId: { $regex: '^seed-user-' } };

  const deletedPets = await petsCollection.deleteMany(seedFilter);
  const deletedTasks = await tasksCollection.deleteMany(seedFilter);

  // insertMany adds an _id to each pet, which the tasks need
  const pets = generatePets();
  const insertedPets = await petsCollection.insertMany(pets);

  const tasks = generateTasks(pets);
  const insertedTasks = await tasksCollection.insertMany(tasks);

  return {
    deletedPets: deletedPets.deletedCount,
    deletedTasks: deletedTasks.deletedCount,
    insertedPets: insertedPets.insertedCount,
    insertedTasks: insertedTasks.insertedCount,
  };
}

/**
 * Connects to the database and seeds pets and care tasks.
 */
async function main() {
  try {
    // Loaded here, not at the top, so tests can import this file without the database
    const { getDB } = await import('../db/connection.js');
    const db = await getDB();
    const result = await seedPetsAndTasks(
      db.collection('pets'),
      db.collection('careTasks'),
    );
    console.log(
      `Removed ${result.deletedPets} old seed pets and ${result.deletedTasks} old seed tasks, ` +
        `added ${result.insertedPets} pets and ${result.insertedTasks} care tasks.`,
    );
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Only run when called directly, not when a test imports this file
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
