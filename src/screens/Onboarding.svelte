<script>
  import { db } from '../db/db.js';
  import { go, updateSettings, applyTextSize } from '../lib/stores.js';
  import { isStandalone, isIOS, requestPersistentStorage } from '../lib/install.js';
  import TuxCat from '../components/TuxCat.svelte';

  // Steps: install (iOS Safari only) -> name -> nutrition -> textsize -> plans
  let step = isIOS() && !isStandalone() ? 'install' : 'name';

  let name = '';
  let showNutrition = null;
  let textSize = 'normal';
  let weekPlans = [];
  let routines = [];
  let chosenPlan = null;
  let chosenRoutine = null;

  loadPresets();
  async function loadPresets() {
    weekPlans = await db.weekPlans.where('isPreset').equals(1).toArray();
    routines = await db.routines.where('isPreset').equals(1).toArray();
  }

  function pickSize(size) {
    textSize = size;
    applyTextSize(size); // live preview
  }

  async function finish() {
    await updateSettings({
      userName: name.trim(),
      showNutrition: showNutrition === true,
      textSize,
      activeWeekPlanId: chosenPlan,
      activeRoutineId: chosenRoutine,
      setupDone: true,
      installedAt: new Date().toISOString()
    });
    await requestPersistentStorage();
    go('today');
  }
</script>

<div class="onboard">
  {#if step === 'install'}
    <h1>Welcome to Fit Track</h1>
    <p>Before anything else, let's put Fit Track on your Home Screen so it opens like a normal app and keeps your information safe.</p>
    <ol class="guide">
      <li><span class="num">1</span><span>Tap the <strong>Share</strong> button at the bottom of Safari <svg class="share-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M5 11v9h14v-9" /></svg></span></li>
      <li><span class="num">2</span><span>Scroll down and tap <strong>Add to Home Screen</strong></span></li>
      <li><span class="num">3</span><span>Tap <strong>Add</strong>, then open <strong>Fit Track</strong> from your Home Screen</span></li>
    </ol>
    <p class="muted">A family member can help with this step.</p>
    <button class="btn-quiet" on:click={() => (step = 'name')}>I'll do this later — continue anyway</button>
  {:else if step === 'name'}
    <div class="mascot"><TuxCat mood="happy" bob={true} /></div>
    <h1>Welcome!</h1>
    <p>This is <strong>Tux</strong>. He'll cheer you on as you tick things off — and every tick earns Paw Points to spend on outfits for him.</p>
    <p>What should we call you?</p>
    <input bind:value={name} placeholder="Your first name" autocomplete="given-name" />
    <button class="btn-primary next" on:click={() => (step = 'nutrition')}>Continue</button>
  {:else if step === 'nutrition'}
    <h1>Counting calories?</h1>
    <p>Would you like to see calories and protein, or just tick things off?</p>
    <button
      class="choice"
      class:on={showNutrition === false}
      on:click={() => (showNutrition = false)}
    >
      <strong>Just tick things off</strong>
      <span class="muted">No numbers anywhere</span>
    </button>
    <button
      class="choice"
      class:on={showNutrition === true}
      on:click={() => (showNutrition = true)}
    >
      <strong>Show me the numbers</strong>
      <span class="muted">Calories and protein on meals and totals</span>
    </button>
    <button
      class="btn-primary next"
      disabled={showNutrition === null}
      on:click={() => (step = 'textsize')}
    >Continue</button>
  {:else if step === 'textsize'}
    <h1>Text size</h1>
    <p>Pick the size that is easiest to read. You can change it later.</p>
    <button class="choice" class:on={textSize === 'normal'} on:click={() => pickSize('normal')}>
      <strong>Normal</strong>
    </button>
    <button class="choice" class:on={textSize === 'large'} on:click={() => pickSize('large')}>
      <strong>Large</strong>
    </button>
    <button class="choice" class:on={textSize === 'extra'} on:click={() => pickSize('extra')}>
      <strong>Extra large</strong>
    </button>
    <button class="btn-primary next" on:click={() => (step = 'plans')}>Continue</button>
  {:else if step === 'plans'}
    <h1>Starting plans</h1>
    <p>Pick a food plan and an exercise routine to start with. You can change or copy them any time.</p>

    <h2>Food</h2>
    {#each weekPlans as p}
      <button class="choice" class:on={chosenPlan === p.id} on:click={() => (chosenPlan = p.id)}>
        <strong>{p.name}</strong>
      </button>
    {/each}

    <h2>Exercise</h2>
    {#each routines as r}
      <button class="choice" class:on={chosenRoutine === r.id} on:click={() => (chosenRoutine = r.id)}>
        <strong>{r.name}</strong>
        <span class="muted">{r.exerciseIds.length} gentle exercises</span>
      </button>
    {/each}

    <button class="btn-primary next" on:click={finish}>
      {name.trim() ? `Let's go, ${name.trim()}` : "Let's go"}
    </button>
    <button class="btn-quiet" on:click={finish}>Skip for now</button>
  {/if}
</div>

<style>
  .onboard {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-top: 6vh;
  }

  .mascot {
    width: 150px;
    height: 172px;
    align-self: center;
  }

  p {
    margin: 0;
  }

  .guide {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .guide li {
    display: flex;
    gap: 12px;
    align-items: center;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-card);
    padding: 14px;
  }

  .num {
    flex: 0 0 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .share-icon {
    width: 26px;
    height: 26px;
    vertical-align: middle;
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .choice {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    text-align: left;
    min-height: 70px;
    width: 100%;
  }

  .choice.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  .next {
    margin-top: 10px;
    min-height: 68px;
    font-size: var(--fs-card);
  }

  .next:disabled {
    opacity: 0.5;
  }

  h2 {
    margin-top: 8px;
  }
</style>
