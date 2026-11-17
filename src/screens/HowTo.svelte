<script>
  // Full-screen "how to" layer. Grows out of the exercise card it was
  // opened from (transform-origin = card centre), shrinks back on close.
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import ExerciseFigure from '../components/ExerciseFigure.svelte';
  import { speak, stopSpeaking, canSpeak } from '../lib/speech.js';

  export let exercise;
  export let origin = null; // DOMRect of the card that was pressed

  const dispatch = createEventDispatcher();
  let closing = false;
  let readingAloud = false;
  let figurePaused = false;
  let originStyle = '';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  onMount(() => {
    if (origin) {
      const cx = origin.left + origin.width / 2;
      const cy = origin.top + origin.height / 2;
      originStyle = `transform-origin: ${cx}px ${cy}px;`;
    }
    if (reduceMotion) figurePaused = true;
  });

  onDestroy(() => stopSpeaking());

  function close() {
    stopSpeaking();
    if (reduceMotion) {
      dispatch('close');
      return;
    }
    closing = true;
    setTimeout(() => dispatch('close'), 220);
  }

  function readAloud() {
    if (readingAloud) {
      stopSpeaking();
      readingAloud = false;
      return;
    }
    const text = [
      exercise.name + '.',
      ...(exercise.steps || []).map((s, i) => `Step ${i + 1}. ${s}`),
      exercise.safetyNote ? `Stay safe. ${exercise.safetyNote}` : ''
    ].join(' ');
    readingAloud = true;
    speak(text, () => (readingAloud = false));
  }
</script>

<div
  class="howto"
  class:closing
  class:instant={reduceMotion}
  style={originStyle}
  role="dialog"
  aria-label={`How to do ${exercise.name}`}
>
  <div class="inner">
    <div class="top">
      <h1>{exercise.name}</h1>
      <button class="close" on:click={close}>Close</button>
    </div>
    <p class="muted amount">
      {exercise.reps ? exercise.reps : ''}{exercise.minutes ? `${exercise.minutes} minutes` : ''}
    </p>

    <div class="figure-wrap">
      {#if exercise.media}
        <img
          class="media-img"
          src={exercise.media}
          alt={`How to do ${exercise.name}`}
          on:error={(e) => (e.currentTarget.style.display = 'none')}
        />
        <span class="attribution">© Gym visual — gymvisual.com</span>
      {:else}
        <ExerciseFigure figure={exercise.figure} paused={figurePaused} />
        {#if !reduceMotion}
          <button class="pause" on:click={() => (figurePaused = !figurePaused)}>
            {figurePaused ? 'Play' : 'Pause'}
          </button>
        {/if}
      {/if}
    </div>

    {#if canSpeak()}
      <button class="speak" class:on={readingAloud} on:click={readAloud}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l6 5V4L8 9zM17 8a5.5 5.5 0 0 1 0 8" /></svg>
        {readingAloud ? 'Stop reading' : 'Read it to me'}
      </button>
    {/if}

    <ol>
      {#each exercise.steps || [] as step, i}
        <li>
          <span class="num">{i + 1}</span>
          <span>{step}</span>
        </li>
      {/each}
    </ol>

    {#if exercise.safetyNote}
      <div class="safety">
        <strong>Stay safe</strong>
        <p>{exercise.safetyNote}</p>
      </div>
    {/if}

    {#if exercise.easierVersion}
      <div class="easier card">
        <strong>Easier version</strong>
        <p>{exercise.easierVersion}</p>
      </div>
    {/if}

    <button class="btn-primary done-btn" on:click={close}>Back to routine</button>
  </div>
</div>

<style>
  .howto {
    position: fixed;
    inset: 0;
    background: var(--bg);
    z-index: 50;
    overflow-y: auto;
    animation: grow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .howto.closing {
    animation: shrink 0.22s ease-in forwards;
  }

  .howto.instant {
    animation: none;
  }

  @keyframes grow {
    from { transform: scale(0.25); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes shrink {
    from { transform: scale(1); opacity: 1; }
    to { transform: scale(0.25); opacity: 0; }
  }

  .inner {
    max-width: 560px;
    margin: 0 auto;
    padding: calc(18px + env(safe-area-inset-top)) var(--pad-side)
      calc(30px + env(safe-area-inset-bottom));
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .close {
    flex-shrink: 0;
    font-weight: 700;
  }

  .amount {
    margin: 6px 0 14px;
    font-size: var(--fs-card);
  }

  .figure-wrap {
    position: relative;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-card);
    height: 240px;
    padding: 12px;
    margin-bottom: 14px;
  }

  .media-img {
    display: block;
    width: 180px;
    height: 180px;
    margin: 6px auto 0;
    border-radius: 14px;
    object-fit: contain;
    background: #fff;
  }

  .attribution {
    position: absolute;
    bottom: 6px;
    right: 12px;
    font-size: calc(12px * var(--scale));
    color: var(--ink-muted);
  }

  .pause {
    position: absolute;
    right: 10px;
    bottom: 10px;
    min-height: 50px;
    padding: 6px 16px;
    font-size: var(--fs-label);
  }

  .speak {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-weight: 700;
    color: var(--accent);
    margin-bottom: 16px;
  }

  .speak.on {
    background: var(--accent-soft);
    border-color: var(--accent);
  }

  .speak svg {
    width: 26px;
    height: 26px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linejoin: round;
  }

  ol {
    list-style: none;
    padding: 0;
    margin: 0 0 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  li {
    display: flex;
    gap: 12px;
    align-items: flex-start;
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

  .safety {
    background: var(--warn-bg);
    border: 2px solid var(--warn-border);
    border-radius: var(--radius-card);
    padding: 14px;
    margin-bottom: 14px;
  }

  .safety p,
  .easier p {
    margin: 6px 0 0;
  }

  .easier {
    margin-bottom: 18px;
  }

  .done-btn {
    width: 100%;
  }
</style>
