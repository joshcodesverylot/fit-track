<script>
  // Illustrated exercise figures: simple two-pose stick figures that
  // crossfade slowly between pose A and pose B. With Reduce Motion on,
  // only pose A is shown (handled in CSS).
  export let figure = 'walk';
  export let paused = false;

  // Each figure: static props, and two poses { head: [x,y], lines: [path…] }
  const CHAIR = ['M30 60 H58', 'M32 60 V90', 'M56 60 V90', 'M32 60 V34'];

  const FIGURES = {
    'shoulder-roll': {
      props: ['M20 92 H80'],
      a: { head: [50, 18], lines: ['M50 25 V58', 'M50 58 L42 90', 'M50 58 L58 90', 'M50 33 L38 52', 'M50 33 L62 52'] },
      b: { head: [50, 16], lines: ['M50 23 V58', 'M50 58 L42 90', 'M50 58 L58 90', 'M50 29 L36 44', 'M50 29 L64 44'] }
    },
    'reach-up': {
      props: ['M20 92 H80'],
      a: { head: [50, 18], lines: ['M50 25 V58', 'M50 58 L42 90', 'M50 58 L58 90', 'M50 33 L38 52', 'M50 33 L62 52'] },
      b: { head: [50, 18], lines: ['M50 25 V58', 'M50 58 L42 90', 'M50 58 L58 90', 'M50 31 L40 10', 'M50 31 L60 10'] }
    },
    'neck-turn': {
      props: ['M20 92 H80'],
      a: { head: [50, 18], lines: ['M50 25 V58', 'M50 58 L42 90', 'M50 58 L58 90', 'M50 33 L38 52', 'M50 33 L62 52', 'M44 18 L40 18'] },
      b: { head: [50, 18], lines: ['M50 25 V58', 'M50 58 L42 90', 'M50 58 L58 90', 'M50 33 L38 52', 'M50 33 L62 52', 'M56 18 L60 18'] }
    },
    'ankle-circle': {
      props: [...CHAIR],
      a: { head: [48, 24], lines: ['M48 31 L46 58', 'M46 58 L64 60', 'M64 60 L66 76', 'M66 76 L72 72', 'M48 36 L40 52'] },
      b: { head: [48, 24], lines: ['M48 31 L46 58', 'M46 58 L64 60', 'M64 60 L66 76', 'M66 76 L74 80', 'M48 36 L40 52'] }
    },
    twist: {
      props: [...CHAIR],
      a: { head: [48, 22], lines: ['M48 29 L46 58', 'M46 58 L64 60', 'M64 60 L64 88', 'M36 36 L60 32'] },
      b: { head: [48, 22], lines: ['M48 29 L46 58', 'M46 58 L64 60', 'M64 60 L64 88', 'M38 32 L58 38'] }
    },
    breathe: {
      props: [...CHAIR],
      a: { head: [48, 22], lines: ['M48 29 L46 58', 'M46 58 L64 60', 'M64 60 L64 88', 'M48 34 L38 48', 'M48 34 L58 48', 'M41 40 a9 9 0 1 0 14 0'] },
      b: { head: [48, 22], lines: ['M48 29 L46 58', 'M46 58 L64 60', 'M64 60 L64 88', 'M48 34 L36 46', 'M48 34 L60 46', 'M38 40 a13 13 0 1 0 20 0'] }
    },
    'sit-stand': {
      props: [...CHAIR, 'M20 92 H86'],
      a: { head: [48, 24], lines: ['M48 31 L46 58', 'M46 58 L64 60', 'M64 60 L64 88', 'M48 36 L62 44'] },
      b: { head: [62, 12], lines: ['M62 19 V52', 'M62 52 L56 88', 'M62 52 L68 88', 'M62 27 L52 42', 'M62 27 L72 42'] }
    },
    march: {
      props: [...CHAIR],
      a: { head: [48, 22], lines: ['M48 29 L46 56', 'M46 56 L62 58', 'M62 58 L62 86', 'M46 56 L58 44', 'M58 44 L58 60', 'M48 34 L40 50'] },
      b: { head: [48, 22], lines: ['M48 29 L46 56', 'M46 56 L58 44 L58 60', 'M46 56 L64 58', 'M64 58 L64 86', 'M48 34 L40 50'] }
    },
    'knee-ext': {
      props: [...CHAIR],
      a: { head: [48, 22], lines: ['M48 29 L46 58', 'M46 58 L62 60', 'M62 60 L62 88', 'M48 34 L40 50'] },
      b: { head: [48, 22], lines: ['M48 29 L46 58', 'M46 58 L62 60', 'M62 60 L84 58', 'M48 34 L40 50'] }
    },
    'heel-raise': {
      props: ['M20 92 H84', 'M72 40 V92', 'M72 42 H82'],
      a: { head: [48, 18], lines: ['M48 25 V58', 'M48 58 L44 90', 'M48 58 L54 90', 'M48 33 L70 44'] },
      b: { head: [48, 14], lines: ['M48 21 V54', 'M48 54 L44 86', 'M48 54 L54 86', 'M48 29 L70 44', 'M42 88 L46 86', 'M52 88 L56 86'] }
    },
    'side-bend': {
      props: [...CHAIR],
      a: { head: [42, 24], lines: ['M42 31 L46 58', 'M46 58 L64 60', 'M64 60 L64 88', 'M42 36 L34 54'] },
      b: { head: [56, 24], lines: ['M56 31 L46 58', 'M46 58 L64 60', 'M64 60 L64 88', 'M56 36 L64 54'] }
    },
    punch: {
      props: [...CHAIR],
      a: { head: [48, 22], lines: ['M48 29 L46 58', 'M46 58 L64 60', 'M64 60 L64 88', 'M48 34 L74 34', 'M48 36 L42 50'] },
      b: { head: [48, 22], lines: ['M48 29 L46 58', 'M46 58 L64 60', 'M64 60 L64 88', 'M48 34 L58 42', 'M48 36 L74 38'] }
    },
    walk: {
      props: ['M14 92 H86'],
      a: { head: [50, 16], lines: ['M50 23 V54', 'M50 54 L38 90', 'M50 54 L62 76 L64 90', 'M50 31 L62 44', 'M50 31 L38 44'] },
      b: { head: [52, 16], lines: ['M52 23 V54', 'M52 54 L64 90', 'M52 54 L40 76 L38 90', 'M52 31 L40 44', 'M52 31 L64 44'] }
    },
    'stretch-calf': {
      props: ['M14 92 H86', 'M24 20 V92'],
      a: { head: [46, 20], lines: ['M46 27 L42 56', 'M42 56 L40 90', 'M42 56 L66 90', 'M44 32 L26 34', 'M44 36 L26 42'] },
      b: { head: [44, 21], lines: ['M44 28 L40 56', 'M40 56 L38 90', 'M40 56 L68 90', 'M42 33 L26 34', 'M42 37 L26 42'] }
    }
  };

  $: f = FIGURES[figure] || FIGURES.walk;
</script>

<svg viewBox="0 0 100 100" class:paused aria-hidden="true">
  <g class="props">
    {#each f.props as d}
      <path {d} />
    {/each}
  </g>
  <g class="pose pose-a">
    <circle cx={f.a.head[0]} cy={f.a.head[1]} r="7" />
    {#each f.a.lines as d}
      <path {d} />
    {/each}
  </g>
  <g class="pose pose-b">
    <circle cx={f.b.head[0]} cy={f.b.head[1]} r="7" />
    {#each f.b.lines as d}
      <path {d} />
    {/each}
  </g>
</svg>

<style>
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  path,
  circle {
    fill: none;
    stroke: var(--accent);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .props path {
    stroke: var(--tick-empty);
    stroke-width: 3;
  }

  .pose-a {
    animation: fadeA 3.6s ease-in-out infinite;
  }

  .pose-b {
    animation: fadeB 3.6s ease-in-out infinite;
  }

  svg.paused .pose-a,
  svg.paused .pose-b {
    animation-play-state: paused;
  }

  @keyframes fadeA {
    0%, 40% { opacity: 1; }
    50%, 90% { opacity: 0; }
    100% { opacity: 1; }
  }

  @keyframes fadeB {
    0%, 40% { opacity: 0; }
    50%, 90% { opacity: 1; }
    100% { opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .pose-a { animation: none; opacity: 1; }
    .pose-b { animation: none; opacity: 0; }
  }
</style>
