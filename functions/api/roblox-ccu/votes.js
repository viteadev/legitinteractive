const UNIVERSE_ID = '6889096819';
const ROBLOX_VOTES_API = 'https://games.roblox.com/v1/games/votes';

export async function onRequest({ request }) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET' } });
  }

  try {
    const response = await fetch(`${ROBLOX_VOTES_API}?universeIds=${UNIVERSE_ID}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Roblox/WinInet' },
      signal: AbortSignal.timeout(10_000),
      cf: { cacheTtl: 30 },
    });
    if (!response.ok) throw new Error(`Roblox votes API returned HTTP ${response.status}`);
    const payload = await response.json();
    const vote = payload.data?.find((entry) => String(entry.id) === UNIVERSE_ID);
    if (!vote) throw new Error(`No votes found for universe ${UNIVERSE_ID}`);
    const up = Number(vote.upVotes) || 0;
    const down = Number(vote.downVotes) || 0;
    const total = up + down;
    const ratingPct = total > 0 ? (up / total) * 100 : null;
    return Response.json(
      { universeId: UNIVERSE_ID, upVotes: up, downVotes: down, ratingPct, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' } },
    );
  } catch (error) {
    console.error('Roblox votes proxy failed:', error);
    return Response.json(
      { error: 'Roblox votes request failed' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
