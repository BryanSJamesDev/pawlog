import { Router } from 'express';
import { getDB } from '../db/connection.js';
import { requireLogin } from '../auth/requireLogin.js';
import { loadModel } from '../ml/modelStore.js';

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

export default router;