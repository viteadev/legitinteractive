const UNIVERSE_ID = '6889096819';
const ROBLOX_GAMES_API = 'https://games.roblox.com/v1/games';

async function fetchGames(url) {
  const response = await fetch(`${url}?universeIds=${UNIVERSE_ID}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'Roblox/WinInet' },
    signal: AbortSignal.timeout(10_000),
    cf: { cacheTtl: 15 },
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  const payload = await response.json();
  const game = payload.data?.find((entry) => String(entry.id) === UNIVERSE_ID);
  if (!game || !Number.isInteger(game.playing) || game.playing < 0) {
    throw new Error(`No player count found for universe ${UNIVERSE_ID}`);
  }
  return game;
}

export async function onRequest({ request }) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET' } });
  }

  try {
    const game = await fetchGames(ROBLOX_GAMES_API);
    return Response.json(
      {
        universeId: UNIVERSE_ID,
        playing: game.playing,
        visits: game.visits,
        favoritedCount: game.favoritedCount,
        updatedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'public, max-age=15, s-maxage=15' } },
    );
  } catch (error) {
    console.error('Roblox API proxy failed:', error);
    return Response.json(
      { error: 'Roblox request failed' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
