// Paw Points — the in-app reward currency. Points are *derived* from the
// log table (so Undo automatically takes them back), minus what has been
// spent on outfits for Tux.
import { db } from '../db/db.js';

export const POINTS = {
  meal: 5,
  quick: 3,
  exercise: 10,
  water: 1,
  comboBonus: 15, // a day with at least one meal AND one exercise
  proteinGoal: 20 // a day that reaches the protein goal
};

// Tux's wardrobe. 'bowtie' is his own tuxedo bow tie — free.
export const SHOP = [
  { id: 'bowtie', name: 'Bow tie', price: 0, blurb: 'His very own tuxedo bow tie.' },
  { id: 'scarf', name: 'Cosy scarf', price: 60, blurb: 'For brisk morning walks.' },
  { id: 'tophat', name: 'Top hat', price: 150, blurb: 'A proper gentleman.' },
  { id: 'monocle', name: 'Monocle', price: 220, blurb: 'Inspecting your meal plan closely.' },
  { id: 'chefhat', name: 'Chef hat', price: 320, blurb: 'He approves of your cooking.' },
  { id: 'crown', name: 'Golden crown', price: 500, blurb: 'King of the routine.' }
];

// Protein eaten per date, from ticked meals and quick-added food.
export async function proteinByDate(logs) {
  const meals = new Map((await db.meals.toArray()).map((m) => [m.id, m]));
  const items = new Map((await db.foodItems.toArray()).map((i) => [i.id, i]));
  const map = new Map();
  for (const l of logs) {
    let p = 0;
    if (l.type === 'meal' && l.refId) {
      const m = meals.get(l.refId);
      if (m) for (const id of m.itemIds || []) p += items.get(id)?.protein || 0;
    } else if (l.type === 'quick') {
      p = l.extra?.protein || 0;
    }
    if (p) map.set(l.date, (map.get(l.date) || 0) + p);
  }
  return map;
}

function basePoints(logs) {
  let earned = 0;
  const byDate = new Map();
  for (const l of logs) {
    if (l.type === 'meal') earned += POINTS.meal;
    else if (l.type === 'quick') earned += POINTS.quick;
    else if (l.type === 'exercise') earned += POINTS.exercise;
    else if (l.type === 'water') earned += POINTS.water;
    const d = byDate.get(l.date) || { food: false, move: false };
    if (l.type === 'meal' || l.type === 'quick') d.food = true;
    if (l.type === 'exercise') d.move = true;
    byDate.set(l.date, d);
  }
  for (const d of byDate.values()) {
    if (d.food && d.move) earned += POINTS.comboBonus;
  }
  return earned;
}

export async function computeEarned(proteinGoal = 0) {
  const logs = await db.logs.toArray();
  let earned = basePoints(logs);
  if (proteinGoal > 0) {
    const protein = await proteinByDate(logs);
    for (const grams of protein.values()) {
      if (grams >= proteinGoal) earned += POINTS.proteinGoal;
    }
  }
  return earned;
}

// Points earned on one specific day (for the share card).
export async function computeDayPoints(date, proteinGoal = 0) {
  const logs = await db.logs.where('date').equals(date).toArray();
  let earned = basePoints(logs);
  if (proteinGoal > 0) {
    const protein = await proteinByDate(logs);
    if ((protein.get(date) || 0) >= proteinGoal) earned += POINTS.proteinGoal;
  }
  return earned;
}

export async function computeBalance(settings) {
  const earned = await computeEarned(settings.proteinGoal || 0);
  return { earned, spent: settings.coinsSpent || 0, balance: earned - (settings.coinsSpent || 0) };
}
