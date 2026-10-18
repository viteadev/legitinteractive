(() => {
  const output = document.getElementById('gameCcu');
  const status = document.getElementById('ccuUpdated');
  if (!output || !status) return;

  const endpoint = '/api/roblox-ccu';
  const refreshEveryMs = 60_000;
  const numberFormat = new Intl.NumberFormat();
  let lastCount = null;

  async function refreshPlayerCount() {
    try {
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(12_000),
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`The site's /api/roblox-ccu route returned ${response.status}; deploy the API function with the site.`);
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `CCU route returned ${response.status}`);
      if (String(result.universeId) !== '6889096819' || !Number.isInteger(result.playing) || result.playing < 0) {
        throw new Error('The CCU route returned an invalid Roblox response.');
      }

      if (lastCount !== result.playing) {
        output.textContent = numberFormat.format(result.playing);
        if (lastCount !== null && typeof output.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          output.animate(
            [{ transform: 'translateY(35%)', opacity: .25, filter: 'blur(4px)' }, { transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' }],
            { duration: 360, easing: 'cubic-bezier(.2,.75,.25,1)' },
          );
        }
        lastCount = result.playing;
      }
      status.textContent = `Live · updated ${new Date(result.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (error) {
      status.textContent = error.name === 'TimeoutError'
        ? 'Roblox is taking too long to respond; retrying shortly.'
        : error.message.includes('deploy the API function')
          ? 'CCU service is not deployed on this site yet.'
          : 'Live player count unavailable; retrying shortly.';
      console.error('Roblox CCU request failed:', error);
    }
  }

  refreshPlayerCount();
  window.setInterval(refreshPlayerCount, refreshEveryMs);
})();
