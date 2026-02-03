// api/gas.js
// Vercel Serverless Function proxy to Google Apps Script Web App.
// Set env var GAS_URL (preferred) or GAS_WEBAPP_URL in Vercel Project Settings.
//
// Expected GAS_URL value example:
// https://script.google.com/macros/s/AKfycb.../exec

module.exports = async function handler(req, res) {
  // Allow browser calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const gasUrlRaw = (process.env.GAS_URL || process.env.GAS_WEBAPP_URL || '').trim();
  if (!gasUrlRaw) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ success: false, error: 'Missing GAS_URL env var in Vercel.' }));
    return;
  }

  // Parse incoming URL to get query params (req.query is not always available outside Next.js)
  const incoming = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Build target URL
  const target = new URL(gasUrlRaw);
  // Forward querystring for GET requests
  if (req.method === 'GET') {
    incoming.searchParams.forEach((value, key) => {
      target.searchParams.append(key, value);
    });
  }

  // Read raw body for POST/PUT/etc
  async function readBody(r) {
    return await new Promise((resolve, reject) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      r.on('end', () => resolve(Buffer.concat(chunks)));
      r.on('error', reject);
    });
  }

  let body;
  const headers = {};

  if (req.method !== 'GET') {
    const ct = String(req.headers['content-type'] || '').toLowerCase();
    // Preserve content-type when present. Apps Script can read either JSON or urlencoded.
    headers['Content-Type'] = ct || 'application/x-www-form-urlencoded; charset=utf-8';
    const raw = await readBody(req);
    body = raw && raw.length ? raw : undefined;
  }

  try {
    const resp = await fetch(target.toString(), {
      method: req.method,
      headers,
      body,
      redirect: 'follow'
    });

    const text = await resp.text();

    // Try JSON, fallback to text
    let out;
    let isJson = false;
    try {
      out = JSON.parse(text);
      isJson = true;
    } catch (e) {
      out = text;
    }

    res.statusCode = resp.status;
    if (isJson) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(out));
    } else {
      res.setHeader('Content-Type', resp.headers.get('content-type') || 'text/plain; charset=utf-8');
      res.end(out);
    }
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ success: false, error: 'Proxy error. See Vercel logs.' }));
  }
};
