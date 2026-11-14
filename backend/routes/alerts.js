import { Router } from 'express';
import { getDB } from '../db/connection.js';
import { requireLogin } from '../auth/requireLogin.js';
import { ObjectId } from 'mongodb';
import { loadModel, saveModel } from '../ml/modelStore.js';
import { trainFromEntries } from '../ml/trainModel.js';

// Entries at or above this probability show up as alerts
const ALERT_THRESHOLD = 0.5;

const router = Router();

// Every alerts route needs a logged-in user
router.use(requireLogin);

router.get('/', async (req, res) => {
    try {
        const db = await getDB();

        // Find this user's alerts, newest first
        const alerts = await db
            .collection('entries')
            .find({
                userId: req.user._id.toString(),
                predictedProbability: { $gte: ALERT_THRESHOLD },
            })
            .sort({ date: -1 })
            .toArray();

        // Load the model to retrieve accuracy and training statistics
        const model = await loadModel(db.collection('models'));

        res.json({
            alerts,
            accuracy: model?.accuracy ?? null,
            trainedOn: model?.trainedOn ?? null,
        });
    } catch (error) {
        console.error('Failed to load alerts', error);
        res.status(500).json({ error: 'Failed to load alerts' });
    }
});

router.post('/retrain', async (req, res) => {
    try {
        const db = await getDB();
        
        // Load every entry (all users plus seed data so everyone's feedback helps)
        const entries = await db.collection('entries').find({}).toArray();

        // Train on the entries
        const result = trainFromEntries(entries);

        // Save the retrained model and metadata
        await saveModel(db.collection('models'), result.model, {
            accuracy: result.accuracy,
            trainedOn: result.trainedOn,
        });

        // Send back accuracy and training count
        res.json({
            accuracy: result.accuracy,
            trainedOn: result.trainedOn,
        });
    } catch (error) {
        console.error('Failed to retrain the model', error);
        res.status(500).json({ error: 'Failed to retrain the model' });
    }
});

router.post('/:id/feedback', async (req, res) => {
    try {
        // Check if ID is valid
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid entry id' });
        }

        // Check that needsAttention is a boolean
        const { needsAttention } = req.body ?? {};
        if (typeof needsAttention !== 'boolean') {
            return res.status(400).json({ error: 'needsAttention must be true or false' });
        }

        // Save it to the database, ensuring ownership via userId
        const db = await getDB();
        const updated = await db.collection('entries').findOneAndUpdate(
            { _id: new ObjectId(req.params.id), userId: req.user._id.toString() },
            { $set: { needsAttention } },
            { returnDocument: 'after' }
        );

        // If entry doesn't exist or isn't owned by user
        if (!updated) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        // Return the updated entry document
        res.json(updated);
    } catch (error) {
        // Log error and return 500
        console.error('Failed to save feedback', error);
        res.status(500).json({ error: 'Failed to save feedback' });
    }
});

export default router;