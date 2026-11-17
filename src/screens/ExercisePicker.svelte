<script>
  // Hevy-style exercise picker, backed by the exercises-dataset
  // (github.com/hasaneyldrm/exercises-dataset). Data is MIT; images are
  // © Gym visual and hotlinked at 180×180 with attribution, per the
  // dataset's media terms.
  import { db, uid } from '../db/db.js';
  import { settings, go, updateSettings, showUndo, bumpLogs } from '../lib/stores.js';

  const MEDIA_BASE = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/';
  const BODY_PARTS = [
    'all', 'back', 'cardio', 'chest', 'lower arms', 'lower legs',
    'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'
  ];

  let library = null;
  let failed = false;
  let search = '';
  let part = 'all';
  let adding = false;

  load();
  async function load() {
    try {
      const res = await fetch('data/exercises.json');
      if (!res.ok) throw new Error();
      library = await res.json();
    } catch {
      failed = true;
    }
  }

  $: filtered = library
    ? library.filter(
        (e) =>
          (part === 'all' || e.bodyPart === part) &&
          (!search.trim() || e.name.toLowerCase().includes(search.trim().toLowerCase()))
      )
    : [];
  $: shown = filtered.slice(0, 60);

  async function add(entry) {
    if (adding) return;
    adding = true;
    try {
      const exercise = {
        id: uid(),
        name: entry.name,
        reps: '10 times',
        media: MEDIA_BASE + entry.img,
        steps: entry.steps || [],
        target: entry.target,
        equipment: entry.equipment,
        safetyNote: 'Take it slowly and stop if anything hurts.',
        easierVersion: ''
      };
      await db.exercises.put(exercise);

      let routine = $settings.activeRoutineId
        ? await db.routines.get($settings.activeRoutineId)
        : null;
      if (!routine) {
        routine = { id: uid(), name: 'My routine', isPreset: 0, exerciseIds: [] };
      } else if (routine.isPreset) {
        // never modify a preset — clone it into "mine" first
        routine = {
          id: uid(),
          name: routine.name + ' (mine)',
          isPreset: 0,
          exerciseIds: [...routine.exerciseIds]
        };
      }
      routine.exerciseIds = [...routine.exerciseIds, exercise.id];
      await db.routines.put(routine);
      const prevRoutineId = $settings.activeRoutineId;
      await updateSettings({ activeRoutineId: routine.id });
      bumpLogs();
      showUndo(`${entry.name} added · Undo`, async () => {
        routine.exerciseIds = routine.exerciseIds.filter((i) => i !== exercise.id);
        await db.routines.put(routine);
        await db.exercises.delete(exercise.id);
        await updateSettings({ activeRoutineId: prevRoutineId });
      });
      go('player');
    } finally {
      adding = false;
    }
  }
</script>

<header>
  <button class="btn-quiet back" on:click={() => go('player')}>‹ Back</button>
  <h1>Add exercise</h1>
</header>

<input
  class="search"
  bind:value={search}
  placeholder="Search exercises"
  aria-label="Search exercises"
/>

<div class="chips" role="tablist" aria-label="Body part">
  {#each BODY_PARTS as p}
    <button
      role="tab"
      aria-selected={part === p}
      class:on={part === p}
      on:click={() => (part = p)}
    >{p === 'all' ? 'All' : p}</button>
  {/each}
</div>

{#if failed}
  <div class="card">
    <p>The exercise library needs an internet connection the first time. Check your connection and try again.</p>
  </div>
{:else if !library}
  <p class="muted">Loading the exercise library…</p>
{:else}
  <p class="muted count">
    {filtered.length.toLocaleString()} exercises{filtered.length > shown.length ? ` · showing ${shown.length}, type to narrow down` : ''}
  </p>

  {#each shown as entry (entry.id)}
    <button class="card pick-row" on:click={() => add(entry)}>
      <span class="thumb">
        <img
          src={MEDIA_BASE + entry.img}
          alt=""
          loading="lazy"
          on:error={(e) => (e.currentTarget.style.visibility = 'hidden')}
        />
      </span>
      <span class="pick-text">
        <span class="pick-name">{entry.name}</span>
        <span class="muted sub">{entry.target} · {entry.equipment}</span>
      </span>
      <span class="plus" aria-hidden="true">+</span>
    </button>
  {/each}

  <p class="muted attribution">Exercise images © Gym visual — gymvisual.com</p>
{/if}

<style>
  header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    margin-bottom: 12px;
  }

  .back {
    padding-left: 0;
    min-height: 48px;
  }

  .search {
    margin-bottom: 10px;
  }

  .chips {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
    margin-bottom: 8px;
    -webkit-overflow-scrolling: touch;
  }

  .chips button {
    flex-shrink: 0;
    min-height: 48px;
    padding: 6px 16px;
    font-size: var(--fs-label);
    font-weight: 700;
    border-radius: 999px;
    text-transform: capitalize;
  }

  .chips button.on {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  .count {
    margin: 0 0 10px;
    font-size: var(--fs-label);
  }

  .pick-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    margin-bottom: 8px;
    padding: 10px 14px;
  }

  .thumb {
    flex: 0 0 52px;
    height: 52px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--track);
  }

  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .pick-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .pick-name {
    font-weight: 700;
    text-transform: capitalize;
  }

  .sub {
    font-size: var(--fs-label);
    text-transform: capitalize;
  }

  .plus {
    font-size: var(--fs-big);
    font-weight: 700;
    color: var(--accent);
    padding-right: 4px;
  }

  .attribution {
    margin: 14px 0 0;
    font-size: calc(14px * var(--scale));
    text-align: center;
  }
</style>
