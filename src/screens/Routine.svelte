<script>
  import { db, uid } from '../db/db.js';
  import {
    settings,
    go,
    logsVersion,
    toggleExerciseLog,
    logAllExercises,
    showUndo,
    bumpLogs,
    updateSettings
  } from '../lib/stores.js';
  import { todayStr } from '../lib/dates.js';
  import TickButton from '../components/TickButton.svelte';
  import HoldCard from '../components/HoldCard.svelte';
  import ExerciseFigure from '../components/ExerciseFigure.svelte';
  import HowTo from './HowTo.svelte';

  let routine = null;
  let entries = []; // { exercise, ticked }
  let loaded = false;

  let howToExercise = null;
  let howToOrigin = null;

  let adding = false;
  let newName = '';
  let newAmount = '';

  $: $logsVersion, $settings, load();

  async function load() {
    const s = $settings;
    routine = s.activeRoutineId ? await db.routines.get(s.activeRoutineId) : null;
    if (!routine) {
      entries = [];
      loaded = true;
      return;
    }
    const logs = await db.logs.where('date').equals(todayStr()).toArray();
    const list = [];
    for (const exId of routine.exerciseIds) {
      const exercise = await db.exercises.get(exId);
      if (!exercise) continue;
      list.push({
        exercise,
        ticked: logs.some((l) => l.type === 'exercise' && l.refId === exId)
      });
    }
    entries = list;
    loaded = true;
  }

  function openHowTo(exercise, event) {
    const card = event?.currentTarget?.closest?.('.hold-card');
    howToOrigin = card ? card.getBoundingClientRect() : null;
    howToExercise = exercise;
  }

  function openHowToFromHold(exercise, rect) {
    howToOrigin = rect || null;
    howToExercise = exercise;
  }

  $: doneCount = entries.filter((e) => e.ticked).length;
  $: allDone = entries.length > 0 && doneCount === entries.length;

  async function addExercise() {
    const name = newName.trim();
    if (!name || !routine) return;
    const amount = newAmount.trim();
    const isMinutes = /min/i.test(amount);
    const exercise = {
      id: uid(),
      name,
      reps: !isMinutes && amount ? amount : undefined,
      minutes: isMinutes ? parseInt(amount) || undefined : undefined,
      figure: 'walk',
      steps: ['Do this exercise the way it was shown to you.'],
      safetyNote: 'Stop if anything hurts.',
      easierVersion: ''
    };
    await db.exercises.put(exercise);

    // If the active routine is a preset, clone it first so presets stay untouched.
    let target = routine;
    if (routine.isPreset) {
      target = {
        id: uid(),
        name: routine.name + ' (mine)',
        isPreset: 0,
        exerciseIds: [...routine.exerciseIds]
      };
      await db.routines.put(target);
      await updateSettings({ activeRoutineId: target.id });
    }
    target.exerciseIds = [...target.exerciseIds, exercise.id];
    await db.routines.put(target);
    newName = '';
    newAmount = '';
    adding = false;
    bumpLogs();
    showUndo('Exercise added · Undo', async () => {
      target.exerciseIds = target.exerciseIds.filter((i) => i !== exercise.id);
      await db.routines.put(target);
      await db.exercises.delete(exercise.id);
    });
  }
</script>

<header>
  <h1>Exercise</h1>
  <button class="btn-quiet" on:click={() => go('add', { kind: 'exercise' })}>Change routine</button>
</header>

{#if loaded && !routine}
  <div class="card">
    <p>No routine picked yet.</p>
    <button class="btn-primary" style="width:100%" on:click={() => go('add', { kind: 'exercise' })}>
      Pick a routine
    </button>
  </div>
{:else if loaded}
  <p class="muted routine-name">{routine.name} · {doneCount} of {entries.length} done</p>
  <p class="tip">Tip: press and hold any exercise to see how to do it.</p>

  {#each entries as entry (entry.exercise.id)}
    <div class="row-wrap">
      <HoldCard on:hold={(e) => openHowToFromHold(entry.exercise, e.detail.rect)}>
        <div class="ex-row" class:done={entry.ticked}>
          <div class="thumb">
            <ExerciseFigure figure={entry.exercise.figure} paused={true} />
          </div>
          <div class="ex-text">
            <span class="ex-name">{entry.exercise.name}</span>
            <span class="muted">
              {entry.exercise.reps || (entry.exercise.minutes ? `${entry.exercise.minutes} minutes` : '')}
            </span>
            <button class="show-me" on:click={(e) => openHowTo(entry.exercise, e)}>
              Show me
            </button>
          </div>
          <TickButton
            ticked={entry.ticked}
            label={`${entry.ticked ? 'Unmark' : 'Mark'} ${entry.exercise.name} as done`}
            on:click={() => toggleExerciseLog(entry.exercise.id)}
          />
        </div>
      </HoldCard>
    </div>
  {/each}

  {#if entries.length && !allDone}
    <button
      class="btn-primary all-done"
      on:click={() => logAllExercises(entries.map((e) => e.exercise.id))}
    >
      I did it all
    </button>
  {/if}

  {#if allDone}
    <div class="finished" role="status">All done for today — well done!</div>
  {/if}

  {#if adding}
    <div class="card add-form">
      <label>
        Exercise name
        <input bind:value={newName} placeholder="e.g. Wall push-ups" />
      </label>
      <label>
        How many, or how long?
        <input bind:value={newAmount} placeholder="e.g. 10 times, or 15 minutes" />
      </label>
      <div class="form-btns">
        <button on:click={() => (adding = false)}>Cancel</button>
        <button class="btn-primary" on:click={addExercise}>Add it</button>
      </div>
    </div>
  {:else}
    <button class="wide" on:click={() => (adding = true)}>+ Add an exercise</button>
  {/if}
{/if}

{#if howToExercise}
  <HowTo
    exercise={howToExercise}
    origin={howToOrigin}
    on:close={() => (howToExercise = null)}
  />
{/if}

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  .routine-name {
    margin: 0 0 6px;
    font-size: var(--fs-card);
  }

  .tip {
    margin: 0 0 14px;
    color: var(--ink-muted);
    font-size: var(--fs-label);
  }

  .row-wrap {
    margin-bottom: var(--gap);
  }

  .ex-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  :global(.hold-card:has(.ex-row.done)) {
    background: var(--accent-soft);
    border-color: var(--accent);
  }

  .thumb {
    flex: 0 0 72px;
    height: 72px;
    background: var(--bg);
    border-radius: 14px;
    padding: 4px;
  }

  .ex-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    align-items: flex-start;
  }

  .ex-name {
    font-size: var(--fs-card);
    font-weight: 700;
  }

  .show-me {
    min-height: 48px;
    padding: 4px 16px;
    font-size: var(--fs-label);
    font-weight: 700;
    color: var(--accent);
    margin-top: 4px;
  }

  .all-done {
    width: 100%;
    margin: 8px 0 16px;
    min-height: 68px;
    font-size: var(--fs-card);
  }

  .finished {
    background: var(--accent);
    color: #fff;
    border-radius: var(--radius-card);
    padding: 16px;
    text-align: center;
    font-weight: 700;
    margin: 8px 0 16px;
    font-size: var(--fs-card);
  }

  .wide {
    width: 100%;
    color: var(--accent);
    font-weight: 700;
  }

  .add-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 10px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-weight: 700;
  }

  .form-btns {
    display: flex;
    gap: 10px;
  }

  .form-btns button {
    flex: 1;
  }
</style>
