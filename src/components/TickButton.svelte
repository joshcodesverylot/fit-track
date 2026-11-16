<script>
  export let ticked = false;
  export let label = '';
</script>

<button
  class="tick"
  class:ticked
  role="checkbox"
  aria-checked={ticked}
  aria-label={label}
  on:click
>
  {#if ticked}
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  {/if}
</button>

<style>
  .tick {
    width: var(--tick);
    height: var(--tick);
    min-height: var(--tick);
    flex: 0 0 var(--tick);
    border-radius: 50%;
    border: 3px solid var(--tick-empty);
    background: var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.15s, border-color 0.15s, transform 0.1s;
  }

  .tick.ticked {
    background: var(--accent);
    border-color: var(--accent);
    animation: pop 0.25s ease-out;
  }

  svg {
    width: 60%;
    height: 60%;
    fill: none;
    stroke: #fff;
    stroke-width: 3.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  @keyframes pop {
    0% { transform: scale(0.85); }
    55% { transform: scale(1.08); }
    100% { transform: scale(1); }
  }
</style>
