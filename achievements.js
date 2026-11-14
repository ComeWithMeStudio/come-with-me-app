/* Come With Me Studio — optional achievements foundation.
 * No network calls, cookies, names, birthdates, or child identifiers.
 * This module does not automatically attach to any game; integration is deliberate.
 */
(function (root) {
  "use strict";
  const KEY = "cwm-achievements-v1";
  const VERSION = 1;
  const SERIES = Object.freeze({
    firstLetters: {
      title: "Перші літери з Мімі",
      required: ["letter-a", "letter-b", "letter-v"],
      printable: false // Turn on only when a reviewed, original PDF exists.
    }
  });
  function empty() { return { version: VERSION, completed: {} }; }
  function clean(value) {
    if (!value || value.version !== VERSION || !value.completed || typeof value.completed !== "object") return empty();
    const completed = {};
    for (const [id, done] of Object.entries(value.completed)) {
      if (/^[a-z0-9][a-z0-9-]{0,79}$/.test(id) && done === true) completed[id] = true;
    }
    return { version: VERSION, completed };
  }
  function read(storage) {
    try { return clean(JSON.parse(storage.getItem(KEY))); }
    catch (_) { return empty(); }
  }
  function save(storage, state) {
    try { storage.setItem(KEY, JSON.stringify(clean(state))); return true; }
    catch (_) { return false; }
  }
  function complete(gameId, storage = root.localStorage) {
    if (typeof gameId !== "string" || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(gameId)) return false;
    const state = read(storage);
    state.completed[gameId] = true;
    return save(storage, state);
  }
  function status(storage = root.localStorage) {
    const state = read(storage);
    return {
      completedGames: Object.keys(state.completed),
      series: Object.fromEntries(Object.entries(SERIES).map(([id, series]) => [
        id, { title: series.title, total: series.required.length,
          completed: series.required.filter(game => state.completed[game]).length,
          unlocked: series.required.every(game => state.completed[game]),
          printable: series.printable }
      ]))
    };
  }
  function clear(storage = root.localStorage) {
    try { storage.removeItem(KEY); return true; } catch (_) { return false; }
  }
  root.CWMAchievements = Object.freeze({ complete, status, clear });
})(typeof window !== "undefined" ? window : globalThis);
