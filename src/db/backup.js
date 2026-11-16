import { db, SCHEMA_VERSION, saveSettings } from './db.js';

const TABLES = [
  'foodItems',
  'meals',
  'weekPlans',
  'exercises',
  'routines',
  'settings',
  'logs'
];

export async function buildBackup() {
  const data = { schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString() };
  for (const t of TABLES) {
    data[t] = await db.table(t).toArray();
  }
  return data;
}

export async function exportBackup() {
  const data = await buildBackup();
  const json = JSON.stringify(data, null, 2);
  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `fit-track-backup-${stamp}.json`;
  const file = new File([json], fileName, { type: 'application/json' });

  // Web Share API first (lets her save to Files / iCloud Drive / AirDrop)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Fit Track backup' });
      await saveSettings({ lastBackupAt: new Date().toISOString() });
      return true;
    } catch (err) {
      if (err && err.name === 'AbortError') return false;
      // fall through to download
    }
  }

  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  await saveSettings({ lastBackupAt: new Date().toISOString() });
  return true;
}

export async function importBackup(file) {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not a Fit Track backup.');
  }
  if (!data.schemaVersion || !data.settings) {
    throw new Error('That file is not a Fit Track backup.');
  }
  if (data.schemaVersion > SCHEMA_VERSION) {
    throw new Error('This backup comes from a newer version of Fit Track. Update the app first.');
  }

  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) {
      await db.table(t).clear();
      if (Array.isArray(data[t]) && data[t].length) {
        await db.table(t).bulkPut(data[t]);
      }
    }
  });
  return data;
}
