// Get historical market data from IBKR
const { ibkrRequest } = require('./ibkr-auth');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };

  const params = event.queryStringParameters || {};
  const conid = params.conid;
  const period = params.period || '5y'; // e.g., 1d, 1w, 1m, 3m, 6m, 1y, 5y
  const bar = params.bar || '1d'; // e.g., 1min, 5min, 1h, 1d, 1w, 1m

  if (!conid) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing conid parameter' }) };
  }

  try {
    var data = await ibkrRequest('/iserver/marketdata/history', {
      conid: conid,
      period: period,
      bar: bar,
      outsideRth: 'false'
    });

    // Normalize to consistent format
    var result = { dates: [], prices: [], volumes: [] };
    if (data && data.data && Array.isArray(data.data)) {
      data.data.forEach(function(bar) {
        // bar.t is timestamp in ms, bar.c is close, bar.o is open, bar.h is high, bar.l is low, bar.v is volume
        result.dates.push(bar.t);
        result.prices.push(bar.c);
        result.volumes.push(bar.v || 0);
      });
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message })
    };
  }
};
