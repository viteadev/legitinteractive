const UNIVERSE_ID = '6889096819';
const SOURCES = [
  'https://games.roblox.com',
  'https://games.rotunnel.com',
  'https://games.ff-roproxy.com',
  'https://games.roproxy.com',
];

async function fetchGames(baseUrl) {
  const response = await fetch(`${baseUrl}/v1/games?universeIds=${UNIVERSE_ID}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'Roblox/WinInet' },
    signal: AbortSignal.timeout(10_000),
    cf: { cacheTtl: 15 },
  });
  if (!response.ok) throw new Error(`${baseUrl} returned HTTP ${response.status}`);
  const payload = await response.json();
  const game = payload.data?.find((entry) => String(entry.id) === UNIVERSE_ID);
  if (!game || !Number.isInteger(game.playing) || game.playing < 0) {
    throw new Error(`No player count found for universe ${UNIVERSE_ID} via ${baseUrl}`);
  }
  return game;
}

export async function onRequest({ request }) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET' } });
  }

  let lastError = null;
  for (const source of SOURCES) {
    try {
      const game = await fetchGames(source);
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
      lastError = error;
      console.warn(`Roblox API source ${source} failed:`, error);
    }
  }

  console.error('Roblox API proxy failed:', lastError);
  return Response.json(
    { error: 'Roblox request failed' },
    { status: 502, headers: { 'Cache-Control': 'no-store' } },
  );
}
