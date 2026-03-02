// Shared IBKR OAuth 2.0 authentication helper
// Uses private_key_jwt (RFC 7521/7523) client authentication
const { SignJWT, importPKCS8 } = require('jose');
const fetch = require('node-fetch');

const IBKR_BASE = 'https://api.ibkr.com';
const TOKEN_ENDPOINT = IBKR_BASE + '/v1/api/oauth2/token';

// Cache access token in memory (within function execution context)
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  const clientId = process.env.IBKR_CLIENT_ID;
  const privateKeyPem = process.env.IBKR_PRIVATE_KEY;

  if (!clientId || !privateKeyPem) {
    throw new Error('IBKR_CLIENT_ID and IBKR_PRIVATE_KEY environment variables are required');
  }

  // Import the RSA private key
  const privateKey = await importPKCS8(privateKeyPem, 'RS256');

  // Create client_assertion JWT (per RFC 7523)
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({
    iss: clientId,
    sub: clientId,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 300, // 5 minute validity
    jti: 'jwt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(privateKey);

  // Request access token
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: assertion,
    scope: 'market_data'
  });

  const resp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error('Token request failed (' + resp.status + '): ' + errBody);
  }

  const data = await resp.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  return cachedToken;
}

// Initialize brokerage session (required for /iserver endpoints)
async function initBrokerageSession(accessToken) {
  const resp = await fetch(IBKR_BASE + '/v1/api/iserver/auth/ssodh/init', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ publish: true, compete: true })
  });
  return resp.json();
}

// Make authenticated API request to IBKR
async function ibkrRequest(path, params) {
  const token = await getAccessToken();
  const url = new URL(IBKR_BASE + '/v1/api' + path);
  if (params) {
    Object.keys(params).forEach(function(k) { url.searchParams.append(k, params[k]); });
  }

  const resp = await fetch(url.toString(), {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  });

  if (!resp.ok) {
    // If 401, try refreshing token and retrying once
    if (resp.status === 401) {
      cachedToken = null;
      tokenExpiry = 0;
      const newToken = await getAccessToken();
      await initBrokerageSession(newToken);
      const retry = await fetch(url.toString(), {
        headers: {
          'Authorization': 'Bearer ' + newToken,
          'Content-Type': 'application/json'
        }
      });
      if (!retry.ok) throw new Error('IBKR API error (' + retry.status + ')');
      return retry.json();
    }
    throw new Error('IBKR API error (' + resp.status + ')');
  }

  return resp.json();
}

async function ibkrPostRequest(path, body) {
  const token = await getAccessToken();
  const resp = await fetch(IBKR_BASE + '/v1/api' + path, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) throw new Error('IBKR API error (' + resp.status + ')');
  return resp.json();
}

module.exports = { getAccessToken, initBrokerageSession, ibkrRequest, ibkrPostRequest, IBKR_BASE };
