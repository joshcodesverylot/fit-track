<script>
  import { db, uid } from '../db/db.js';
  import { route, go, settings, updateSettings, showUndo } from '../lib/stores.js';
  import {
    DAY_KEYS,
    DAY_NAMES,
    SLOT_KEYS,
    SLOT_NAMES,
    dayKey
  } from '../lib/dates.js';

  let plan = null;
  let selectedDay = dayKey();
  let mealNames = {}; // mealId -> meal
  let loaded = false;

  // meal picker state
  let picking = null; // { slot }
  let allMeals = [];
  let creatingMeal = false;
  let newMealName = '';
  let newMealGrams = '';
  let newMealCal = '';
  let newMealProtein = '';

  $: viewPlanId = $route.params.viewPlanId;
  $: viewPlanId, $settings, load();

  async function load() {
    const id = viewPlanId || $settings.activeWeekPlanId;
    plan = id ? await db.weekPlans.get(id) : null;
    if (plan) {
      const meals = await db.meals.toArray();
      mealNames = Object.fromEntries(meals.map((m) => [m.id, m]));
      allMeals = meals;
    }
    loaded = true;
  }

  $: isActive = plan && $settings.activeWeekPlanId === plan.id;
  $: editable = plan && !plan.isPreset;

  async function usePlan() {
    const prev = $settings.activeWeekPlanId;
    await updateSettings({ activeWeekPlanId: plan.id });
    showUndo(`Now using “${plan.name}” · Undo`, async () => {
      await updateSettings({ activeWeekPlanId: prev });
    });
    go('today');
  }

  async function copyAndEdit() {
    const copy = {
      id: uid(),
      name: plan.name + ' (mine)',
      isPreset: 0,
      days: JSON.parse(JSON.stringify(plan.days))
    };
    await db.weekPlans.put(copy);
    await updateSettings({ activeWeekPlanId: copy.id });
    go('food', { viewPlanId: copy.id });
  }

  async function removeMeal(slot, mealId) {
    const before = JSON.parse(JSON.stringify(plan.days));
    plan.days[selectedDay][slot] = plan.days[selectedDay][slot].filter((m) => m !== mealId);
    await db.weekPlans.put(plan);
    plan = plan;
    showUndo('Meal removed · Undo', async () => {
      plan.days = before;
      await db.weekPlans.put(plan);
      plan = plan;
    });
  }

  function openPicker(slot) {
    picking = { slot };
    creatingMeal = false;
  }

  async function pickMeal(meal) {
    const slot = picking.slot;
    const day = selectedDay;
    const before = JSON.parse(JSON.stringify(plan.days));
    plan.days[day][slot] = [...(plan.days[day][slot] || []), meal.id];
    await db.weekPlans.put(plan);
    plan = plan;
    picking = null;
    showUndo('Meal added · Undo', async () => {
      plan.days = before;
      await db.weekPlans.put(plan);
      plan = plan;
    });
  }

  async function createMeal() {
    const name = newMealName.trim();
    if (!name) return;
    const item = {
      id: uid(),
      name,
      grams: newMealGrams ? Number(newMealGrams) : undefined,
      calories: newMealCal ? Number(newMealCal) : undefined,
      protein: newMealProtein ? Number(newMealProtein) : undefined
    };
    await db.foodItems.put(item);
    const meal = { id: uid(), name, itemIds: [item.id] };
    await db.meals.put(meal);
    mealNames[meal.id] = meal;
    allMeals = [...allMeals, meal];
    newMealName = '';
    newMealGrams = '';
    newMealCal = '';
    newMealProtein = '';
    await pickMeal(meal);
  }

  function mealLabel(mealId) {
    return mealNames[mealId] ? mealNames[mealId].name : 'Meal';
  }

  async function adjustGoal(delta) {
    const next = Math.max(20, Math.min(200, ($settings.proteinGoal || 60) + delta));
    await updateSettings({ proteinGoal: next });
  }
</script>

<header>
  {#if viewPlanId}
    <button class="btn-quiet back" on:click={() => go('add', { kind: 'food' })}>‹ Back</button>
  {/if}
  <h1>Food</h1>
</header>

{#if loaded && !plan}
  <div class="card">
    <p>No food plan picked yet.</p>
    <button class="btn-primary" style="width:100%" on:click={() => go('add', { kind: 'food' })}>
      Pick a food plan
    </button>
  </div>
{:else if loaded}
  <p class="muted plan-name">
    {plan.name}
    {#if isActive}· in use now{/if}
    {#if plan.isPreset}· ready-made{/if}
  </p>

  <div class="days" role="tablist" aria-label="Day of the week">
    {#each DAY_KEYS as d}
      <button
        role="tab"
        aria-selected={selectedDay === d}
        class:on={selectedDay === d}
        on:click={() => (selectedDay = d)}
      >{DAY_NAMES[d].slice(0, 3)}</button>
    {/each}
  </div>
  <h2 class="day-title">{DAY_NAMES[selectedDay]}</h2>

  {#each SLOT_KEYS as slot}
    <section>
      <h2 class="slot-title">{SLOT_NAMES[slot]}</h2>
      {#each plan.days[selectedDay]?.[slot] || [] as mealId}
        <div class="card meal-row">
          <span class="meal-name">{mealLabel(mealId)}</span>
          {#if editable}
            <button class="change" on:click={() => removeMeal(slot, mealId)}>Remove</button>
          {/if}
        </div>
      {:else}
        <p class="muted none">Nothing planned</p>
      {/each}
      {#if editable}
        <button class="add-meal" on:click={() => openPicker(slot)}>+ Add a meal</button>
      {/if}
    </section>
  {/each}

  <div class="actions">
    {#if !isActive}
      <button class="btn-primary wide" on:click={usePlan}>Use this plan</button>
    {/if}
    {#if plan.isPreset}
      <button class="wide" on:click={copyAndEdit}>Copy &amp; edit</button>
    {/if}
  </div>

  <section class="card goal-card">
    <h2 class="slot-title">Daily protein goal</h2>
    <p class="muted goal-note">Reach it in a day and Tux gives you +20 Paw Points.</p>
    <div class="goal-row">
      <button class="goal-btn" aria-label="Lower the goal by 5 grams" on:click={() => adjustGoal(-5)}>−</button>
      <span class="goal-value"><strong>{$settings.proteinGoal || 60}</strong> g</span>
      <button class="goal-btn" aria-label="Raise the goal by 5 grams" on:click={() => adjustGoal(5)}>+</button>
    </div>
  </section>
{/if}

{#if picking}
  <div class="picker" role="dialog" aria-label="Pick a meal">
    <div class="picker-inner">
      <div class="picker-top">
        <h2>Add to {SLOT_NAMES[picking.slot]}</h2>
        <button on:click={() => (picking = null)}>Close</button>
      </div>
      {#if creatingMeal}
        <label>
          What is it?
          <input bind:value={newMealName} placeholder="e.g. Sardines on toast" />
        </label>
        <label>
          How much, in grams? (optional)
          <input bind:value={newMealGrams} inputmode="numeric" placeholder="e.g. 200" />
        </label>
        <label>
          Calories (you can leave this out)
          <input bind:value={newMealCal} inputmode="numeric" placeholder="e.g. 250" />
        </label>
        <label>
          Protein in grams (optional)
          <input bind:value={newMealProtein} inputmode="numeric" placeholder="e.g. 12" />
        </label>
        <div class="picker-btns">
          <button on:click={() => (creatingMeal = false)}>Back</button>
          <button class="btn-primary" on:click={createMeal}>Add meal</button>
        </div>
      {:else}
        <button class="btn-primary wide" on:click={() => (creatingMeal = true)}>
          + New meal
        </button>
        <div class="meal-list">
          {#each allMeals as meal}
            <button class="card pick-row" on:click={() => pickMeal(meal)}>
              {meal.name}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 6px;
  }

  .back {
    padding-left: 0;
    min-height: 48px;
  }

  .plan-name {
    margin: 0 0 12px;
    font-size: var(--fs-card);
  }

  .days {
    display: flex;
    gap: 4px;
    background: var(--track);
    border-radius: var(--radius-btn);
    padding: 4px;
    margin-bottom: 12px;
  }

  .days button {
    flex: 1;
    min-height: 54px;
    border: none;
    background: transparent;
    font-weight: 700;
    font-size: var(--fs-label);
    padding: 4px 2px;
  }

  .days button.on {
    background: var(--surface);
    border: 2px solid var(--accent);
    color: var(--accent);
  }

  .day-title {
    margin-bottom: 4px;
  }

  section {
    margin-top: 14px;
  }

  .slot-title {
    font-size: var(--fs-card);
    margin-bottom: 8px;
  }

  .meal-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }

  .meal-name {
    font-size: var(--fs-body);
    font-weight: 700;
  }

  .change {
    min-height: 48px;
    padding: 4px 14px;
    font-size: var(--fs-label);
  }

  .none {
    margin: 0 0 8px;
  }

  .add-meal {
    width: 100%;
    min-height: 52px;
    color: var(--accent);
    font-weight: 700;
    border-style: dashed;
  }

  .actions {
    margin-top: 22px;
  }

  .wide {
    width: 100%;
    margin-bottom: 10px;
    font-weight: 700;
  }

  .goal-card {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .goal-note {
    margin: 0;
  }

  .goal-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .goal-btn {
    flex: 0 0 64px;
    min-height: 64px;
    font-size: var(--fs-title);
    font-weight: 700;
    color: var(--accent);
    line-height: 1;
  }

  .goal-value {
    flex: 1;
    text-align: center;
    font-size: var(--fs-big);
  }

  .picker {
    position: fixed;
    inset: 0;
    background: rgba(27, 27, 27, 0.5);
    z-index: 55;
    display: flex;
    align-items: flex-end;
  }

  .picker-inner {
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
  }

  .picker-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .meal-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pick-row {
    width: 100%;
    text-align: left;
    font-weight: 700;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-weight: 700;
  }

  .picker-btns {
    display: flex;
    gap: 10px;
  }

  .picker-btns button {
    flex: 1;
  }
</style>
