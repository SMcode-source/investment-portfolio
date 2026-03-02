// Get live market data snapshot from IBKR
const { ibkrRequest } = require('./ibkr-auth');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// IBKR market data field IDs
// 31=Last, 55=Symbol, 70=High, 71=Low, 82=Change, 83=Change%,
// 84=Bid, 86=Ask, 87=Volume, 7295=Open, 7293=Bid Size, 7294=Ask Size
const FIELDS = '31,55,70,71,82,83,84,86,87,7295';

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };

  const params = event.queryStringParameters || {};
  const conids = params.conids; // Comma-separated conids

  if (!conids) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing conids parameter' }) };
  }

  try {
    // IBKR snapshot endpoint - may need multiple calls for fresh data
    var data = await ibkrRequest('/iserver/marketdata/snapshot', {
      conids: conids,
      fields: FIELDS
    });

    // IBKR sometimes returns stale data on first call, so call again
    if (Array.isArray(data) && data.length > 0 && !data[0]['31']) {
      await new Promise(function(resolve) { setTimeout(resolve, 500); });
      data = await ibkrRequest('/iserver/marketdata/snapshot', {
        conids: conids,
        fields: FIELDS
      });
    }

    // Normalize to consistent format
    var quotes = {};
    if (Array.isArray(data)) {
      data.forEach(function(item) {
        quotes[item.conid] = {
          conid: item.conid,
          symbol: item['55'] || '',
          price: parseFloat(item['31']) || 0,
          high: parseFloat(item['70']) || 0,
          low: parseFloat(item['71']) || 0,
          change: parseFloat(item['82']) || 0,
          changePct: parseFloat(item['83']) || 0,
          bid: parseFloat(item['84']) || 0,
          ask: parseFloat(item['86']) || 0,
          volume: parseInt(item['87']) || 0,
          open: parseFloat(item['7295']) || 0,
          timestamp: Date.now()
        };
      });
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(quotes)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message })
    };
  }
};
