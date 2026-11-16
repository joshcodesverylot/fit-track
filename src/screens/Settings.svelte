<script>
  import { settings, updateSettings, go, bumpLogs, loadSettings } from '../lib/stores.js';
  import { exportBackup, importBackup } from '../db/backup.js';
  import { shareDay } from '../lib/share.js';
  import TuxCat from '../components/TuxCat.svelte';

  let name = $settings.userName;
  let backupMsg = '';
  let fileInput;
  let shareMsg = '';
  let sharing = false;

  async function doShare() {
    shareMsg = '';
    sharing = true;
    try {
      const result = await shareDay($settings);
      if (result === 'shared') shareMsg = 'Shared!';
      else if (result === 'downloaded') shareMsg = 'The picture was saved — you can send it from your photos or files.';
    } catch {
      shareMsg = 'Something went wrong making the picture. Try again.';
    }
    sharing = false;
  }

  async function saveName() {
    await updateSettings({ userName: name.trim() });
  }

  async function doBackup() {
    backupMsg = '';
    const ok = await exportBackup();
    if (ok) backupMsg = 'Backup saved.';
  }

  async function onRestoreFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const sure = confirm(
      'Restoring a backup replaces everything in Fit Track with what is in the file. Continue?'
    );
    if (!sure) return;
    try {
      await importBackup(file);
      await loadSettings();
      name = $settings.userName;
      bumpLogs();
      backupMsg = 'Backup restored.';
    } catch (err) {
      backupMsg = err.message || 'That file could not be read.';
    }
  }
</script>

<header>
  <button class="btn-quiet back" on:click={() => go('today')}>‹ Back</button>
  <h1>Settings</h1>
</header>

<section class="card">
  <h2>Your name</h2>
  <input bind:value={name} on:blur={saveName} placeholder="Your first name" />
</section>

<section class="card">
  <h2>Text size</h2>
  <div class="sizes">
    {#each [['normal', 'Normal'], ['large', 'Large'], ['extra', 'Extra large']] as [val, label]}
      <button
        class:on={$settings.textSize === val}
        on:click={() => updateSettings({ textSize: val })}
      >{label}</button>
    {/each}
  </div>
</section>

<section class="card">
  <h2>Numbers</h2>
  <label class="toggle">
    <input
      type="checkbox"
      checked={$settings.showNutrition}
      on:change={(e) => updateSettings({ showNutrition: e.target.checked })}
    />
    <span>Show calories and protein</span>
  </label>
  <label class="toggle">
    <input
      type="checkbox"
      checked={$settings.showWater}
      on:change={(e) => updateSettings({ showWater: e.target.checked })}
    />
    <span>Show water glasses on Today</span>
  </label>
</section>

<section class="card share-card">
  <h2>Share my day</h2>
  <div class="share-row">
    <span class="share-cat"><TuxCat accessory={$settings.equippedAccessory || 'bowtie'} mood="happy" /></span>
    <p class="muted">
      Make a picture of what you've done today — meals, exercise, water and
      Paw Points, with Tux on it — to send to family.
    </p>
  </div>
  <button class="btn-primary wide" on:click={doShare} disabled={sharing}>
    {sharing ? 'Making the picture…' : 'Share my day'}
  </button>
  {#if shareMsg}
    <p class="msg" role="status">{shareMsg}</p>
  {/if}
</section>

<section class="card">
  <h2>Backup</h2>
  <p class="muted">
    Everything you put into Fit Track lives only on this phone. If the app is
    deleted or the phone is lost, a backup file is the only way to get it back.
    Save one every month or so.
  </p>
  <button class="btn-primary wide" on:click={doBackup}>Save a backup</button>
  <button class="wide" on:click={() => fileInput.click()}>Restore from backup</button>
  <input type="file" accept="application/json,.json" bind:this={fileInput} on:change={onRestoreFile} hidden />
  {#if backupMsg}
    <p class="msg" role="status">{backupMsg}</p>
  {/if}
</section>

<section class="card">
  <h2>About Fit Track</h2>
  <p class="muted">
    Fit Track keeps all of your information on your own phone. Nothing is sent
    anywhere: no account, no tracking, nothing shared. The sample meal plans and
    exercises are general suggestions only — check with your doctor,
    a dietitian or a physiotherapist about what is right for you.
  </p>
</section>

<style>
  header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 14px;
  }

  .back {
    padding-left: 0;
    min-height: 48px;
  }

  section.card {
    margin-bottom: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sizes {
    display: flex;
    gap: 8px;
  }

  .sizes button {
    flex: 1;
    font-weight: 700;
  }

  .sizes button.on {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent);
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .toggle input {
    width: 32px;
    height: 32px;
    min-height: 32px;
    accent-color: var(--accent);
    flex-shrink: 0;
  }

  .wide {
    width: 100%;
    font-weight: 700;
  }

  .share-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .share-cat {
    flex: 0 0 64px;
    height: 74px;
  }

  .share-row p {
    flex: 1;
  }

  .msg {
    margin: 0;
    font-weight: 700;
    color: var(--accent);
  }

  p {
    margin: 0;
  }
</style>
