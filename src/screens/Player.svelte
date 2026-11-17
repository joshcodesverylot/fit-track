<script>
  // The routine "player": tick off each exercise in the active routine.
  import { db } from '../db/db.js';
  import {
    settings,
    go,
    logsVersion,
    toggleExerciseLog,
    logAllExercises
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

  function openHowTo(exercise, rect) {
    howToOrigin = rect || null;
    howToExercise = exercise;
  }

  function subtitle(ex) {
    const amount = ex.reps || (ex.minutes ? `${ex.minutes} minutes` : '');
    return [amount, ex.target].filter(Boolean).join(' · ');
  }

  $: doneCount = entries.filter((e) => e.ticked).length;
  $: allDone = entries.length > 0 && doneCount === entries.length;
</script>

<header>
  <button class="btn-quiet back" on:click={() => go('routine')}>‹ Routines</button>
  {#if routine}
    <h1>{routine.name}</h1>
    <p class="muted">{doneCount} of {entries.length} done today</p>
  {:else}
    <h1>Routine</h1>
  {/if}
</header>

{#if loaded && !routine}
  <div class="card">
    <p>No routine picked yet.</p>
    <button class="btn-primary" style="width:100%" on:click={() => go('routine')}>
      Pick a routine
    </button>
  </div>
{:else if loaded}
  {#if entries.length}
    <p class="tip muted">Tap an exercise to see how to do it — holding works too.</p>
  {/if}

  {#each entries as entry (entry.exercise.id)}
    <div class="row-wrap">
      <HoldCard on:hold={(e) => openHowTo(entry.exercise, e.detail.rect)}>
        <div class="ex-row" class:done={entry.ticked}>
          <button class="row-main" on:click={() => openHowTo(entry.exercise, null)}>
            <span class="thumb">
              {#if entry.exercise.media}
                <img
                  src={entry.exercise.media}
                  alt=""
                  loading="lazy"
                  on:error={(e) => (e.currentTarget.style.display = 'none')}
                />
              {:else}
                <ExerciseFigure figure={entry.exercise.figure} paused={true} />
              {/if}
            </span>
            <span class="ex-text">
              <span class="ex-name">{entry.exercise.name}</span>
              <span class="muted sub">{subtitle(entry.exercise)}</span>
            </span>
          </button>
          <TickButton
            ticked={entry.ticked}
            label={`${entry.ticked ? 'Unmark' : 'Mark'} ${entry.exercise.name} as done`}
            on:click={() => toggleExerciseLog(entry.exercise.id)}
          />
        </div>
      </HoldCard>
    </div>
  {/each}

  <button class="add-ex" on:click={() => go('expicker')}>+ Add exercise</button>

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
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    margin-bottom: 10px;
  }

  header p {
    margin: 0;
  }

  .back {
    padding-left: 0;
    min-height: 48px;
  }

  .tip {
    margin: 0 0 12px;
    font-size: var(--fs-label);
  }

  .row-wrap {
    margin-bottom: 10px;
  }

  .ex-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  :global(.hold-card:has(.ex-row.done)) {
    background: var(--accent-soft);
    border-color: var(--accent);
  }

  .row-main {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    border: none;
    background: transparent;
    padding: 0;
    text-align: left;
    min-height: 0;
    border-radius: 0;
  }

  .thumb {
    flex: 0 0 60px;
    height: 60px;
    background: var(--bg);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 12px;
  }

  .ex-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ex-name {
    font-size: var(--fs-card);
    font-weight: 700;
    text-transform: capitalize;
  }

  .sub {
    font-size: var(--fs-label);
    text-transform: capitalize;
  }

  .add-ex {
    width: 100%;
    min-height: 56px;
    color: var(--accent);
    font-weight: 700;
    border-style: dashed;
    margin: 4px 0 14px;
  }

  .all-done {
    width: 100%;
    margin-bottom: 16px;
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
    margin-bottom: 16px;
    font-size: var(--fs-card);
  }
</style>
