<script>
  import { db } from '../db/db.js';
  import {
    settings,
    go,
    logsVersion,
    toggleMealLog,
    addWaterLog,
    removeWaterLog,
    saveWeight
  } from '../lib/stores.js';
  import {
    todayStr,
    dayKey,
    friendlyDate,
    greeting,
    SLOT_KEYS,
    SLOT_NAMES
  } from '../lib/dates.js';
  import TickButton from '../components/TickButton.svelte';
  import HoldCard from '../components/HoldCard.svelte';
  import TuxCat from '../components/TuxCat.svelte';
  import { computeBalance } from '../lib/points.js';
  import { moodForProgress } from '../lib/mood.js';

  let slots = []; // [{ slot, slotName, meals: [{ meal, detail, ticked }] }]
  let pawBalance = 0;
  let ingredientMeal = null; // { meal, items, cal, pro }
  let todayWeight = null;
  let lastWeight = null; // { kg, date } from an earlier day
  let weightInput = '';
  let chipMood = 'normal';
  let quickEntries = [];
  let waterCount = 0;
  let routine = null;
  let routineDone = 0;
  let routineTotal = 0;
  let totals = { calories: 0, protein: 0 };
  let loaded = false;

  $: $logsVersion, $settings, load();

  async function load() {
    const s = $settings;
    const logs = await db.logs.where('date').equals(todayStr()).toArray();

    // meals for today
    slots = [];
    totals = { calories: 0, protein: 0 };
    const plan = s.activeWeekPlanId ? await db.weekPlans.get(s.activeWeekPlanId) : null;
    if (plan) {
      const day = plan.days[dayKey()] || {};
      for (const slot of SLOT_KEYS) {
        const mealIds = day[slot] || [];
        const entries = [];
        for (const mealId of mealIds) {
          const meal = await db.meals.get(mealId);
          if (!meal) continue;
          const items = (await Promise.all(
            (meal.itemIds || []).map((i) => db.foodItems.get(i))
          )).filter(Boolean);
          const cal = items.reduce((a, i) => a + (i.calories || 0), 0);
          const pro = items.reduce((a, i) => a + (i.protein || 0), 0);
          const ticked = logs.some(
            (l) => l.type === 'meal' && l.refId === mealId && l.slot === slot
          );
          if (ticked) {
            totals.calories += cal;
            totals.protein += pro;
          }
          entries.push({
            meal,
            items,
            detail: items.map((i) => i.name).join(' + '),
            cal,
            pro,
            ticked
          });
        }
        if (entries.length) {
          slots.push({ slot, slotName: SLOT_NAMES[slot], meals: entries });
        }
      }
    }

    quickEntries = logs.filter((l) => l.type === 'quick');
    for (const q of quickEntries) {
      totals.calories += q.extra?.calories || 0;
      totals.protein += q.extra?.protein || 0;
    }

    waterCount = logs.filter((l) => l.type === 'water').length;

    // exercise summary
    routine = s.activeRoutineId ? await db.routines.get(s.activeRoutineId) : null;
    if (routine) {
      routineTotal = routine.exerciseIds.length;
      routineDone = routine.exerciseIds.filter((exId) =>
        logs.some((l) => l.type === 'exercise' && l.refId === exId)
      ).length;
    } else {
      routineTotal = 0;
      routineDone = 0;
    }

    const weightLog = logs.find((l) => l.type === 'weight');
    todayWeight = weightLog ? weightLog.extra?.kg : null;
    if (!todayWeight) {
      const all = await db.logs.where('type').equals('weight').toArray();
      all.sort((a, b) => (a.date < b.date ? 1 : -1));
      const prev = all.find((l) => l.date !== todayStr());
      lastWeight = prev ? { kg: prev.extra?.kg, date: prev.date } : null;
    }

    pawBalance = (await computeBalance(s)).balance;

    // Tux's mood follows how much of the day is ticked off
    const plannedCount =
      slots.reduce((a, g) => a + g.meals.length, 0) + routineTotal;
    const doneCount =
      slots.reduce((a, g) => a + g.meals.filter((m) => m.ticked).length, 0) + routineDone;
    chipMood = moodForProgress(plannedCount ? doneCount / plannedCount : 0);

    loaded = true;
  }

  async function submitWeight() {
    const kg = Number(weightInput);
    if (!kg || kg <= 0) return;
    await saveWeight(kg);
    weightInput = '';
  }

  function showIngredients(entry) {
    ingredientMeal = entry;
  }

  $: allMealsTicked =
    slots.length > 0 && slots.every((s) => s.meals.every((m) => m.ticked));
  $: allExerciseDone = routineTotal > 0 && routineDone >= routineTotal;
  $: dayComplete = allMealsTicked && allExerciseDone;
</script>

<header>
  <div>
    <h1>{greeting($settings.userName)}</h1>
    <p class="muted">{friendlyDate()}</p>
  </div>
  <div class="header-btns">
    <button class="icon-btn" on:click={() => go('settings')}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" /></svg>
      Settings
    </button>
    <button class="icon-btn add" on:click={() => go('add')}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      Add
    </button>
  </div>
</header>

{#if loaded}
  <button class="paw-chip" on:click={() => go('rewards')}>
    <span class="chip-cat"><TuxCat accessory={$settings.equippedAccessory || 'bowtie'} mood={chipMood} /></span>
    <span class="chip-text"><strong>{pawBalance}</strong> Paw Points</span>
    <span class="chip-go">Visit Tux ›</span>
  </button>

  {#if dayComplete}
    <div class="celebrate" role="status">
      <span class="celebrate-cat"><TuxCat accessory={$settings.equippedAccessory || 'bowtie'} mood="happy" bob={true} /></span>
      <div>
        <strong>Everything done for today{$settings.userName ? `, ${$settings.userName}` : ''}!</strong>
        <span>Tux is delighted. Enjoy the rest of your day.</span>
      </div>
    </div>
  {/if}

  {#if slots.length === 0 && !routine}
    <div class="card empty">
      <p><strong>Welcome to Fit Track.</strong></p>
      <p>Tap <strong>Add</strong> at the top to pick a food plan or an exercise routine to start with.</p>
      <button class="btn-primary" style="width:100%" on:click={() => go('add')}>Add a plan</button>
    </div>
  {/if}

  {#if slots.length}
    <p class="hold-tip muted">Tap a meal to see what's in it, with grams.</p>
  {/if}

  {#each slots as group}
    <section>
      <h2>{group.slotName}</h2>
      {#each group.meals as entry}
        <div class="row-wrap">
          <HoldCard on:hold={() => showIngredients(entry)}>
            <div class="meal-row" class:done={entry.ticked}>
              <button class="meal-text" on:click={() => showIngredients(entry)}>
                <span class="meal-name">{entry.meal.name}</span>
                {#if entry.detail && entry.detail !== entry.meal.name}
                  <span class="muted">{entry.detail}</span>
                {/if}
                {#if $settings.showNutrition && entry.cal}
                  <span class="muted">{entry.cal} cal · {entry.pro} g protein</span>
                {/if}
              </button>
              <TickButton
                ticked={entry.ticked}
                label={`${entry.ticked ? 'Unmark' : 'Mark'} ${entry.meal.name} as eaten`}
                on:click={() => toggleMealLog(entry.meal.id, group.slot)}
              />
            </div>
          </HoldCard>
        </div>
      {/each}
    </section>
  {/each}

  {#if quickEntries.length}
    <section>
      <h2>Also eaten</h2>
      {#each quickEntries as q}
        <div class="card meal-row done">
          <div class="meal-text">
            <span class="meal-name">{q.extra?.name || 'Food added'}</span>
            {#if $settings.showNutrition}
              <span class="muted">{q.extra?.calories || 0} cal</span>
            {/if}
          </div>
          <span class="quick-mark" aria-hidden="true">✓</span>
        </div>
      {/each}
    </section>
  {/if}

  {#if slots.length > 0 || quickEntries.length > 0}
    <button class="wide" on:click={() => go('quickadd')}>+ Add food</button>
  {/if}

  {#if $settings.showNutrition && (totals.calories > 0)}
    <div class="card totals">
      <strong>Today so far:</strong> {totals.calories} calories · {totals.protein} g protein
    </div>
  {/if}

  {#if $settings.proteinGoal > 0 && (slots.length > 0 || quickEntries.length > 0)}
    {@const proteinPct = Math.min(100, Math.round((totals.protein / $settings.proteinGoal) * 100))}
    <section>
      <h2>Protein</h2>
      <div class="card protein-card" class:goal-met={totals.protein >= $settings.proteinGoal}>
        <div class="protein-top">
          <span><strong>{totals.protein} g</strong> of {$settings.proteinGoal} g goal</span>
          {#if totals.protein >= $settings.proteinGoal}
            <span class="protein-badge">Goal reached · +20 points</span>
          {/if}
        </div>
        <div class="protein-track">
          <div class="protein-bar" style={`width:${proteinPct}%`}></div>
        </div>
        {#if totals.protein < $settings.proteinGoal}
          <span class="muted">{$settings.proteinGoal - totals.protein} g to go — ticking meals fills this up</span>
        {/if}
      </div>
    </section>
  {/if}

  {#if routine}
    <section>
      <h2>Exercise</h2>
      <button class="card routine-card" on:click={() => go('player')}>
        <div class="meal-text">
          <span class="meal-name">{routine.name}</span>
          <span class="muted">
            {#if allExerciseDone}
              All done today — well done!
            {:else}
              {routineDone} of {routineTotal} done · tap to open
            {/if}
          </span>
        </div>
        <div class="ring" class:full={allExerciseDone}>
          {routineDone}/{routineTotal}
        </div>
      </button>
    </section>
  {/if}

  {#if ingredientMeal}
    <div class="sheet-backdrop" role="dialog" aria-label={`What's in ${ingredientMeal.meal.name}`}>
      <div class="sheet">
        <div class="sheet-top">
          <h2>{ingredientMeal.meal.name}</h2>
          <button on:click={() => (ingredientMeal = null)}>Close</button>
        </div>
        {#if ingredientMeal.items.length}
          <ul class="ing-list">
            {#each ingredientMeal.items as item}
              <li>
                <span class="ing-name">{item.name}</span>
                <span class="ing-amounts">
                  {#if item.grams}<strong>{item.grams} g</strong>{/if}
                  {#if $settings.showNutrition && item.calories}
                    <span class="muted">{item.calories} cal{item.protein ? ` · ${item.protein} g protein` : ''}</span>
                  {/if}
                </span>
              </li>
            {/each}
          </ul>
          {#if $settings.showNutrition && ingredientMeal.cal}
            <p class="ing-total">Whole meal: {ingredientMeal.cal} cal · {ingredientMeal.pro} g protein</p>
          {/if}
        {:else}
          <p class="muted">No ingredient details for this meal yet.</p>
        {/if}
        <button class="btn-primary sheet-close" on:click={() => (ingredientMeal = null)}>Done</button>
      </div>
    </div>
  {/if}

  <section>
    <h2>Weight</h2>
    <div class="card weight-card">
      {#if todayWeight}
        <p class="weight-today">Saved today: <strong>{todayWeight} kg</strong></p>
        <p class="muted">Type a new number to change it.</p>
      {:else if lastWeight}
        <p class="muted">Last time: {lastWeight.kg} kg on {new Date(lastWeight.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}</p>
      {:else}
        <p class="muted">Weigh yourself and write it down here — once a day is plenty.</p>
      {/if}
      <div class="weight-row">
        <input
          bind:value={weightInput}
          inputmode="decimal"
          placeholder="e.g. 72"
          aria-label="Weight in kilograms"
        />
        <span class="weight-unit">kg</span>
        <button class="btn-primary" on:click={submitWeight} disabled={!Number(weightInput)}>Save</button>
      </div>
    </div>
  </section>

  {#if $settings.showWater}
    <section>
      <h2>Water</h2>
      <div class="card water-card">
        <div class="glasses" role="img" aria-label={`${waterCount} glasses of water today`}>
          {#each Array(8) as _, i}
            <span class="glass" class:filled={i < waterCount}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12l-1.5 18h-9z" /></svg>
            </span>
          {/each}
        </div>
        <div class="water-btns">
          <button class="btn-primary water-btn" on:click={addWaterLog}>+ Glass of water</button>
          {#if waterCount > 0}
            <button class="water-btn" on:click={removeWaterLog}>− Remove one</button>
          {/if}
        </div>
      </div>
    </section>
  {/if}
{/if}

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 10px;
  }

  header p {
    margin: 4px 0 0;
  }

  .header-btns {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .icon-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    font-size: var(--fs-label);
    font-weight: 700;
    min-height: var(--tap);
    padding: 8px 12px;
  }

  .icon-btn svg {
    width: 26px;
    height: 26px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }

  .icon-btn.add {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  section {
    margin-top: 22px;
  }

  section h2 {
    margin-bottom: 10px;
  }

  .paw-chip {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--gold-soft);
    border-color: var(--gold);
    margin-top: 12px;
    min-height: 68px;
    text-align: left;
  }

  .chip-cat {
    flex: 0 0 44px;
    height: 50px;
  }

  .chip-text {
    flex: 1;
    font-size: var(--fs-card);
  }

  .chip-go {
    color: var(--accent);
    font-weight: 700;
    font-size: var(--fs-label);
  }

  .hold-tip {
    margin: 14px 0 -8px;
  }

  .row-wrap {
    margin-bottom: var(--gap);
  }

  .meal-row {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    text-align: left;
  }

  :global(.hold-card:has(.meal-row.done)) {
    background: var(--accent-soft);
    border-color: var(--accent);
  }

  .meal-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    border: none;
    background: transparent;
    padding: 0;
    text-align: left;
    border-radius: 0;
    min-height: 0;
    align-items: flex-start;
  }

  .sheet-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(34, 28, 14, 0.5);
    z-index: 55;
    display: flex;
    align-items: flex-end;
  }

  .sheet {
    background: var(--bg);
    border-radius: 20px 20px 0 0;
    width: 100%;
    max-width: 560px;
    margin: 0 auto;
    max-height: 80vh;
    overflow-y: auto;
    padding: 18px var(--pad-side) calc(24px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 12px;
    animation: sheet-up 0.25s ease-out;
  }

  @keyframes sheet-up {
    from { transform: translateY(40px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .sheet-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
  }

  .ing-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ing-list li {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-btn);
    padding: 12px 14px;
  }

  .ing-name {
    font-weight: 700;
  }

  .ing-amounts {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
    flex-shrink: 0;
  }

  .ing-total {
    margin: 0;
    font-weight: 700;
    background: var(--gold-soft);
    border: 2px solid var(--gold);
    border-radius: var(--radius-btn);
    padding: 10px 14px;
  }

  .sheet-close {
    width: 100%;
  }

  .meal-name {
    font-size: var(--fs-card);
    font-weight: 700;
  }

  .quick-mark {
    font-size: var(--fs-big);
    color: var(--accent);
    font-weight: 700;
    padding-right: 10px;
  }

  .wide {
    width: 100%;
    margin-top: 4px;
    font-weight: 700;
    color: var(--accent);
  }

  .totals {
    margin-top: 14px;
    background: var(--accent-soft);
  }

  .protein-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .protein-card.goal-met {
    background: var(--gold-soft);
    border-color: var(--gold);
  }

  .protein-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    font-size: var(--fs-card);
  }

  .protein-badge {
    background: var(--gold);
    color: #fff;
    font-weight: 700;
    font-size: var(--fs-label);
    border-radius: 999px;
    padding: 8px 14px;
  }

  .protein-track {
    height: 26px;
    background: var(--track);
    border-radius: 13px;
    overflow: hidden;
  }

  .protein-bar {
    height: 100%;
    background: var(--gold);
    border-radius: 13px;
    transition: width 0.4s ease-out;
  }

  .weight-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .weight-card p {
    margin: 0;
  }

  .weight-today {
    font-size: var(--fs-card);
  }

  .weight-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .weight-row input {
    flex: 1;
    min-width: 0;
    font-size: var(--fs-card);
    font-weight: 700;
    text-align: center;
  }

  .weight-unit {
    font-weight: 700;
    color: var(--ink-muted);
  }

  .weight-row button {
    flex-shrink: 0;
    min-height: 56px;
  }

  .weight-row button:disabled {
    opacity: 0.45;
  }

  .routine-card {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    text-align: left;
    min-height: 80px;
  }

  .ring {
    flex: 0 0 64px;
    height: 64px;
    border-radius: 50%;
    border: 4px solid var(--tick-empty);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: var(--fs-label);
  }

  .ring.full {
    border-color: var(--accent);
    background: var(--accent);
    color: #fff;
  }

  .celebrate {
    display: flex;
    gap: 14px;
    align-items: center;
    background: var(--accent);
    color: #fff;
    border-radius: var(--radius-card);
    padding: 16px;
    margin-top: 14px;
    animation: gentle-in 0.5s ease-out;
  }

  .celebrate-cat {
    flex: 0 0 64px;
    height: 74px;
    background: #fff;
    border-radius: 50%;
    padding: 4px;
  }

  .celebrate div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  @keyframes gentle-in {
    from { transform: translateY(-8px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .water-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .glasses {
    display: flex;
    gap: 4px;
  }

  .glass {
    flex: 1;
    max-width: 38px;
    display: flex;
    justify-content: center;
  }

  .glass svg {
    width: 100%;
    max-width: 34px;
    height: 40px;
    fill: none;
    stroke: var(--tick-empty);
    stroke-width: 1.6;
    stroke-linejoin: round;
  }

  .glass.filled svg {
    fill: var(--water-soft);
    stroke: var(--water);
  }

  .water-btns {
    display: flex;
    gap: 10px;
  }

  .water-btn {
    flex: 1;
  }

  .empty p {
    margin: 0 0 12px;
  }
</style>
