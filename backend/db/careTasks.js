import { ObjectId } from 'mongodb';
import { getDB } from './connection.js';

async function collection() {
  const db = await getDB();
  return db.collection('careTasks');
}

function startOfToday() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function nextDueDate(dueDate, repeat) {
  const d = new Date(dueDate);
  if (repeat === 'daily') d.setUTCDate(d.getUTCDate() + 1);
  if (repeat === 'weekly') d.setUTCDate(d.getUTCDate() + 7);
  if (repeat === 'monthly') d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

export async function listTasks(userId, { petId, status } = {}) {
  const col = await collection();
  const query = { userId };
  if (petId) query.petId = petId;
  if (status === 'done') query.done = true;
  if (status === 'open') query.done = false;
  if (status === 'overdue') {
    query.done = false;
    query.dueDate = { $lt: startOfToday() };
  }
  if (status === 'upcoming') {
    query.done = false;
    query.dueDate = { $gte: startOfToday() };
  }
  return col.find(query).sort({ dueDate: 1 }).toArray();
}

export async function getTask(userId, id) {
  const col = await collection();
  return col.findOne({ _id: new ObjectId(id), userId });
}

export async function createTask(userId, data) {
  const col = await collection();
  const task = {
    ...data,
    userId,
    done: false,
    doneAt: null,
    createdAt: new Date(),
  };
  const result = await col.insertOne(task);
  return { ...task, _id: result.insertedId };
}

export async function updateTask(userId, id, data) {
  const col = await collection();
  return col.findOneAndUpdate(
    { _id: new ObjectId(id), userId },
    { $set: data },
    { returnDocument: 'after' },
  );
}

export async function deleteTask(userId, id) {
  const col = await collection();
  const result = await col.deleteOne({ _id: new ObjectId(id), userId });
  return result.deletedCount === 1;
}

export async function markDone(userId, id) {
  const col = await collection();
  const task = await col.findOne({ _id: new ObjectId(id), userId });
  if (!task) return null;
  if (task.done) return task;

  const updated = await col.findOneAndUpdate(
    { _id: new ObjectId(id), userId },
    { $set: { done: true, doneAt: new Date() } },
    { returnDocument: 'after' },
  );

  if (task.repeat && task.repeat !== 'none') {
    await col.insertOne({
      userId,
      petId: task.petId,
      type: task.type,
      title: task.title,
      repeat: task.repeat,
      dueDate: nextDueDate(task.dueDate, task.repeat),
      done: false,
      doneAt: null,
      createdAt: new Date(),
    });
  }
  return updated;
}