<script>
  import { undo, runUndo, dismissUndo } from '../lib/stores.js';
</script>

{#if $undo}
  <div class="undo-bar" role="status">
    <span>{$undo.message.replace(' · Undo', '')}</span>
    <button class="undo-btn" on:click={runUndo}>Undo</button>
    <button class="close-btn" aria-label="Dismiss" on:click={dismissUndo}>OK</button>
  </div>
{/if}

<style>
  .undo-bar {
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: calc(var(--tab-h) + 14px + env(safe-area-inset-bottom));
    background: var(--ink);
    color: #fff;
    border-radius: var(--radius-btn);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 10px 10px 18px;
    font-size: var(--fs-body);
    z-index: 60;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    animation: rise 0.25s ease-out;
    max-width: 520px;
    margin: 0 auto;
  }

  .undo-bar span {
    flex: 1;
  }

  .undo-btn {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
    font-weight: 700;
    min-height: 52px;
    padding: 6px 20px;
  }

  .close-btn {
    background: transparent;
    border-color: #555;
    color: #ddd;
    min-height: 52px;
    padding: 6px 16px;
  }

  @keyframes rise {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
</style>
