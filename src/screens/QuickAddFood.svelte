<script>
  import { db, uid } from '../db/db.js';
  import { go, addQuickLog } from '../lib/stores.js';
  import { slotFromTime, SLOT_KEYS, SLOT_NAMES } from '../lib/dates.js';

  let calories = '';
  let name = '';
  let slot = slotFromTime();
  let moreDetail = false;
  let protein = '';
  let carbs = '';
  let fat = '';
  let saveForNextTime = false;
  let error = '';

  // Starting values for the size shortcuts — to be checked by a dietitian.
  const SIZES = [
    { label: 'Small snack', value: 150 },
    { label: 'Light meal', value: 350 },
    { label: 'Big meal', value: 600 }
  ];

  async function save() {
    const cal = Number(calories);
    if (!cal || cal <= 0) {
      error = 'Please put in the calories — a rough guess is fine.';
      return;
    }
    await addQuickLog({
      name: name.trim(),
      calories: cal,
      protein: protein ? Number(protein) : undefined,
      carbs: carbs ? Number(carbs) : undefined,
      fat: fat ? Number(fat) : undefined,
      slot
    });
    if (saveForNextTime && name.trim()) {
      await db.foodItems.put({
        id: uid(),
        name: name.trim(),
        calories: cal,
        protein: protein ? Number(protein) : undefined
      });
      await db.meals.put({
        id: uid(),
        name: name.trim(),
        itemIds: []
      });
    }
    go('today');
  }
</script>

<header>
  <button class="btn-quiet back" on:click={() => go('today')}>‹ Back</button>
  <h1>Add food</h1>
  <p class="muted">For food that wasn't on the plan. A rough guess is fine.</p>
</header>

<label class="cal-label">
  Calories
  <input
    class="cal-input"
    bind:value={calories}
    inputmode="numeric"
    pattern="[0-9]*"
    placeholder="0"
    aria-describedby="cal-help"
  />
</label>
<p class="muted" id="cal-help">Not sure? Tap one of these to start with:</p>

<div class="sizes">
  {#each SIZES as s}
    <button
      class:on={Number(calories) === s.value}
      on:click={() => { calories = String(s.value); error = ''; }}
    >
      {s.label}
      <span class="muted">about {s.value}</span>
    </button>
  {/each}
</div>

{#if error}
  <p class="error" role="alert">{error}</p>
{/if}

<label>
  What was it? (you can leave this out)
  <input bind:value={name} placeholder="e.g. Lunch at the club" />
</label>

<fieldset>
  <legend>Which meal was it?</legend>
  <div class="slots">
    {#each SLOT_KEYS as s}
      <button class:on={slot === s} on:click={() => (slot = s)}>{SLOT_NAMES[s]}</button>
    {/each}
  </div>
</fieldset>

{#if !moreDetail}
  <button class="more" on:click={() => (moreDetail = true)}>Add more detail</button>
{:else}
  <div class="detail">
    <label>Protein (g)<input bind:value={protein} inputmode="numeric" /></label>
    <label>Carbs (g)<input bind:value={carbs} inputmode="numeric" /></label>
    <label>Fat (g)<input bind:value={fat} inputmode="numeric" /></label>
  </div>
{/if}

<label class="remember">
  <input type="checkbox" bind:checked={saveForNextTime} />
  <span>Save this food for next time</span>
</label>

<button class="btn-primary save" on:click={save}>Save</button>

<style>
  header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 16px;
  }

  header p {
    margin: 2px 0 0;
  }

  .back {
    padding-left: 0;
    min-height: 48px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-weight: 700;
    margin-bottom: 14px;
  }

  .cal-label {
    margin-bottom: 6px;
  }

  .cal-input {
    font-size: calc(44px * var(--scale));
    font-weight: 700;
    text-align: center;
    min-height: 84px;
  }

  #cal-help {
    margin: 0 0 8px;
  }

  .sizes {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .sizes button {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: center;
    font-weight: 700;
    min-height: 74px;
    padding: 8px 4px;
    font-size: var(--fs-label);
  }

  .sizes button.on {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent);
  }

  .error {
    color: var(--danger);
    font-weight: 700;
    background: var(--danger-soft);
    border-radius: var(--radius-btn);
    padding: 10px 14px;
  }

  fieldset {
    border: none;
    padding: 0;
    margin: 0 0 14px;
  }

  legend {
    font-weight: 700;
    margin-bottom: 6px;
    padding: 0;
  }

  .slots {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .slots button {
    font-weight: 700;
  }

  .slots button.on {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent);
  }

  .more {
    width: 100%;
    color: var(--accent);
    font-weight: 700;
    margin-bottom: 14px;
  }

  .detail {
    display: flex;
    gap: 8px;
  }

  .detail label {
    flex: 1;
  }

  .remember {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    font-weight: 400;
  }

  .remember input {
    width: 32px;
    height: 32px;
    min-height: 32px;
    accent-color: var(--accent);
    flex-shrink: 0;
  }

  .save {
    width: 100%;
    min-height: 68px;
    font-size: var(--fs-card);
    margin-top: 6px;
  }
</style>
