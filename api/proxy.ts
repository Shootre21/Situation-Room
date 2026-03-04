const ALLOWED_HOSTS = new Set([
  'opensky-network.org',
  'celestrak.org',
  'www.ndbc.noaa.gov',
  'api.reliefweb.int',
  'raw.githubusercontent.com',
  'secure.geonames.org',
  'api.weather.gov',
  'api.open-meteo.com',
  'archive-api.open-meteo.com',
  'api.tidesandcurrents.noaa.gov',
  'earthquake.usgs.gov',
]);

function isAllowedTarget(target: URL): boolean {
  return target.protocol === 'https:' && ALLOWED_HOSTS.has(target.hostname);
}

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const raw = typeof req.query.url === 'string' ? req.query.url : '';
  if (!raw) {
    res.status(400).json({ error: 'Missing url query parameter' });
    return;
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    res.status(400).json({ error: 'Invalid url query parameter' });
    return;
  }

  if (!isAllowedTarget(target)) {
    res.status(403).json({ error: 'Target not allowed' });
    return;
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'Situation-Room-Proxy/1.0',
        'Accept': req.headers.accept || '*/*',
      },
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.status(upstream.status).send(text);
  } catch (error) {
    res.status(502).json({
      error: 'Upstream request failed',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
