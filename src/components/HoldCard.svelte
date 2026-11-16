<script>
  // Press-and-hold logic from the implementation notes:
  // pointerdown starts a 500 ms timer; pointerup/leave/cancel clear it.
  // When it fires we set `held` and dispatch 'hold'. Any click that follows
  // the hold is swallowed in the capture phase so a hold never also ticks.
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  export let holdEnabled = true;

  let timer = null;
  let held = false;
  let holding = false;
  let el;

  function down(e) {
    if (!holdEnabled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    held = false;
    holding = true;
    timer = setTimeout(() => {
      held = true;
      holding = false;
      dispatch('hold', { rect: el ? el.getBoundingClientRect() : null });
    }, 500);
  }

  function clear() {
    holding = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function captureClick(e) {
    if (held) {
      e.stopPropagation();
      e.preventDefault();
      held = false;
    }
  }
</script>

<div
  bind:this={el}
  class="hold-card card"
  class:holding
  on:pointerdown={down}
  on:pointerup={clear}
  on:pointerleave={clear}
  on:pointercancel={clear}
  on:contextmenu|preventDefault
  on:click|capture={captureClick}
>
  <slot />
</div>

<style>
  .hold-card {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
    transition: transform 0.5s, border-color 0.5s;
  }

  .hold-card.holding {
    transform: scale(0.97);
    border-color: var(--accent);
  }
</style>
