<script>
  import { db } from '../db/db.js';
  import { settings, logsVersion, go, showUndo, bumpLogs } from '../lib/stores.js';
  import {
    weekDates,
    todayStr,
    DAY_KEYS,
    DAY_NAMES,
    SLOT_KEYS,
    dayKey
  } from '../lib/dates.js';
  import { exportBackup, importBackup } from '../db/backup.js';
  import { loadSettings } from '../lib/stores.js';
  import { computeBalance } from '../lib/points.js';
  import TuxCat from '../components/TuxCat.svelte';

  let days = []; // { key, label, date, isToday, mealsDone, mealsPlanned, exercised }
  let streak = 0;
  let weekTotals = { calories: 0, protein: 0 };
  let loaded = false;
  let backupMsg = '';
  let fileInput;
  let pawBalance = 0;

  $: $logsVersion, $settings, load();

  async function load() {
    const s = $settings;
    const dates = weekDates();
    const plan = s.activeWeekPlanId ? await db.weekPlans.get(s.activeWeekPlanId) : null;

    const out = [];
    weekTotals = { calories: 0, protein: 0 };

    for (let i = 0; i < 7; i++) {
      const date = dates[i];
      const key = DAY_KEYS[i];
      const logs = await db.logs.where('date').equals(date).toArray();
      let mealsPlanned = 0;
      if (plan) {
        const day = plan.days[key] || {};
        mealsPlanned = SLOT_KEYS.reduce((a, sl) => a + (day[sl]?.length || 0), 0);
      }
      const mealsDone = logs.filter((l) => l.type === 'meal').length
        + logs.filter((l) => l.type === 'quick').length;
      const exercised = logs.some((l) => l.type === 'exercise');

      for (const l of logs) {
        if (l.type === 'quick') {
          weekTotals.calories += l.extra?.calories || 0;
          weekTotals.protein += l.extra?.protein || 0;
        }
        if (l.type === 'meal' && l.refId) {
          const meal = await db.meals.get(l.refId);
          if (meal) {
            const items = (await Promise.all(
              (meal.itemIds || []).map((id) => db.foodItems.get(id))
            )).filter(Boolean);
            weekTotals.calories += items.reduce((a, it) => a + (it.calories || 0), 0);
            weekTotals.protein += items.reduce((a, it) => a + (it.protein || 0), 0);
          }
        }
      }

      out.push({
        key,
        label: DAY_NAMES[key].slice(0, 3),
        date,
        isToday: date === todayStr(),
        future: date > todayStr(),
        mealsDone,
        mealsPlanned,
        exercised
      });
    }
    days = out;

    // streak: consecutive days ending today with at least one tick of any kind
    streak = 0;
    const d = new Date();
    for (let i = 0; i < 60; i++) {
      const ds = todayStr(d);
      const logs = await db.logs.where('date').equals(ds).toArray();
      const active = logs.some((l) => ['meal', 'exercise', 'quick'].includes(l.type));
      if (active) {
        streak++;
      } else if (ds !== todayStr()) {
        // today being empty (so far) doesn't break the streak
        break;
      }
      d.setDate(d.getDate() - 1);
    }

    pawBalance = (await computeBalance(s)).balance;
    loaded = true;
  }

  $: exerciseDays = days.filter((d) => d.exercised).length;

  async function doBackup() {
    backupMsg = '';
    const ok = await exportBackup();
    if (ok) {
      backupMsg = 'Backup saved. Keep it somewhere safe, like iCloud Drive.';
      bumpLogs();
    }
  }

  async function onRestoreFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const sure = confirm(
      'Restoring a backup replaces everything in Fit Track with what is in the file. Continue?'
    );
    if (!sure) return;
    try {
      await importBackup(file);
      await loadSettings();
      bumpLogs();
      backupMsg = 'Backup restored.';
    } catch (err) {
      backupMsg = err.message || 'That file could not be read.';
    }
  }

  $: needsBackupNudge = (() => {
    const last = $settings.lastBackupAt;
    if (!last) return false;
    return Date.now() - new Date(last).getTime() > 30 * 24 * 60 * 60 * 1000;
  })();

  function barHeight(d) {
    if (!d.mealsPlanned) return d.mealsDone ? 100 : 0;
    return Math.min(100, Math.round((d.mealsDone / d.mealsPlanned) * 100));
  }
</script>

<header>
  <h1>Progress</h1>
  <p class="muted">This week</p>
</header>

{#if loaded}
  {#if streak >= 2}
    <div class="streak" role="status">
      <span class="flame" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M12 2c1 4-4 5.5-4 10a4 4 0 0 0 8 0c0-2-1-3-1-3s3 1 3 4.5A6.5 6.5 0 0 1 5 13c0-5 6-7 7-11z" /></svg>
      </span>
      <span><strong>{streak} days in a row.</strong> Keep it going!</span>
    </div>
  {/if}

  <section class="card">
    <h2>Meals</h2>
    <p class="muted chart-note">Ticked meals each day</p>
    <div class="chart">
      {#each days as d}
        <div class="col">
          <div class="bar-track">
            <div
              class="bar"
              class:today={d.isToday}
              style={`height:${barHeight(d)}%`}
            ></div>
          </div>
          <span class="col-label" class:today-label={d.isToday}>{d.label}</span>
          <span class="col-count muted">
            {d.future ? '' : `${d.mealsDone}${d.mealsPlanned ? '/' + d.mealsPlanned : ''}`}
          </span>
        </div>
      {/each}
    </div>
  </section>

  <section class="card">
    <h2>Exercise</h2>
    <p class="muted chart-note">{exerciseDays} {exerciseDays === 1 ? 'day' : 'days'} this week</p>
    <div class="dots">
      {#each days as d}
        <div class="col">
          <div class="dot" class:on={d.exercised} class:today={d.isToday}>
            {#if d.exercised}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7" /></svg>
            {/if}
          </div>
          <span class="col-label" class:today-label={d.isToday}>{d.label}</span>
        </div>
      {/each}
    </div>
  </section>

  <button class="card paw-card" on:click={() => go('rewards')}>
    <span class="paw-cat"><TuxCat accessory={$settings.equippedAccessory || 'bowtie'} /></span>
    <span class="paw-text">
      <strong>{pawBalance} Paw Points</strong>
      <span class="muted">Visit Tux's corner to spend them</span>
    </span>
    <span class="paw-go">›</span>
  </button>

  {#if $settings.showNutrition}
    <section class="card">
      <h2>Food this week</h2>
      <p class="big-stat">{weekTotals.calories.toLocaleString()} calories</p>
      <p class="muted">{weekTotals.protein.toLocaleString()} g protein</p>
    </section>
  {/if}

  <section class="card backup">
    <h2>Backup</h2>
    {#if needsBackupNudge}
      <div class="nudge">It has been a while since your last backup — a good moment to save one.</div>
    {/if}
    <p class="muted">
      Everything lives only on this phone. A backup file is the only way to get
      your plans and progress back on a new phone.
      {#if $settings.lastBackupAt}
        Last backup: {new Date($settings.lastBackupAt).toLocaleDateString()}.
      {:else}
        No backup saved yet.
      {/if}
    </p>
    <button class="btn-primary wide" on:click={doBackup}>Save a backup</button>
    <button class="wide" on:click={() => fileInput.click()}>Restore from backup</button>
    <input
      type="file"
      accept="application/json,.json"
      bind:this={fileInput}
      on:change={onRestoreFile}
      hidden
    />
    {#if backupMsg}
      <p class="backup-msg" role="status">{backupMsg}</p>
    {/if}
  </section>
{/if}

<style>
  header {
    margin-bottom: 14px;
  }

  header p {
    margin: 4px 0 0;
  }

  .streak {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--warn-bg);
    border: 2px solid var(--warn-border);
    border-radius: var(--radius-card);
    padding: 12px 16px;
    margin-bottom: 14px;
  }

  .flame svg {
    width: 32px;
    height: 32px;
    fill: var(--warn-border);
  }

  section.card {
    margin-bottom: 14px;
  }

  section h2 {
    margin-bottom: 2px;
  }

  .chart-note {
    margin: 0 0 12px;
  }

  .chart,
  .dots {
    display: flex;
    gap: 6px;
  }

  .col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .bar-track {
    width: 100%;
    max-width: 44px;
    height: 110px;
    background: var(--track);
    border-radius: 10px;
    display: flex;
    align-items: flex-end;
    overflow: hidden;
  }

  .bar {
    width: 100%;
    background: var(--accent);
    border-radius: 10px 10px 0 0;
    transition: height 0.4s ease-out;
    min-height: 0;
  }

  .col-label {
    font-size: var(--fs-label);
    font-weight: 700;
    color: var(--ink-muted);
  }

  .today-label {
    color: var(--accent);
  }

  .col-count {
    font-size: calc(14px * var(--scale));
    min-height: 1.2em;
  }

  .dot {
    width: 100%;
    max-width: 44px;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 3px solid var(--tick-empty);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dot.on {
    background: var(--accent);
    border-color: var(--accent);
  }

  .dot svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: #fff;
    stroke-width: 3;
    stroke-linecap: round;
  }

  .paw-card {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    background: var(--gold-soft);
    border-color: var(--gold);
    margin-bottom: 14px;
    min-height: 84px;
  }

  .paw-cat {
    flex: 0 0 56px;
    height: 64px;
  }

  .paw-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: var(--fs-card);
  }

  .paw-go {
    font-size: var(--fs-big);
    color: var(--accent);
    font-weight: 700;
  }

  .big-stat {
    font-size: var(--fs-big);
    font-weight: 700;
    margin: 6px 0 2px;
  }

  .backup .wide {
    width: 100%;
    margin-top: 10px;
    font-weight: 700;
  }

  .nudge {
    background: var(--warn-bg);
    border: 2px solid var(--warn-border);
    border-radius: var(--radius-btn);
    padding: 10px 14px;
    margin: 8px 0;
  }

  .backup-msg {
    margin: 10px 0 0;
    font-weight: 700;
    color: var(--accent);
  }
</style>
