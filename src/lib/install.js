// Standalone (Home Screen) detection and persistent-storage request.

export function isStandalone() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export async function requestPersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      return await navigator.storage.persist();
    }
  } catch {
    /* not critical */
  }
  return false;
}
