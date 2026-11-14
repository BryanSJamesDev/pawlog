import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { getDB } from './db/connection.js';
import { configurePassport } from './auth/passport.js';
import authRouter from './routes/auth.js';
import entriesRouter from './routes/entries.js';
import alertsRouter from './routes/alerts.js';
import petsRouter from './routes/pets.js';
import careTasksRouter from './routes/careTasks.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Stop right away if the session secret is missing
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is missing from .env');
}

// Needed for secure cookies when deployed behind a host like Render
app.set('trust proxy', 1);

// Login sessions (cookie-based)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);
app.use(express.json());

// Passport login
configurePassport(passport, getDB);
app.use(passport.initialize());
app.use(passport.session());

// Routes (after Passport, so req.user is available)
app.use('/api/auth', authRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/pets', petsRouter);
app.use('/api/care-tasks', careTasksRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Unknown API paths get a JSON 404 instead of the React page
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Serve the built React app (created by `npm run build` in the frontend folder)
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(currentDir, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PawLog API listening on port ${PORT}`);
});
