<script>
  import { settings, updateSettings, go, logsVersion, showUndo } from '../lib/stores.js';
  import { SHOP, POINTS, computeBalance } from '../lib/points.js';
  import { computeDayProgress, moodForProgress } from '../lib/mood.js';
  import TuxCat from '../components/TuxCat.svelte';

  let earned = 0;
  let balance = 0;
  let baseMood = 'normal';

  $: $logsVersion, $settings, load();

  async function load() {
    const b = await computeBalance($settings);
    earned = b.earned;
    balance = b.balance;
    baseMood = moodForProgress(await computeDayProgress($settings));
  }

  // --- poke Tux: he gets sassy, licks the nearer paw, wipes the spot ---
  let catBox;
  let poking = false;
  let pawSide = null; // which real paw is lifted
  let pawX = 0, pawY = 0, pawR = 0, pawT = 0; // overlay paw position (viewBox units)
  let tongue = false;
  let sparkle = null;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function poke(e) {
    if (!catBox || poking) return;
    const rect = catBox.getBoundingClientRect();
    let tx = 100, ty = 110;
    if (e && e.clientX !== undefined && rect.width) {
      tx = ((e.clientX - rect.left) / rect.width) * 200;
      ty = ((e.clientY - rect.top) / rect.height) * 230;
    }
    tx = Math.min(165, Math.max(35, tx));
    ty = Math.min(215, Math.max(30, ty));
    runPoke(tx, ty);
  }

  async function runPoke(tx, ty) {
    poking = true;
    const side = tx < 100 ? 'left' : 'right';
    pawSide = side;
    const rest = side === 'left' ? { x: 84, y: 219 } : { x: 116, y: 219 };
    pawX = rest.x; pawY = rest.y; pawR = 0; pawT = 0;
    await sleep(40);

    // Sometimes he licks the paw first, sometimes he gets straight to it.
    if (Math.random() < 0.5) {
      // raise the paw to his mouth
      pawT = 320;
      pawR = side === 'left' ? -14 : 14;
      pawX = side === 'left' ? 90 : 110;
      pawY = 130;
      await sleep(350);

      // lick it (little bobs against the tongue)
      tongue = true;
      for (let i = 0; i < 3; i++) {
        pawT = 120; pawY = 123; await sleep(135);
        pawY = 132; await sleep(135);
      }
      tongue = false;
    }

    // wipe the spot that was touched
    pawT = 340; pawR = 0; pawX = tx; pawY = ty;
    await sleep(370);
    for (let i = 0; i < 3; i++) {
      pawT = 95; pawX = tx - 9; await sleep(105);
      pawX = tx + 9; await sleep(105);
    }
    pawT = 95; pawX = tx; await sleep(100);

    // all clean
    sparkle = { x: tx, y: ty };
    await sleep(430);
    sparkle = null;

    // paw back down
    pawT = 300; pawX = rest.x; pawY = rest.y; pawR = 0;
    await sleep(320);
    poking = false;
    pawSide = null;
  }

  $: unlocked = $settings.unlockedAccessories || ['bowtie'];
  $: equipped = $settings.equippedAccessory || 'bowtie';

  async function buy(item) {
    if (balance < item.price) return;
    const prevSpent = $settings.coinsSpent || 0;
    const prevUnlocked = [...unlocked];
    const prevEquipped = equipped;
    await updateSettings({
      coinsSpent: prevSpent + item.price,
      unlockedAccessories: [...unlocked, item.id],
      equippedAccessory: item.id
    });
    showUndo(`${item.name} unlocked · Undo`, async () => {
      await updateSettings({
        coinsSpent: prevSpent,
        unlockedAccessories: prevUnlocked,
        equippedAccessory: prevEquipped
      });
    });
  }

  async function equip(item) {
    await updateSettings({ equippedAccessory: item.id });
  }
</script>

<header>
  <button class="btn-quiet back" on:click={() => go('today')}>‹ Back</button>
  <h1>Tux's corner</h1>
</header>

<div class="stage card">
  <div
    class="cat"
    bind:this={catBox}
    role="button"
    tabindex="0"
    aria-label="Give Tux a pat"
    on:click={poke}
    on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(null); } }}
  >
    <TuxCat
      accessory={equipped}
      mood={poking ? 'sassy' : baseMood}
      bob={!poking && baseMood === 'happy'}
      hidePaw={pawSide}
    />
    {#if poking || sparkle}
      <svg class="paw-layer" viewBox="0 0 200 230" aria-hidden="true">
        {#if tongue}
          <ellipse class="tongue" cx="100" cy="123" rx="5" ry="8" fill="#e8899a" />
        {/if}
        {#if sparkle}
          <g transform={`translate(${sparkle.x} ${sparkle.y})`}>
            <path class="sp" d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" fill="#edab09" />
            <path class="sp" transform="translate(14 -10) scale(0.5)" d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" fill="#edab09" />
            <path class="sp" transform="translate(-13 8) scale(0.45)" d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" fill="#edab09" />
          </g>
        {/if}
        {#if poking}
          <g
            class="pawg"
            style={`transform: translate(${pawX}px, ${pawY}px) rotate(${pawR}deg); transition: transform ${pawT}ms cubic-bezier(0.3, 0.8, 0.3, 1);`}
          >
            <ellipse rx="15" ry="10" fill="#fff" stroke="#d8d2c2" stroke-width="2" />
            <path d="M-6 -7 L-6 3 M0 -9 L0 3 M6 -7 L6 3" stroke="#d8d2c2" stroke-width="2" stroke-linecap="round" fill="none" />
          </g>
        {/if}
      </svg>
    {/if}
  </div>
  <div class="balance">
    <span class="coin" aria-hidden="true">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M9.5 8.5 Q12 6.5 14 8.5 M9 12h6M9.5 15.5 Q12 17.5 14 15.5" /></svg>
    </span>
    <span><strong>{balance}</strong> Paw Points</span>
  </div>
  <p class="muted stage-note">
    Tux cheers you on — the more you tick off today, the happier he looks.
    Ticking things off earns Paw Points to spend on outfits for him.
    Try giving him a pat.
  </p>
</div>

<section class="card earn">
  <h2>How to earn</h2>
  <ul>
    <li><strong>+{POINTS.meal}</strong> for each planned meal you tick</li>
    <li><strong>+{POINTS.exercise}</strong> for each exercise you do</li>
    <li><strong>+{POINTS.quick}</strong> for honestly logging other food</li>
    <li><strong>+{POINTS.water}</strong> per glass of water</li>
    <li><strong>+{POINTS.comboBonus}</strong> bonus on days with a meal and an exercise</li>
    <li><strong>+{POINTS.proteinGoal}</strong> for reaching your protein goal ({$settings.proteinGoal || 60} g)</li>
  </ul>
  <p class="muted">Earned so far: {earned} points</p>
</section>

<h2 class="shop-title">Wardrobe</h2>
{#each SHOP as item}
  {@const owned = unlocked.includes(item.id)}
  <div class="card shop-row" class:owned>
    <div class="preview"><TuxCat accessory={item.id} /></div>
    <div class="shop-text">
      <strong>{item.name}</strong>
      <span class="muted">{item.blurb}</span>
      {#if !owned}
        <span class="price" class:cant={balance < item.price}>
          {item.price} points
        </span>
      {/if}
    </div>
    {#if owned && equipped === item.id}
      <span class="wearing">Wearing</span>
    {:else if owned}
      <button class="shop-btn" on:click={() => equip(item)}>Wear it</button>
    {:else}
      <button
        class="shop-btn btn-primary"
        disabled={balance < item.price}
        on:click={() => buy(item)}
      >Unlock</button>
    {/if}
  </div>
{/each}

<style>
  header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 12px;
  }

  .back {
    padding-left: 0;
    min-height: 48px;
  }

  .stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    background: var(--gold-soft);
    border-color: var(--gold);
    margin-bottom: 14px;
  }

  .cat {
    width: 170px;
    height: 195px;
    position: relative;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    border-radius: 16px;
  }

  .cat:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 4px;
  }

  .paw-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
  }

  .pawg {
    will-change: transform;
  }

  .tongue {
    transform-box: fill-box;
    transform-origin: 50% 0%;
    animation: lick 0.27s ease-in-out infinite alternate;
  }

  @keyframes lick {
    from { transform: scaleY(0.55); }
    to { transform: scaleY(1.15); }
  }

  .sp {
    animation: spark 0.45s ease-out forwards;
  }

  @keyframes spark {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  .balance {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: var(--fs-card);
  }

  .coin svg {
    width: 34px;
    height: 34px;
    fill: var(--gold);
    stroke: var(--accent);
    stroke-width: 1.6;
  }

  .coin svg path {
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.8;
    stroke-linecap: round;
  }

  .stage-note {
    text-align: center;
    margin: 0;
  }

  .earn {
    margin-bottom: 18px;
  }

  .earn ul {
    margin: 8px 0;
    padding-left: 4px;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .earn p {
    margin: 4px 0 0;
  }

  .shop-title {
    margin-bottom: 10px;
  }

  .shop-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: var(--gap);
  }

  .shop-row.owned {
    border-color: var(--gold);
  }

  .preview {
    flex: 0 0 76px;
    height: 88px;
    background: var(--bg);
    border-radius: 14px;
    padding: 4px;
  }

  .shop-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .price {
    font-weight: 700;
    color: var(--accent);
  }

  .price.cant {
    color: var(--ink-muted);
  }

  .shop-btn {
    flex-shrink: 0;
    min-height: 56px;
    font-weight: 700;
  }

  .shop-btn:disabled {
    opacity: 0.45;
  }

  .wearing {
    font-weight: 700;
    color: var(--accent);
    background: var(--gold-soft);
    border: 2px solid var(--gold);
    border-radius: var(--radius-btn);
    padding: 12px 14px;
  }
</style>
