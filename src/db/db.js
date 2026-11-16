import Dexie from 'dexie';

export const SCHEMA_VERSION = 1;

export const db = new Dexie('fit-track');

db.version(1).stores({
  foodItems: 'id, name',
  meals: 'id, name',
  weekPlans: 'id, name, isPreset',
  exercises: 'id, name',
  routines: 'id, name, isPreset',
  settings: 'id',
  logs: 'id, date, [date+type], type'
});

export function uid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export const DEFAULT_SETTINGS = {
  id: 1,
  userName: '',
  activeWeekPlanId: null,
  activeRoutineId: null,
  showNutrition: false,
  showWater: true,
  proteinGoal: 60,
  textSize: 'normal', // 'normal' | 'large' | 'extra'
  coinsSpent: 0,
  unlockedAccessories: ['bowtie'],
  equippedAccessory: 'bowtie',
  setupDone: false,
  lastBackupAt: null,
  installedAt: null
};

export async function getSettings() {
  const s = await db.settings.get(1);
  return { ...DEFAULT_SETTINGS, ...(s || {}) };
}

export async function saveSettings(patch) {
  const current = await getSettings();
  const next = { ...current, ...patch, id: 1 };
  await db.settings.put(next);
  return next;
}
