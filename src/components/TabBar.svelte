<script>
  import { route, go } from '../lib/stores.js';

  const tabs = [
    {
      name: 'today',
      label: 'Today',
      icon: 'M12 3 3 10v10h6v-6h6v6h6V10z' // house
    },
    {
      name: 'routine',
      label: 'Exercise',
      icon: 'M4 12h2m12 0h2M7 8v8m10-8v8M9 11h6v2H9z' // dumbbell-ish
    },
    {
      name: 'food',
      label: 'Food',
      icon: 'M7 3v7a2 2 0 0 0 2 2v9M7 3v5M11 3v5m5-4c-1.7 0-3 2-3 5s1.3 4 3 4v8z' // fork & knife
    },
    {
      name: 'progress',
      label: 'Progress',
      icon: 'M5 20V12m7 8V6m7 14v-9' // bars
    }
  ];
</script>

<nav aria-label="Main">
  {#each tabs as t}
    <button
      class:active={$route.name === t.name}
      aria-current={$route.name === t.name ? 'page' : undefined}
      on:click={() => go(t.name)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={t.icon} />
      </svg>
      <span>{t.label}</span>
    </button>
  {/each}
</nav>

<style>
  nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    background: var(--surface);
    border-top: 2px solid var(--border);
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 40;
  }

  button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    min-height: var(--tab-h);
    border: none;
    border-radius: 0;
    background: transparent;
    font-size: var(--fs-label);
    font-weight: 700;
    color: var(--ink-muted);
    padding: 6px 2px;
  }

  button.active {
    color: var(--accent);
    background: var(--accent-soft);
  }

  svg {
    width: 28px;
    height: 28px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
