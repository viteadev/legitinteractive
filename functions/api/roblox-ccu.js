const UNIVERSE_ID = '6889096819';
const ROBLOX_GAMES_API = 'https://games.roblox.com/v1/games';

export async function onRequest({ request }) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET' } });
  }

  try {
    const upstream = await fetch(`${ROBLOX_GAMES_API}?universeIds=${UNIVERSE_ID}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
      cf: { cacheTtl: 15 },
    });
    if (!upstream.ok) throw new Error(`Roblox games API returned HTTP ${upstream.status}`);
    const payload = await upstream.json();
    const game = payload.data?.find((entry) => String(entry.id) === UNIVERSE_ID);
    if (!game || !Number.isInteger(game.playing) || game.playing < 0) {
      throw new Error(`No player count found for universe ${UNIVERSE_ID}`);
    }

    return Response.json(
      { universeId: UNIVERSE_ID, playing: game.playing, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, max-age=15, s-maxage=15' } },
    );
  } catch (error) {
    console.error('Roblox CCU proxy failed:', error);
    return Response.json(
      { error: 'Roblox player count request failed' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
