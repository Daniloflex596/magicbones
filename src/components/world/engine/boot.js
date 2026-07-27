/**
 * setupScrollRestoration(): al refresh riparti SEMPRE dall'alto (mai dalla
 * posizione di prima); il deep-link #sezione resta onorato solo alla PRIMA
 * navigazione, non ai reload.
 * Mettine anche una copia INLINE nell'<head> per battere il timing del
 * browser: <script>if('scrollRestoration'in history)history.scrollRestoration='manual'</script>
 */
export function setupScrollRestoration() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const navEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  const isReload = navEntry ? navEntry.type === 'reload' : false;
  if (isReload || !location.hash) window.scrollTo(0, 0);
  return { isReload };
}
