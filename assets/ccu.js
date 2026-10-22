(() => {
  const output = document.getElementById('gameCcu');
  const status = document.getElementById('ccuUpdated');
  const visitsEl = document.getElementById('gameVisits');
  const favoritesEl = document.getElementById('gameRating');
  if (!output || !status) return;

  const universeId = '6889096819';
  const apiEndpoint = '/api/roblox-ccu';
  const fallbackEndpoint = `https://games.roproxy.com/v1/games?universeIds=${universeId}`;
  const refreshEveryMs = 60_000;
  const numberFormat = new Intl.NumberFormat();
  let lastCount = null;

  function formatCount(value) {
    if (!Number.isFinite(value)) return '—';
    if (value >= 1_000_000) {
      const val = value / 1_000_000;
      return val >= 10 ? `${Math.round(val)}M` : `${val.toFixed(val >= 10 ? 0 : 1)}M`;
    }
    if (value >= 1_000) {
      const val = value / 1_000;
      return val >= 100 ? `${Math.round(val)}K` : `${val.toFixed(val >= 10 ? 0 : 1)}K`;
    }
    return numberFormat.format(value);
  }

  async function fetchFromApiRoute() {
    const response = await fetch(apiEndpoint, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`The site's /api/roblox-ccu route returned ${response.status}; the API function is not deployed.`);
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `CCU route returned ${response.status}`);
    if (String(result.universeId) !== universeId || !Number.isInteger(result.playing) || result.playing < 0) {
      throw new Error('The CCU route returned an invalid Roblox response.');
    }
    return { playing: result.playing, visits: result.visits, favoritedCount: result.favoritedCount, updatedAt: result.updatedAt };
  }

  async function fetchFromFallback() {
    const response = await fetch(fallbackEndpoint, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`Roblox proxy returned ${response.status}`);
    const payload = await response.json();
    const game = payload.data?.find((entry) => String(entry.id) === universeId);
    if (!game || !Number.isInteger(game.playing) || game.playing < 0) {
      throw new Error(`No player count found for universe ${universeId}`);
    }
    return { playing: game.playing, visits: game.visits, favoritedCount: game.favoritedCount, updatedAt: new Date().toISOString() };
  }

  async function fetchPlayerCount() {
    try {
      return await fetchFromApiRoute();
    } catch (apiError) {
      console.warn('CCU API route unavailable, using direct Roblox fallback:', apiError);
      return fetchFromFallback();
    }
  }

  async function refreshPlayerCount() {
    try {
      const result = await fetchPlayerCount();

      if (lastCount !== result.playing) {
        output.textContent = numberFormat.format(result.playing);
        if (lastCount !== null && typeof output.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          output.animate(
            [{ transform: 'translateY(25%)', opacity: .25, filter: 'blur(4px)' }, { transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' }],
            { duration: 320, easing: 'cubic-bezier(.2,.75,.25,1)' },
          );
        }
        lastCount = result.playing;
      }
      if (visitsEl && Number.isFinite(result.visits)) visitsEl.textContent = formatCount(result.visits);
      if (favoritesEl && Number.isFinite(result.favoritedCount)) favoritesEl.textContent = formatCount(result.favoritedCount);
      status.textContent = 'LIVE';
    } catch (error) {
      status.textContent = 'OFFLINE';
      console.error('Roblox CCU request failed:', error);
    }
  }

  status.textContent = 'LIVE';
  refreshPlayerCount();
  window.setInterval(refreshPlayerCount, refreshEveryMs);
})();
