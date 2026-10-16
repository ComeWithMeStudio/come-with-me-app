(() => {
  const storyMode = new URLSearchParams(location.search).get('mode') === 'story';
  if (!storyMode || !('wakeLock' in navigator)) return;

  let lock = null;
  const keepScreenAwake = async () => {
    if (lock || document.visibilityState !== 'visible') return;
    try {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => { lock = null; });
    } catch (_) {
      lock = null;
    }
  };

  window.releaseStoryWakeLock = async () => {
    if (!lock) return;
    try { await lock.release(); } catch (_) {}
    lock = null;
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') keepScreenAwake();
  });
  document.addEventListener('pointerdown', keepScreenAwake, {once:true});
  window.addEventListener('pagehide', window.releaseStoryWakeLock);
  keepScreenAwake();
})();
