// "Share my day" — renders a summary card of today (with Tux) to a PNG and
// hands it to the system share sheet (or downloads it as a fallback).
import { db } from '../db/db.js';
import { todayStr, dayKey, friendlyDate, SLOT_KEYS } from './dates.js';
import { tuxInner } from './tuxSvg.js';
import { computeDayPoints, proteinByDate } from './points.js';

export async function gatherDay(settings) {
  const date = todayStr();
  const logs = await db.logs.where('date').equals(date).toArray();

  let mealsPlanned = 0;
  const plan = settings.activeWeekPlanId
    ? await db.weekPlans.get(settings.activeWeekPlanId)
    : null;
  if (plan) {
    const day = plan.days[dayKey()] || {};
    mealsPlanned = SLOT_KEYS.reduce((a, s) => a + (day[s]?.length || 0), 0);
  }

  const mealsDone = logs.filter((l) => l.type === 'meal').length;
  const quickCount = logs.filter((l) => l.type === 'quick').length;
  const exercises = logs.filter((l) => l.type === 'exercise').length;
  const water = logs.filter((l) => l.type === 'water').length;
  const weightLog = logs.find((l) => l.type === 'weight');
  const protein = (await proteinByDate(logs)).get(date) || 0;
  const points = await computeDayPoints(date, settings.proteinGoal || 0);

  return { mealsPlanned, mealsDone, quickCount, exercises, water, protein, points, weight: weightLog?.extra?.kg };
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tickLine(y, text) {
  return `
    <circle cx="150" cy="${y - 13}" r="21" fill="#d4a017" />
    <path d="M140 ${y - 13} l7 8 l15 -16" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
    <text x="192" y="${y}" font-size="38" fill="#221c0e">${esc(text)}</text>`;
}

export function buildCardSvg(settings, d) {
  const name = (settings.userName || '').trim();
  const title = name ? `${name}'s day` : 'My day';
  const goal = settings.proteinGoal || 0;

  const lines = [];
  if (d.mealsPlanned) lines.push(`${d.mealsDone} of ${d.mealsPlanned} planned meals ticked`);
  else if (d.mealsDone) lines.push(`${d.mealsDone} meals ticked`);
  if (d.quickCount) lines.push(`${d.quickCount} other ${d.quickCount === 1 ? 'food' : 'foods'} logged`);
  if (d.exercises) lines.push(`${d.exercises} ${d.exercises === 1 ? 'exercise' : 'exercises'} done`);
  if (d.water) lines.push(`${d.water} ${d.water === 1 ? 'glass' : 'glasses'} of water`);
  if (d.protein) {
    lines.push(
      goal && d.protein >= goal
        ? `${d.protein} g protein — goal reached!`
        : `${d.protein} g protein${goal ? ` of ${goal} g goal` : ''}`
    );
  }
  if (d.weight) lines.push(`Weight: ${d.weight} kg`);

  let y = 624;
  const lineSvg = lines.map((t) => { const s = tickLine(y, t); y += 54; return s; }).join('');
  const pointsY = y + 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <rect width="1080" height="1080" fill="#fdfbf4" />
  <rect x="24" y="24" width="1032" height="1032" rx="48" fill="none" stroke="#d4a017" stroke-width="10" />
  <text x="540" y="104" text-anchor="middle" font-size="46" font-weight="700" fill="#8e6508" font-family="Segoe UI, Arial, sans-serif">Fit Track</text>
  <g transform="translate(392, 128) scale(1.48)" font-family="Segoe UI, Arial, sans-serif">${tuxInner(settings.equippedAccessory || 'bowtie', 'happy')}</g>
  <g font-family="Segoe UI, Arial, sans-serif">
    <text x="540" y="516" text-anchor="middle" font-size="62" font-weight="700" fill="#221c0e">${esc(title)}</text>
    <text x="540" y="566" text-anchor="middle" font-size="38" fill="#5a523d">${esc(friendlyDate())}</text>
    ${lineSvg}
    <rect x="300" y="${pointsY - 44}" width="480" height="72" rx="36" fill="#d4a017" />
    <text x="540" y="${pointsY + 4}" text-anchor="middle" font-size="38" font-weight="700" fill="#fff">+${d.points} Paw Points today</text>
    <text x="540" y="1038" text-anchor="middle" font-size="26" fill="#5a523d">Tux is proud. Shared from Fit Track.</text>
  </g>
</svg>`;
}

async function svgToPngBlob(svg) {
  const img = new Image();
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  canvas.getContext('2d').drawImage(img, 0, 0, 1080, 1080);
  return new Promise((res) => canvas.toBlob(res, 'image/png'));
}

// Returns 'shared', 'downloaded' or 'cancelled'.
export async function shareDay(settings) {
  const d = await gatherDay(settings);
  const svg = buildCardSvg(settings, d);
  const blob = await svgToPngBlob(svg);
  const file = new File([blob], `fit-track-${todayStr()}.png`, { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'My Fit Track day' });
      return 'shared';
    } catch (err) {
      if (err && err.name === 'AbortError') return 'cancelled';
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
