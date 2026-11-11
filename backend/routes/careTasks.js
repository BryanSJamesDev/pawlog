import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { requireLogin } from '../auth/requireLogin.js';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  markDone,
} from '../db/careTasks.js';

const router = Router();
router.use(requireLogin);

const TYPES = ['med', 'vaccine', 'vet'];
const REPEATS = ['none', 'daily', 'weekly', 'monthly'];
const STATUSES = ['open', 'done', 'overdue', 'upcoming'];

function cleanTask(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return { error: 'Title is required' };

  if (!ObjectId.isValid(body.petId)) return { error: 'Valid petId is required' };

  if (!TYPES.includes(body.type)) {
    return { error: `Type must be one of: ${TYPES.join(', ')}` };
  }

  const repeat = body.repeat || 'none';
  if (!REPEATS.includes(repeat)) {
    return { error: `Repeat must be one of: ${REPEATS.join(', ')}` };
  }

  const dueDate = new Date(body.dueDate);
  if (!body.dueDate || Number.isNaN(dueDate.getTime())) {
    return { error: 'A valid due date is required' };
  }

  return {
    value: { petId: String(body.petId), type: body.type, title, repeat, dueDate },
  };
}

router.get('/', async (req, res) => {
  const { petId, status } = req.query;
  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const tasks = await listTasks(req.user._id.toString(), { petId, status });
  res.json(tasks);
});

router.get('/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const task = await getTask(req.user._id.toString(), req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.post('/', async (req, res) => {
  const { value, error } = cleanTask(req.body);
  if (error) return res.status(400).json({ error });
  const task = await createTask(req.user._id.toString(), value);
  res.status(201).json(task);
});

router.put('/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const { value, error } = cleanTask(req.body);
  if (error) return res.status(400).json({ error });
  const task = await updateTask(req.user._id.toString(), req.params.id, value);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.post('/:id/done', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const task = await markDone(req.user._id.toString(), req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.delete('/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const deleted = await deleteTask(req.user._id.toString(), req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Task not found' });
  res.status(204).end();
});

export default router;