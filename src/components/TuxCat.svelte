<script>
  // Tux — the Fit Track mascot. Artwork lives in src/lib/tuxSvg.js so the
  // share card can draw the same cat onto a canvas.
  import { tuxInner } from '../lib/tuxSvg.js';

  export let accessory = 'bowtie';
  export let mood = 'normal';
  export let bob = false; // gentle idle bob (off under reduced motion)
  export let blink = true; // periodic eye blinks (open-eye moods only)
  export let hidePaw = null; // 'left' | 'right' | null
</script>

<svg viewBox="0 0 200 230" class:bob class:blink aria-hidden="true">
  {@html tuxInner(accessory, mood, { hidePaw })}
</svg>

<style>
  svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }

  svg.bob {
    animation: bob 3.2s ease-in-out infinite;
  }

  svg.blink :global(.lids) {
    animation: blink 4.6s linear infinite;
  }

  @keyframes bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  @keyframes blink {
    0%, 93%, 100% { opacity: 0; }
    94.5%, 97.5% { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    svg.bob { animation: none; }
    svg.blink :global(.lids) { animation: none; opacity: 0; }
  }
</style>
