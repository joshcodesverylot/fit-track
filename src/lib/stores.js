import { writable, get } from 'svelte/store';
import { db, uid, getSettings, saveSettings, DEFAULT_SETTINGS } from '../db/db.js';
import { todayStr } from './dates.js';

// ---------- navigation ----------
// route: { name, params } — names: today, add, routine, food, progress,
// settings, quickadd, onboarding, editroutine, editweek
export const route = writable({ name: 'today', params: {} });

export function go(name, params = {}) {
  route.set({ name, params });
  window.scrollTo(0, 0);
}

// ---------- settings ----------
export const settings = writable({ ...DEFAULT_SETTINGS });

export async function loadSettings() {
  const s = await getSettings();
  settings.set(s);
  applyTextSize(s.textSize);
  return s;
}

export async function updateSettings(patch) {
  const s = await saveSettings(patch);
  settings.set(s);
  if (patch.textSize) applyTextSize(patch.textSize);
  return s;
}

export function applyTextSize(size) {
  const scale = size === 'large' ? 1.15 : size === 'extra' ? 1.3 : 1;
  document.documentElement.style.setProperty('--scale', String(scale));
}

// ---------- undo bar ----------
// { message, undoFn } or null
export const undo = writable(null);
let undoTimer = null;

export function showUndo(message, undoFn) {
  if (undoTimer) clearTimeout(undoTimer);
  undo.set({ message, undoFn });
  undoTimer = setTimeout(() => undo.set(null), 5000);
}

export async function runUndo() {
  const u = get(undo);
  if (undoTimer) clearTimeout(undoTimer);
  undo.set(null);
  if (u && u.undoFn) await u.undoFn();
  bumpLogs();
}

export function dismissUndo() {
  if (undoTimer) clearTimeout(undoTimer);
  undo.set(null);
}

// ---------- log change signal ----------
// Screens listen to this to re-read today's logs after any write.
export const logsVersion = writable(0);
export function bumpLogs() {
  logsVersion.update((n) => n + 1);
}

// ---------- log helpers ----------

export async function findLog(date, type, refId, slot) {
  let rows = await db.logs.where('date').equals(date).toArray();
  return rows.find(
    (r) =>
      r.type === type &&
      (refId === undefined || r.refId === refId) &&
      (slot === undefined || r.slot === slot)
  );
}

// Tick a planned meal (or untick it). Returns true if now ticked.
export async function toggleMealLog(mealId, slot, message) {
  const date = todayStr();
  const existing = await findLog(date, 'meal', mealId, slot);
  if (existing) {
    await db.logs.delete(existing.id);
    bumpLogs();
    showUndo('Unticked · Undo', async () => {
      await db.logs.put(existing);
    });
    return false;
  }
  const entry = { id: uid(), date, type: 'meal', refId: mealId, slot, done: true };
  await db.logs.put(entry);
  bumpLogs();
  showUndo(message || 'Meal ticked · +5 points · Undo', async () => {
    await db.logs.delete(entry.id);
  });
  return true;
}

export async function toggleExerciseLog(exerciseId) {
  const date = todayStr();
  const existing = await findLog(date, 'exercise', exerciseId);
  if (existing) {
    await db.logs.delete(existing.id);
    bumpLogs();
    showUndo('Unticked · Undo', async () => {
      await db.logs.put(existing);
    });
    return false;
  }
  const entry = { id: uid(), date, type: 'exercise', refId: exerciseId, done: true };
  await db.logs.put(entry);
  bumpLogs();
  showUndo('Well done · +10 points · Undo', async () => {
    await db.logs.delete(entry.id);
  });
  return true;
}

export async function logAllExercises(exerciseIds) {
  const date = todayStr();
  const added = [];
  for (const exId of exerciseIds) {
    const existing = await findLog(date, 'exercise', exId);
    if (!existing) {
      const entry = { id: uid(), date, type: 'exercise', refId: exId, done: true };
      await db.logs.put(entry);
      added.push(entry.id);
    }
  }
  bumpLogs();
  showUndo(`Wonderful — all done · +${added.length * 10} points · Undo`, async () => {
    await db.logs.bulkDelete(added);
  });
}

export async function addQuickLog({ name, calories, protein, carbs, fat, slot }) {
  const entry = {
    id: uid(),
    date: todayStr(),
    type: 'quick',
    slot,
    done: true,
    extra: { name: name || '', calories, protein, carbs, fat }
  };
  await db.logs.put(entry);
  bumpLogs();
  showUndo('Saved · +3 points · Undo', async () => {
    await db.logs.delete(entry.id);
  });
  return entry;
}

export async function addWaterLog() {
  const entry = { id: uid(), date: todayStr(), type: 'water', done: true };
  await db.logs.put(entry);
  bumpLogs();
  showUndo('Glass added · +1 point · Undo', async () => {
    await db.logs.delete(entry.id);
  });
}

// One weight entry per day; saving again replaces it.
export async function saveWeight(kg) {
  const date = todayStr();
  const rows = await db.logs.where('date').equals(date).toArray();
  const existing = rows.find((r) => r.type === 'weight');
  const entry = {
    id: existing ? existing.id : uid(),
    date,
    type: 'weight',
    done: true,
    extra: { kg }
  };
  await db.logs.put(entry);
  bumpLogs();
  showUndo('Weight saved · Undo', async () => {
    if (existing) await db.logs.put(existing);
    else await db.logs.delete(entry.id);
  });
}

export async function removeWaterLog() {
  const rows = await db.logs.where('date').equals(todayStr()).toArray();
  const waters = rows.filter((r) => r.type === 'water');
  if (!waters.length) return;
  const last = waters[waters.length - 1];
  await db.logs.delete(last.id);
  bumpLogs();
  showUndo('Glass removed · Undo', async () => {
    await db.logs.put(last);
  });
}
