const LTA_BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

/**
 * Serverless API handler to proxy LTA Datamall v3 BusArrival requests
 * Endpoint: GET /api/busarrival?BusStopCode=83139
 *
 * Headers required by LTA Datamall:
 *   AccountKey: <LTA_ACCOUNT_KEY>
 *   accept: application/json
 */
export default async function handler(req: any, res?: any): Promise<Response | void> {
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, AccountKey, x-account-key',
    'Content-Type': 'application/json',
  };

  // Helper to respond in both Node/Vercel and Edge standard runtimes
  const sendResponse = (statusCode: number, payload: any): Response | void => {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      if (typeof res.status === 'function') {
        const responseObj = res.status(statusCode);
        if (responseObj && typeof responseObj.json === 'function') {
          responseObj.json(payload);
          return;
        }
      }
      res.statusCode = statusCode;
      res.end(JSON.stringify(payload));
      return;
    }
    return new Response(JSON.stringify(payload, null, 2), {
      status: statusCode,
      headers: corsHeaders,
    });
  };

  // Handle CORS OPTIONS preflight
  const method = req?.method || (typeof req?.headers?.get === 'function' ? 'GET' : 'GET');
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

  // Parse Query Parameters
  let busStopCode = '83139';
  let serviceNo: string | undefined;

  if (req?.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      busStopCode = parsedUrl.searchParams.get('BusStopCode') || busStopCode;
      const sNo = parsedUrl.searchParams.get('ServiceNo');
      if (sNo) serviceNo = sNo;
    } catch {
      // ignore parsing error
    }
  } else if (req?.query) {
    const queryCode = req.query.BusStopCode;
    if (typeof queryCode === 'string') {
      busStopCode = queryCode;
    }
    const querySNo = req.query.ServiceNo;
    if (typeof querySNo === 'string') {
      serviceNo = querySNo;
    }
  }

  // Retrieve AccountKey from environment or incoming request header (do not hardcode any key)
  const incomingHeaders: Record<string, any> = req?.headers
    ? typeof req.headers.get === 'function'
      ? {
          accountkey: req.headers.get('accountkey') || req.headers.get('AccountKey'),
          'x-account-key': req.headers.get('x-account-key'),
        }
      : req.headers
    : {};

  const accountKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    incomingHeaders['accountkey'] ||
    incomingHeaders['x-account-key'] ||
    incomingHeaders['AccountKey'];

  if (!accountKey) {
    return sendResponse(401, {
      error: 'Unauthorized - Missing LTA DataMall AccountKey',
      message:
        'Please set the LTA_ACCOUNT_KEY environment variable in your deployment platform or provide the "AccountKey" header in your request.',
      endpointRequested: `GET ${LTA_BASE_URL}?BusStopCode=${busStopCode}`,
      documentation:
        'https://datamall.lta.gov.sg/content/datamall/en/dynamic-data.html',
      help: 'To obtain a key, apply for an LTA DataMall API account at https://datamall.lta.gov.sg/',
    });
  }

  // Construct target LTA Datamall v3 API URL
  const targetUrl = new URL(LTA_BASE_URL);
  targetUrl.searchParams.set('BusStopCode', busStopCode);
  if (serviceNo) {
    targetUrl.searchParams.set('ServiceNo', serviceNo);
  }

  try {
    const ltaResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        AccountKey: String(accountKey).trim(),
        accept: 'application/json',
      },
    });

    if (!ltaResponse.ok) {
      const errorText = await ltaResponse.text();
      let parsedError: any;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = { raw: errorText };
      }

      return sendResponse(ltaResponse.status, {
        error: 'LTA DataMall API Error',
        status: ltaResponse.status,
        statusText: ltaResponse.statusText,
        details: parsedError,
        requestedBusStopCode: busStopCode,
      });
    }

    const data = await ltaResponse.json();

    // Cache-Control headers for 15s transit freshness
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    }

    return sendResponse(200, data);
  } catch (error: any) {
    return sendResponse(502, {
      error: 'Bad Gateway - Failed to connect to LTA DataMall server',
      message: error?.message || 'Unknown network error',
      requestedUrl: targetUrl.toString(),
    });
  }
}
