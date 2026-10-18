import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

// Load .env if present
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const envLocalPath = path.resolve(process.cwd(), '.env.local');

  [envPath, envLocalPath].forEach((p) => {
    if (fs.existsSync(p)) {
      const lines = fs.readFileSync(p, 'utf-8').split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...vals] = trimmed.split('=');
          if (key && vals.length > 0) {
            process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
          }
        }
      });
    }
  });
}

loadEnv();

const PORT = parseInt(process.env.PORT || '3001', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';

// Rate limiting (max 30 requests per minute per IP)
const rateLimits = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReq = 30;

  const record = rateLimits.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
  } else {
    record.count += 1;
  }
  rateLimits.set(ip, record);
  return record.count > maxReq;
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Health endpoint
  if (req.method === 'GET' && url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', hasKey: !!GEMINI_API_KEY }));
    return;
  }

  // Sentence interpretation proxy endpoint
  if (req.method === 'POST' && url.pathname === '/api/interpret') {
    const ip = req.socket.remoteAddress || '127.0.0.1';
    if (isRateLimited(ip)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 50000) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const tappedWords = Array.isArray(payload.tappedWords) ? payload.tappedWords.slice(0, 10) : [];
        const timeOfDay = typeof payload.timeOfDay === 'string' ? payload.timeOfDay : 'day';
        const cameraCue = typeof payload.cameraCue === 'string' ? payload.cameraCue : '';

        if (tappedWords.length === 0 && !cameraCue) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No input words provided' }));
          return;
        }

        // If no API key configured, return 503 so client silently uses local engine
        if (!GEMINI_API_KEY) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Smart suggestions are offline (unconfigured)', fallback: true }));
          return;
        }

        // Minimal sanitized text prompt sent to Gemini (zero images, video, personal names)
        const systemPrompt = `You are an AAC sentence interpretation helper for a child with complex communication needs (Angelman syndrome).
The child communicated the following AAC words/tokens: [${tappedWords.join(', ')}].
Current time of day: ${timeOfDay}.
${cameraCue ? `Recent physical visual observation cue: "${cameraCue}".` : ''}

Generate 2 to 4 gentle, possible interpretations of what the child might be saying.
Rules:
1. Always tentative phrasing (start with "Maybe: '...'" or "Or: '...'"). Never state interpretation as fact.
2. Provide a plain-language confidence level: "High", "Medium", or "Low".
3. Provide a short reason explaining the context.
4. Output strictly valid JSON matching this schema:
{
  "interpretations": [
    {
      "id": "ai-1",
      "phrase": "Maybe: '...'",
      "confidence": "High",
      "reason": "..."
    }
  ]
}`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const aiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.warn('[Sentence Helper Proxy] Gemini API error:', aiResponse.status, errText);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'AI provider error', fallback: true }));
          return;
        }

        const aiData = await aiResponse.json();
        const rawJsonText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJsonText) {
          throw new Error('Empty response from AI model');
        }

        const parsed = JSON.parse(rawJsonText);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(parsed));
      } catch (err) {
        console.warn('[Sentence Helper Proxy] Error handling interpretation:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error processing sentence', fallback: true }));
      }
    });
    return;
  }

  // Not found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[GESTIVO AI Proxy] Listening on http://localhost:${PORT}`);
  console.log(`  -> API Status: ${GEMINI_API_KEY ? 'Gemini configured' : 'Local fallback mode (no key)'}`);
});
