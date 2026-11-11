import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { getDB } from './db/connection.js';
import { configurePassport } from './auth/passport.js';
import authRouter from './routes/auth.js';
import entriesRouter from './routes/entries.js';
import petsRouter from './routes/pets.js';

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
app.use('/api/pets', petsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`PawLog API listening on port ${PORT}`);
});
