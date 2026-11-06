import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { generateEntries } from './generateEntries.js';

/**
 * Seeds the database collection with new entries, ensuring safe handling 
 * of seed data via 'seed-user-' prefix checks.
 * 
 * @param {Object} collection - MongoDB collection mock or instance
 * @param {Array} entries - Array of entry objects to insert
 * @returns {Promise<{deleted: number, inserted: number}>}
 */
export async function seedEntries(collection, entries) {
  // Check collection methods
  if (
    typeof collection?.deleteMany !== 'function' ||
    typeof collection?.insertMany !== 'function'
  ) {
    throw new TypeError('Collection must have deleteMany and insertMany functions.');
  }

  // Check entries array and non-emptiness
  if (!Array.isArray(entries)) {
    throw new TypeError('Entries must be an array.');
  }
  if (entries.length === 0) {
    throw new Error('Entries array cannot be empty.');
  }

  // Validate every entry's userId starts with 'seed-user-'
  for (const entry of entries) {
    if (typeof entry?.userId !== 'string' || !entry.userId.startsWith('seed-user-')) {
      throw new Error("Every entry's userId must be a string starting with 'seed-user-'.");
    }
  }

  // Delete old seed data (safely targeted by regex)
  const deleted = await collection.deleteMany({ userId: { $regex: '^seed-user-' } });

  // Insert new data
  const inserted = await collection.insertMany(entries);

  // Return deletion and insertion counts
  return {
    deleted: deleted.deletedCount,
    inserted: inserted.insertedCount
  };
}

/**
 * Generates fresh seed entries and saves them to the database.
 */
async function main() {
    try {
        // Loaded here, not at the top, so tests can import this file without the database
        const { getDB } = await import('../db/connection.js');
        const db = await getDB();
        const result = await seedEntries(db.collection('entries'), generateEntries());
        console.log(`Removed ${result.deleted} old seed entries, added ${result.inserted} new ones.`);
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

// Only run when called directly (npm run seed), not when a test imports this file
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}