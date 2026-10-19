(() => {
  if (new URLSearchParams(location.search).get('mode') !== 'story' || !navigator.wakeLock) return;
  let lock = null, pending = false, leaving = false;
  async function keepScreenAwake() {
    if (leaving || pending || (lock && !lock.released) || document.visibilityState !== 'visible') return;
    pending = true;
    try {
      const acquired = await navigator.wakeLock.request('screen');
      if (leaving || document.visibilityState !== 'visible') { await acquired.release(); return; }
      lock = acquired;
      acquired.addEventListener('release', () => { if (lock === acquired) lock = null; });
    } catch (_) {} finally { pending = false; }
  }
  window.releaseStoryWakeLock = () => {
    const held = lock; lock = null;
    if (held) held.release().catch(() => {});
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') keepScreenAwake();
    else window.releaseStoryWakeLock();
  });
  document.addEventListener('pointerdown', keepScreenAwake);
  document.addEventListener('play', keepScreenAwake, true);
  window.addEventListener('pageshow', () => { leaving = false; keepScreenAwake(); });
  window.addEventListener('pagehide', () => { leaving = true; window.releaseStoryWakeLock(); });
  keepScreenAwake();
})();