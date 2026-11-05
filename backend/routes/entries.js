/* {
    petName: String,
    petSpecies: String,
    userId: String,
    date: Date,

    food: Number,       // cups
    water: Number,      // cups
    activity: Number,   // minutes
    weight: Number,     // pounds

    symptoms: [String], // lowercase, selected from fixed checkbox list

    predictedProbability: Number,
    needsAttention: Boolean // true, false, or null
}*/

// Import Router
import { Router } from 'express';

// Import getDB
import { getDB } from '../db/connection.js';

// Import validateEntry and setup temporary user ID placeholder
import { validateEntry } from './validateEntry.js';
const TEMP_USER_ID = 'test-user';

// Make a router
const router = Router();

// Add test route with GET
router.get('/', async (req, res) => {
    try {
        // Get all health entries from the database
        const db = await getDB();
        const entries = await db
            .collection('entries')
            .find()
            .toArray();

        // Return the entries
        res.json(entries);
    } catch (error) {
        console.error('Failed to load health entries', error);
        res.status(500).json({ error: 'Failed to load health entries' });
    }
});

// Add POST route to create a new health entry
router.post('/', async (req, res) => {
    let clean;
    try {
        // Validate and sanitize input data
        clean = validateEntry(req.body);
    } catch (error) {
        // Return 400 for bad user input
        return res.status(400).json({ error: error.message });
    }

    try {
        // Build the full entry with server-controlled fields
        const entry = {
            ...clean,
            userId: TEMP_USER_ID,
            predictedProbability: null,
            needsAttention: null,
        };

        // Save entry into the database
        const db = await getDB();
        const result = await db.collection('entries').insertOne(entry);

        // Respond with 201 Created and the new entry including MongoDB's insertedId
        res.status(201).json({ ...entry, _id: result.insertedId });
    } catch (error) {
        console.error('Failed to create health entry', error);
        res.status(500).json({ error: 'Failed to create health entry' });
    }
});

// Export router
export default router;