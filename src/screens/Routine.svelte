<script>
  // The Exercise tab: a Hevy-style routines home. Quick start up top,
  // then routine cards with a Start button each.
  import { db, uid } from '../db/db.js';
  import { settings, go, updateSettings, showUndo, logsVersion } from '../lib/stores.js';
  import { todayStr } from '../lib/dates.js';

  let routines = []; // { routine, names, doneToday, total }
  let activeName = '';
  let activeDone = 0;
  let activeTotal = 0;
  let loaded = false;

  $: $logsVersion, $settings, load();

  async function load() {
    const all = await db.routines.toArray();
    const logs = await db.logs.where('date').equals(todayStr()).toArray();
    const out = [];
    for (const routine of all) {
      const exercises = (
        await Promise.all(routine.exerciseIds.map((id) => db.exercises.get(id)))
      ).filter(Boolean);
      const done = exercises.filter((ex) =>
        logs.some((l) => l.type === 'exercise' && l.refId === ex.id)
      ).length;
      out.push({
        routine,
        names: exercises.map((e) => e.name).join(', '),
        total: exercises.length,
        done
      });
      if (routine.id === $settings.activeRoutineId) {
        activeName = routine.name;
        activeDone = done;
        activeTotal = exercises.length;
      }
    }
    // mine first, then ready-made
    out.sort((a, b) => (a.routine.isPreset ? 1 : 0) - (b.routine.isPreset ? 1 : 0));
    routines = out;
    loaded = true;
  }

  async function startRoutine(routine) {
    if (routine.id !== $settings.activeRoutineId) {
      const prev = $settings.activeRoutineId;
      await updateSettings({ activeRoutineId: routine.id });
      showUndo(`Now using “${routine.name}” · Undo`, async () => {
        await updateSettings({ activeRoutineId: prev });
      });
    }
    go('player');
  }

  async function newRoutine() {
    const routine = { id: uid(), name: 'My routine', isPreset: 0, exerciseIds: [] };
    await db.routines.put(routine);
    await updateSettings({ activeRoutineId: routine.id });
    go('expicker');
  }
</script>

<header>
  <h1>Exercise</h1>
</header>

{#if loaded}
  {#if $settings.activeRoutineId && activeTotal}
    <section>
      <h2 class="section-title">Quick start</h2>
      <button class="btn-primary quick" on:click={() => go('player')}>
        {activeDone >= activeTotal
          ? `${activeName} — all done today`
          : `Continue ${activeName} · ${activeDone}/${activeTotal}`}
      </button>
    </section>
  {/if}

  <section>
    <div class="section-head">
      <h2 class="section-title">Routines</h2>
      <button class="new-btn" on:click={newRoutine}>+ New routine</button>
    </div>

    {#each routines as item (item.routine.id)}
      <div class="card routine-card" class:active={item.routine.id === $settings.activeRoutineId}>
        <div class="card-top">
          <span class="r-name">{item.routine.name}</span>
          {#if item.routine.isPreset}
            <span class="badge">Ready-made</span>
          {:else if item.routine.id === $settings.activeRoutineId}
            <span class="badge mine">In use</span>
          {/if}
        </div>
        <p class="names muted">{item.names || 'No exercises yet — add some'}</p>
        <button class="btn-primary start" on:click={() => startRoutine(item.routine)}>
          {item.routine.id === $settings.activeRoutineId ? 'Open routine' : 'Start routine'}
        </button>
      </div>
    {/each}
  </section>
{/if}

<style>
  header {
    margin-bottom: 14px;
  }

  section {
    margin-bottom: 20px;
  }

  .section-title {
    font-size: var(--fs-card);
    margin-bottom: 10px;
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;
  }

  .section-head .section-title {
    margin-bottom: 0;
  }

  .new-btn {
    min-height: 48px;
    padding: 6px 14px;
    font-size: var(--fs-label);
    font-weight: 700;
    color: var(--accent);
  }

  .quick {
    width: 100%;
    min-height: 64px;
    font-size: var(--fs-body);
  }

  .routine-card {
    margin-bottom: var(--gap);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .routine-card.active {
    border-color: var(--gold);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .r-name {
    font-size: var(--fs-card);
    font-weight: 700;
  }

  .badge {
    font-size: calc(14px * var(--scale));
    font-weight: 700;
    color: var(--ink-muted);
    background: var(--track);
    border-radius: 999px;
    padding: 5px 12px;
    flex-shrink: 0;
  }

  .badge.mine {
    color: var(--accent);
    background: var(--gold-soft);
  }

  .names {
    margin: 0;
    font-size: var(--fs-label);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-transform: capitalize;
  }

  .start {
    width: 100%;
    min-height: 56px;
  }
</style>
