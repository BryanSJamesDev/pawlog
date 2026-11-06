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

// Import ObjectId from mongodb
import { ObjectId } from 'mongodb';

// Import getDB
import { getDB } from '../db/connection.js';

// Import validateEntry
import { validateEntry } from './validateEntry.js';

// Import requireLogin for users
import { requireLogin } from '../auth/requireLogin.js';

// Import scoreEntry
import { scoreEntry } from '../ml/scoreEntry.js';

// Make a router
const router = Router();

// Every entries route needs a logged-in user
router.use(requireLogin);

// Add test route with GET
router.get('/', async (req, res) => {
    try {
        // Get all health entries from the database
        const db = await getDB();
        const entries = await db
            .collection('entries')
            .find({ userId: req.user._id.toString() })
            .sort({ date: -1 })
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
        const db = await getDB();
        const userId = req.user._id.toString();

        // Score it with the model (null if there's no model yet)
        const predictedProbability = await scoreEntry({
            entries: db.collection('entries'),
            models: db.collection('models'),
            userId,
            entry: clean,
        });

        // Build the full entry with server-controlled fields
        const entry = {
            ...clean,
            userId,
            predictedProbability,
            needsAttention: null,
        };

        // Save entry into the database
        const result = await db.collection('entries').insertOne(entry);

        // Respond with 201 Created and the new entry including MongoDB's insertedId
        res.status(201).json({ ...entry, _id: result.insertedId });
    } catch (error) {
        console.error('Failed to create health entry', error);
        res.status(500).json({ error: 'Failed to create health entry' });
    }
});

// Add PUT route to update an existing health entry by ID
router.put('/:id', async (req, res) => {
    // Validate the MongoDB ObjectId parameter
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid entry id' });
    }

    // Validate input data using the same rules as POST
    let clean;
    try {
        clean = validateEntry(req.body);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }

    // Update the entry in the database
    try {
        const db = await getDB();
        const userId = req.user._id.toString();
        const entryId = new ObjectId(req.params.id);

        // Re-score with the edited values, not counting this entry as its own past
        const predictedProbability = await scoreEntry({
            entries: db.collection('entries'),
            models: db.collection('models'),
            userId,
            entry: clean,
            excludeId: entryId,
        });

        const updated = await db.collection('entries').findOneAndUpdate(
            { _id: entryId, userId },
            { $set: { ...clean, predictedProbability } },
            { returnDocument: 'after' }
        );

        // Handle case where entry doesn't exist or isn't owned by user
        if (!updated) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        // Send back the updated entry
        res.json(updated);
    } catch (error) {
        console.error('Failed to update health entry', error);
        res.status(500).json({ error: 'Failed to update health entry' });
    }
});

// Add DELETE route to remove an entry by ID
router.delete('/:id', async (req, res) => {
    // Validate the MongoDB ObjectId parameter
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid entry id' });
    }

    // Delete the entry from the database
    try {
        const db = await getDB();
        const result = await db.collection('entries').deleteOne({
            _id: new ObjectId(req.params.id),
            userId: req.user._id.toString()
        });

        // Check if the entry actually existed and belonged to the user
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        // Send success response
        res.json({ success: true, message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Failed to delete health entry', error);
        res.status(500).json({ error: 'Failed to delete health entry' });
    }
});

// Export router
export default router;