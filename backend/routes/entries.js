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

// Make a router
const router = Router();

// Add test route with GET
router.get('/', async (req, res) => {
    try {
        // Temporary test until getDB() exists
        res.json({ message: 'entries route works' });

        /*
        // Get all health entries from the database
        const entries = await getDB()
            .collection('entries')
            .find()
            .toArray();

        // Return the entries
        res.json(entries);
        */
    } catch (error) {
        console.error('Failed to load health entries', error);
        res.status(500).json({ error: 'Failed to load health entries' });
    }
});

// Export router
export default router;