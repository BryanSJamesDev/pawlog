import { Router } from 'express';
import bcrypt from 'bcrypt';
import { getDB } from '../db/connection.js';
import { validateCredentials } from '../auth/validateCredentials.js';

const router = Router();

// Register a new user
router.post('/register', async (req, res) => {
    const { username, password } = req.body ?? {};

    // Validate credentials
    let creds;
    try {
        creds = validateCredentials(username, password);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }

    try {
        const db = await getDB();
        const usersCollection = db.collection('users');

        // Check if username is already taken
        const existingUser = await usersCollection.findOne({ username: creds.username });
        if (existingUser) {
            return res.status(409).json({ error: 'Username is already taken' });
        }

        // Hash the password with cost factor 12
        const passwordHash = await bcrypt.hash(creds.password, 12);
        const createdAt = new Date();

        // Save the new user into the database
        const result = await usersCollection.insertOne({
            username: creds.username,
            passwordHash,
            createdAt,
        });

        // Build the safe user object to return (excluding passwordHash)
        const safeUser = {
            _id: result.insertedId,
            username: creds.username,
            createdAt,
        };

        // Log the user in immediately using Passport's req.login
        req.login(safeUser, (error) => {
            if (error) {
                console.error('Failed to log in new user', error);
                return res.status(500).json({ error: 'Account created, but login failed' });
            }
            res.status(201).json(safeUser);
        });
    } catch (error) {
        console.error('Failed to register user', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

export default router;