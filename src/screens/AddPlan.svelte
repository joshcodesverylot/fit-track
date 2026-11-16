<script>
  import { db, uid } from '../db/db.js';
  import { route, go, settings, updateSettings, showUndo } from '../lib/stores.js';
  import ExerciseFigure from '../components/ExerciseFigure.svelte';
  import { DAY_KEYS } from '../lib/dates.js';

  let kind = $route.params.kind || 'food';
  let weekPlans = [];
  let routines = [];
  let previewRoutine = null; // { routine, exercises }

  load();

  async function load() {
    weekPlans = await db.weekPlans.toArray();
    routines = await db.routines.toArray();
  }

  async function openFoodPlan(plan) {
    go('food', { viewPlanId: plan.id });
  }

  async function openRoutine(routine) {
    const exercises = (
      await Promise.all(routine.exerciseIds.map((id) => db.exercises.get(id)))
    ).filter(Boolean);
    previewRoutine = { routine, exercises };
  }

  async function useRoutine(routine) {
    const prev = $settings.activeRoutineId;
    await updateSettings({ activeRoutineId: routine.id });
    showUndo(`Now using “${routine.name}” · Undo`, async () => {
      await updateSettings({ activeRoutineId: prev });
    });
    go('routine');
  }

  async function copyRoutine(routine) {
    const copy = {
      id: uid(),
      name: routine.name + ' (mine)',
      isPreset: 0,
      exerciseIds: [...routine.exerciseIds]
    };
    await db.routines.put(copy);
    await useRoutine(copy);
  }

  async function makeOwn() {
    if (kind === 'food') {
      const days = {};
      for (const d of DAY_KEYS) {
        days[d] = { breakfast: [], lunch: [], dinner: [], snack: [] };
      }
      const plan = { id: uid(), name: 'My own plan', isPreset: 0, days };
      await db.weekPlans.put(plan);
      go('food', { viewPlanId: plan.id });
    } else {
      const routine = { id: uid(), name: 'My own routine', isPreset: 0, exerciseIds: [] };
      await db.routines.put(routine);
      await updateSettings({ activeRoutineId: routine.id });
      go('routine');
    }
  }
</script>

<header>
  <button class="btn-quiet back" on:click={() => go('today')}>‹ Back</button>
  <h1>Add a plan</h1>
</header>

<div class="switch" role="tablist" aria-label="Plan type">
  <button
    role="tab"
    aria-selected={kind === 'food'}
    class:on={kind === 'food'}
    on:click={() => { kind = 'food'; previewRoutine = null; }}
  >Food</button>
  <button
    role="tab"
    aria-selected={kind === 'exercise'}
    class:on={kind === 'exercise'}
    on:click={() => (kind = 'exercise')}
  >Exercise</button>
</div>

{#if kind === 'food'}
  <p class="muted">Pick a ready-made week of meals. You can copy and change it later.</p>
  {#each weekPlans.filter((p) => p.isPreset) as plan}
    <button class="tile card" on:click={() => openFoodPlan(plan)}>
      <span class="tile-name">{plan.name}</span>
      <span class="muted">Ready-made week plan {($settings.activeWeekPlanId === plan.id) ? '· in use' : ''}</span>
    </button>
  {/each}
  {#if weekPlans.some((p) => !p.isPreset)}
    <h2>My plans</h2>
    {#each weekPlans.filter((p) => !p.isPreset) as plan}
      <button class="tile card mine" on:click={() => openFoodPlan(plan)}>
        <span class="tile-name">{plan.name}</span>
        <span class="muted">{($settings.activeWeekPlanId === plan.id) ? 'In use now' : 'My own plan'}</span>
      </button>
    {/each}
  {/if}
{:else if !previewRoutine}
  <p class="muted">Pick a routine. You can copy and change it later.</p>
  {#each routines.filter((r) => r.isPreset) as routine}
    <button class="tile card" on:click={() => openRoutine(routine)}>
      <span class="tile-name">{routine.name}</span>
      <span class="muted">{routine.exerciseIds.length} exercises {($settings.activeRoutineId === routine.id) ? '· in use' : ''}</span>
    </button>
  {/each}
  {#if routines.some((r) => !r.isPreset)}
    <h2>My routines</h2>
    {#each routines.filter((r) => !r.isPreset) as routine}
      <button class="tile card mine" on:click={() => openRoutine(routine)}>
        <span class="tile-name">{routine.name}</span>
        <span class="muted">{routine.exerciseIds.length} exercises {($settings.activeRoutineId === routine.id) ? '· in use' : ''}</span>
      </button>
    {/each}
  {/if}
{:else}
  <button class="btn-quiet back" on:click={() => (previewRoutine = null)}>‹ All routines</button>
  <h2 class="preview-title">{previewRoutine.routine.name}</h2>
  {#each previewRoutine.exercises as ex}
    <div class="card preview-row">
      <div class="thumb"><ExerciseFigure figure={ex.figure} paused={true} /></div>
      <div>
        <strong>{ex.name}</strong>
        <div class="muted">{ex.reps || (ex.minutes ? `${ex.minutes} minutes` : '')}</div>
      </div>
    </div>
  {/each}
  <button class="btn-primary wide" on:click={() => useRoutine(previewRoutine.routine)}>
    Use this routine
  </button>
  <button class="wide" on:click={() => copyRoutine(previewRoutine.routine)}>
    Copy &amp; edit
  </button>
{/if}

{#if !previewRoutine}
  <button class="wide own" on:click={makeOwn}>Make my own</button>
{/if}

<style>
  header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 14px;
  }

  .back {
    padding-left: 0;
    min-height: 48px;
  }

  .switch {
    display: flex;
    background: var(--track);
    border-radius: var(--radius-btn);
    padding: 4px;
    margin-bottom: 16px;
  }

  .switch button {
    flex: 1;
    border: none;
    background: transparent;
    font-weight: 700;
    min-height: 54px;
  }

  .switch button.on {
    background: var(--surface);
    border: 2px solid var(--accent);
    color: var(--accent);
  }

  .tile {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    text-align: left;
    margin-bottom: var(--gap);
    min-height: 84px;
  }

  .tile.mine {
    border-color: var(--accent);
  }

  .tile-name {
    font-size: var(--fs-card);
    font-weight: 700;
  }

  h2 {
    margin: 18px 0 10px;
  }

  .preview-title {
    margin: 6px 0 12px;
  }

  .preview-row {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: var(--gap);
  }

  .thumb {
    flex: 0 0 64px;
    height: 64px;
    background: var(--bg);
    border-radius: 12px;
    padding: 4px;
  }

  .wide {
    width: 100%;
    margin-bottom: 10px;
    font-weight: 700;
  }

  .own {
    color: var(--accent);
    margin-top: 8px;
  }

  p.muted {
    margin: 0 0 14px;
  }
</style>
