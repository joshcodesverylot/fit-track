<script>
  import { settings, updateSettings, go, logsVersion, showUndo } from '../lib/stores.js';
  import { SHOP, POINTS, computeBalance } from '../lib/points.js';
  import TuxCat from '../components/TuxCat.svelte';

  let earned = 0;
  let balance = 0;

  $: $logsVersion, $settings, load();

  async function load() {
    const b = await computeBalance($settings);
    earned = b.earned;
    balance = b.balance;
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
  <div class="cat"><TuxCat accessory={equipped} mood="happy" bob={true} /></div>
  <div class="balance">
    <span class="coin" aria-hidden="true">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M9.5 8.5 Q12 6.5 14 8.5 M9 12h6M9.5 15.5 Q12 17.5 14 15.5" /></svg>
    </span>
    <span><strong>{balance}</strong> Paw Points</span>
  </div>
  <p class="muted stage-note">
    Tux cheers you on. Ticking off meals and exercises earns Paw Points —
    spend them on outfits for him.
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
