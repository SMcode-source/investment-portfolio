// Search IBKR instruments by symbol
const { ibkrRequest } = require('./ibkr-auth');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };

  const q = (event.queryStringParameters || {}).q;
  if (!q) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing q parameter' }) };
  }

  try {
    // IBKR secdef search endpoint
    const data = await ibkrRequest('/iserver/secdef/search', { symbol: q });

    // Normalize response to a consistent format
    var results = [];
    if (Array.isArray(data)) {
      results = data.map(function(item) {
        return {
          conid: item.conid,
          symbol: item.symbol || item.ticker,
          name: item.companyName || item.description || item.symbol,
          exchange: item.description || '',
          type: (item.sections && item.sections[0] && item.sections[0].secType) || 'STK',
          sections: item.sections || []
        };
      }).slice(0, 10);
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(results)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message })
    };
  }
};
