import 'dotenv/config';
import express from 'express';
import entriesRouter from './routes/entries.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/api/entries', entriesRouter);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`PawLog API listening on port ${PORT}`);
});
