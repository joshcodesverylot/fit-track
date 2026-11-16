// Tux's artwork as a plain SVG string (viewBox 0 0 200 230), shared by the
// TuxCat component and the canvas-rendered share card. Colors are fixed so
// the markup rasterizes identically outside the app's stylesheet.
const FUR = '#23242a';
const INK = '#221c0e';
const GOLD = '#d4a017';
const GOLD_DARK = '#8e6508';

export function tuxInner(accessory = 'bowtie', mood = 'normal') {
  const eyes =
    mood === 'happy'
      ? `<path d="M66 92 Q76 82 86 92" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" />
         <path d="M114 92 Q124 82 134 92" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" />`
      : `<ellipse cx="76" cy="92" rx="10.5" ry="12" fill="#b5c98a" />
         <ellipse cx="124" cy="92" rx="10.5" ry="12" fill="#b5c98a" />
         <ellipse cx="76" cy="93" rx="5" ry="7" fill="${INK}" />
         <ellipse cx="124" cy="93" rx="5" ry="7" fill="${INK}" />
         <circle cx="78.5" cy="88" r="2.2" fill="#fff" />
         <circle cx="126.5" cy="88" r="2.2" fill="#fff" />`;

  const smile =
    mood === 'happy'
      ? `<path d="M88 126 Q100 134 112 126" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" />`
      : '';

  const neck =
    accessory === 'scarf'
      ? `<rect x="64" y="132" width="72" height="15" rx="7" fill="#b03a2e" />
         <rect x="108" y="138" width="15" height="28" rx="7" fill="#c24a3e" />`
      : `<path d="M98 141 L76 130 L76 152 Z" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="2" />
         <path d="M102 141 L124 130 L124 152 Z" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="2" />
         <rect x="93" y="134" width="14" height="14" rx="4" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="2" />`;

  let head = '';
  if (accessory === 'tophat') {
    head = `<rect x="74" y="2" width="52" height="40" rx="5" fill="${FUR}" />
            <rect x="74" y="30" width="52" height="9" fill="${GOLD}" />
            <rect x="60" y="38" width="80" height="9" rx="4.5" fill="${FUR}" />`;
  } else if (accessory === 'crown') {
    head = `<path d="M72 50 L72 24 L86 38 L100 16 L114 38 L128 24 L128 50 Z" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="2.5" />
            <circle cx="72" cy="22" r="4" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="2" />
            <circle cx="100" cy="14" r="4" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="2" />
            <circle cx="128" cy="22" r="4" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="2" />`;
  } else if (accessory === 'chefhat') {
    head = `<circle cx="78" cy="22" r="14" fill="#fff" stroke="#e6dcc3" stroke-width="2" />
            <circle cx="100" cy="14" r="16" fill="#fff" stroke="#e6dcc3" stroke-width="2" />
            <circle cx="122" cy="22" r="14" fill="#fff" stroke="#e6dcc3" stroke-width="2" />
            <rect x="72" y="20" width="56" height="26" fill="#fff" stroke="#e6dcc3" stroke-width="2" />`;
  } else if (accessory === 'monocle') {
    head = `<circle cx="124" cy="92" r="16" fill="none" stroke="${GOLD}" stroke-width="3.5" />
            <path d="M124 108 C128 130 140 140 148 150" fill="none" stroke="${GOLD}" stroke-width="2.5" stroke-dasharray="1 6" stroke-linecap="round" />`;
  }

  return `
  <path d="M152 212 C188 206 194 172 176 156" fill="none" stroke="${FUR}" stroke-width="15" stroke-linecap="round" />
  <path d="M179 168 C184 164 186 160 176 156" fill="none" stroke="#fff" stroke-width="15" stroke-linecap="round" opacity="0.95" />
  <ellipse cx="100" cy="175" rx="56" ry="50" fill="${FUR}" />
  <ellipse cx="100" cy="174" rx="28" ry="36" fill="#fff" />
  <path d="M60 66 L48 24 L92 48 Z" fill="${FUR}" />
  <path d="M140 66 L152 24 L108 48 Z" fill="${FUR}" />
  <path d="M62 58 L56 36 L80 49 Z" fill="#e8a0a8" />
  <path d="M138 58 L144 36 L120 49 Z" fill="#e8a0a8" />
  <circle cx="100" cy="95" r="50" fill="${FUR}" />
  <path d="M100 56 C95 70 91 80 89 94 L111 94 C109 80 105 70 100 56 Z" fill="#fff" />
  <ellipse cx="100" cy="116" rx="31" ry="23" fill="#fff" />
  ${eyes}
  <path d="M93.5 109 L106.5 109 L100 117 Z" fill="#e8899a" />
  <path d="M100 117 Q100 122 100 122 M100 122 Q93 128 87 123 M100 122 Q107 128 113 123" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" />
  ${smile}
  <g stroke="#c9c2b0" stroke-width="2" stroke-linecap="round">
    <path d="M66 110 L38 104" /><path d="M67 118 L39 118" /><path d="M68 126 L42 132" />
    <path d="M134 110 L162 104" /><path d="M133 118 L161 118" /><path d="M132 126 L158 132" />
  </g>
  <ellipse cx="84" cy="219" rx="15" ry="9" fill="#fff" />
  <ellipse cx="116" cy="219" rx="15" ry="9" fill="#fff" />
  <g stroke="#d8d2c2" stroke-width="2" stroke-linecap="round">
    <path d="M80 214 L80 222" /><path d="M88 214 L88 222" />
    <path d="M112 214 L112 222" /><path d="M120 214 L120 222" />
  </g>
  ${neck}
  ${head}`;
}
