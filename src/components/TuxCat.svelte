<script>
  // Tux — the Fit Track mascot. Artwork lives in src/lib/tuxSvg.js so the
  // share card can draw the same cat onto a canvas.
  import { tuxInner } from '../lib/tuxSvg.js';

  export let accessory = 'bowtie';
  export let mood = 'normal';
  export let bob = false; // gentle idle bob (off under reduced motion)
</script>

<svg viewBox="0 0 200 230" class:bob aria-hidden="true">
  {@html tuxInner(accessory, mood)}
</svg>

<style>
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  svg.bob {
    animation: bob 3.2s ease-in-out infinite;
  }

  @keyframes bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  @media (prefers-reduced-motion: reduce) {
    svg.bob { animation: none; }
  }
</style>
