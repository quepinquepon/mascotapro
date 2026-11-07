/**
 * Registro del Service Worker + limpieza de caches viejos
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Limpiar service workers viejos
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        // Solo desregistrar si el script es distinto (actualización)
      }
      const reg = await navigator.serviceWorker.register('./sw.js?v=1.2.0');
      console.log('[MascotaPro] SW registrado:', reg.scope);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[MascotaPro] Nueva versión disponible — recargá la página');
          }
        });
      });
    } catch (err) {
      console.log('[MascotaPro] SW error:', err);
    }
  });
}
