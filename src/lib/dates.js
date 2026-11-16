export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_NAMES = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday'
};
export const SLOT_KEYS = ['breakfast', 'lunch', 'dinner', 'snack'];
export const SLOT_NAMES = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack'
};

export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dayKey(d = new Date()) {
  return DAY_KEYS[(d.getDay() + 6) % 7]; // JS: 0 = Sunday
}

export function friendlyDate(d = new Date()) {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

export function greeting(name) {
  const h = new Date().getHours();
  let part = 'Hello';
  if (h < 12) part = 'Good morning';
  else if (h < 17) part = 'Good afternoon';
  else part = 'Good evening';
  return name ? `${part}, ${name}` : part;
}

// Dates (YYYY-MM-DD) for Monday..Sunday of the current week.
export function weekDates(d = new Date()) {
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return DAY_KEYS.map((_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return todayStr(day);
  });
}

export function slotFromTime(d = new Date()) {
  const h = d.getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 16) return 'snack';
  if (h < 20) return 'dinner';
  return 'snack';
}
