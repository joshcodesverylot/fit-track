<script>
  import { onMount } from 'svelte';
  import { route, settings, loadSettings, go } from './lib/stores.js';
  import { seedPresets } from './db/presets.js';
  import TabBar from './components/TabBar.svelte';
  import UndoBar from './components/UndoBar.svelte';
  import Today from './screens/Today.svelte';
  import AddPlan from './screens/AddPlan.svelte';
  import Routine from './screens/Routine.svelte';
  import Player from './screens/Player.svelte';
  import ExercisePicker from './screens/ExercisePicker.svelte';
  import WeekPlan from './screens/WeekPlan.svelte';
  import Progress from './screens/Progress.svelte';
  import QuickAddFood from './screens/QuickAddFood.svelte';
  import Onboarding from './screens/Onboarding.svelte';
  import Settings from './screens/Settings.svelte';
  import Rewards from './screens/Rewards.svelte';

  let ready = false;

  onMount(async () => {
    await seedPresets();
    const s = await loadSettings();
    if (!s.setupDone) {
      go('onboarding');
    }
    ready = true;
  });

  // Screens with the tab bar visible
  $: tabScreen = ['today', 'routine', 'food', 'progress'].includes($route.name);
</script>

{#if ready}
  <main class:with-tabs={tabScreen}>
    {#if $route.name === 'onboarding'}
      <Onboarding />
    {:else if $route.name === 'today'}
      <Today />
    {:else if $route.name === 'add'}
      <AddPlan />
    {:else if $route.name === 'routine'}
      <Routine />
    {:else if $route.name === 'player'}
      <Player />
    {:else if $route.name === 'expicker'}
      <ExercisePicker />
    {:else if $route.name === 'food'}
      <WeekPlan />
    {:else if $route.name === 'progress'}
      <Progress />
    {:else if $route.name === 'quickadd'}
      <QuickAddFood />
    {:else if $route.name === 'settings'}
      <Settings />
    {:else if $route.name === 'rewards'}
      <Rewards />
    {/if}
  </main>

  {#if tabScreen}
    <TabBar />
  {/if}

  <UndoBar />
{:else}
  <div class="loading">Fit Track…</div>
{/if}

<style>
  main {
    max-width: 560px;
    margin: 0 auto;
    padding: calc(16px + env(safe-area-inset-top)) var(--pad-side) 40px;
    min-height: 100vh;
  }

  main.with-tabs {
    padding-bottom: calc(var(--tab-h) + 40px + env(safe-area-inset-bottom));
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    font-size: var(--fs-big);
    color: var(--ink-muted);
  }
</style>
