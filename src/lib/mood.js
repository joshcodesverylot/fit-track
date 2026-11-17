// Tux's mood follows the day's progress: neutral to start, pleased once
// half the day's ticks are done, happy when everything is.
import { db, getSettings } from '../db/db.js';
import { todayStr, dayKey, SLOT_KEYS } from './dates.js';

export function moodForProgress(p) {
  if (p >= 1) return 'happy';
  if (p >= 0.5) return 'pleased';
  return 'normal';
}

// Fraction of today's planned meals + routine exercises that are ticked.
export async function computeDayProgress(settings) {
  const s = settings || (await getSettings());
  const logs = await db.logs.where('date').equals(todayStr()).toArray();
  let planned = 0;
  let done = 0;

  const plan = s.activeWeekPlanId ? await db.weekPlans.get(s.activeWeekPlanId) : null;
  if (plan) {
    const day = plan.days[dayKey()] || {};
    for (const slot of SLOT_KEYS) {
      for (const mealId of day[slot] || []) {
        planned++;
        if (logs.some((l) => l.type === 'meal' && l.refId === mealId && l.slot === slot)) done++;
      }
    }
  }

  const routine = s.activeRoutineId ? await db.routines.get(s.activeRoutineId) : null;
  if (routine) {
    for (const exId of routine.exerciseIds) {
      planned++;
      if (logs.some((l) => l.type === 'exercise' && l.refId === exId)) done++;
    }
  }

  return planned ? done / planned : 0;
}
