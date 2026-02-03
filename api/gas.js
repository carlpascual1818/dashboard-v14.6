// api/gas.js
// Vercel Serverless Function proxy to Google Apps Script Web App.
// Env var: GAS_URL (preferred) or GAS_WEBAPP_URL.
// This endpoint is intended for POST requests that return JSON.

module.exports = async function handler(req, res) {
  // CORS (safe for same-origin too)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Never cache API responses
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // This proxy is POST-only. Avoid forwarding GET to Apps Script doGet (UI path).
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      success: false,
      error: 'Method not allowed. Use POST with JSON body { action: "...", ... }.'
    }));
    return;
  }

  const gasUrlRaw = (process.env.GAS_URL || process.env.GAS_WEBAPP_URL || '').trim();
  if (!gasUrlRaw) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ success: false, error: 'Missing GAS_URL env var in Vercel.' }));
    return;
  }

  // Read raw body
  async function readBody(r) {
    return await new Promise((resolve, reject) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      r.on('end', () => resolve(Buffer.concat(chunks)));
      r.on('error', reject);
    });
  }

  // Preserve request content-type, default to JSON
  const ct = String(req.headers['content-type'] || '').toLowerCase();
  const headers = { 'Content-Type': ct || 'application/json; charset=utf-8' };

  const raw = await readBody(req);
  const body = raw && raw.length ? raw : Buffer.from('{}');

  // Timeout guard (prevents hanging requests)
  const timeoutMs = Number(process.env.GAS_PROXY_TIMEOUT_MS || 20000);
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const target = new URL(gasUrlRaw);

    const resp = await fetch(target.toString(), {
      method: 'POST',
      headers,
      body,
      redirect: 'follow',
      signal: ac.signal
    });

    const text = await resp.text();
    const respCt = (resp.headers.get('content-type') || '').toLowerCase();

    // If upstream is JSON (or looks like JSON), pass it through.
    let parsed;
    let isJson = respCt.includes('application/json');
    if (isJson) {
      try { parsed = JSON.parse(text || '{}'); }
      catch (e) { isJson = false; }
    } else {
      try { parsed = JSON.parse(text); isJson = true; }
      catch (e) { /* not json */ }
    }

    if (isJson) {
      res.statusCode = resp.status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(parsed));
      return;
    }

    // Upstream returned HTML or text. Always return JSON so frontend never crashes on JSON.parse().
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      success: false,
      error: 'Upstream returned non-JSON response.',
      upstream_status: resp.status,
      upstream_content_type: resp.headers.get('content-type') || '',
      snippet: String(text || '').slice(0, 600)
    }));
  } catch (err) {
    const aborted = String(err && err.name || '') === 'AbortError';
    res.statusCode = aborted ? 504 : 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      success: false,
      error: aborted ? 'Proxy timeout while calling Apps Script.' : 'Proxy error. See Vercel logs.',
      details: String(err && (err.message || err) || '')
    }));
  } finally {
    clearTimeout(t);
  }
};
