/**
 * Health check endpoint for LTA Datamall Serverless Proxy
 * GET /api/health
 */
export default async function handler(req: any, res?: any): Promise<Response | void> {
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, AccountKey, x-account-key',
    'Content-Type': 'application/json',
  };

  const method = req?.method || (typeof req?.headers?.get === 'function' ? 'GET' : 'GET');

  // Handle OPTIONS preflight
  if (method === 'OPTIONS') {
    if (res && typeof res.status === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey, x-account-key');
      res.status(204).end();
      return;
    }
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const hasKey = Boolean(
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY
  );

  const payload = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'LTA DataMall Bus Arrival Serverless Proxy',
    hasAccountKeyConfigured: hasKey,
    endpoints: {
      health: '/api/health',
      busArrival: '/api/busarrival?BusStopCode=83139',
    },
    message: hasKey
      ? 'LTA Datamall AccountKey is detected in environment variables.'
      : 'Ready. Set LTA_ACCOUNT_KEY in environment variables or pass AccountKey header with your requests.',
  };

  // Node/Vercel standard serverless runtime
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    if (typeof res.status === 'function') {
      const responseObj = res.status(200);
      if (responseObj && typeof responseObj.json === 'function') {
        responseObj.json(payload);
        return;
      }
    }
    res.statusCode = 200;
    res.end(JSON.stringify(payload));
    return;
  }

  // Edge standard Request/Response runtime
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: corsHeaders,
  });
}
