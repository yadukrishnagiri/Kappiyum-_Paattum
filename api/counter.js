const KEY = 'kappiyum_visitors'
const SESSIONS = 'kappiyum_active_sessions'
const ACTIVE_TTL = 90

function kvUrl(path) {
  const base = process.env.KV_REST_API_URL
  if (!base) return null
  return `${base.replace(/\/$/, '')}/${path}`
}

function authHeaders() {
  const token = process.env.KV_REST_API_TOKEN
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function kvCmd(args) {
  const url = kvUrl('pipeline')
  if (!url) throw new Error('KV not configured')
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(args.map((a) => (Array.isArray(a) ? a : [a]))),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`pipeline failed ${res.status}: ${text}`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data.map((r) => r?.result) : []
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  let body = {}
  if (req.method === 'POST') {
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    } catch {
      return res.status(400).json({ error: 'invalid body' })
    }
    const sessionId = body.sessionId
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId required' })
    }
  } else if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let total = 0
    let active = 0

    if (req.method === 'POST') {
      const sid = String(body.sessionId)

      const results = await kvCmd([
        ['EXISTS', `sid:${sid}`],
        ['GET', KEY],
        ['SADD', SESSIONS, sid],
        ['EXPIRE', SESSIONS, ACTIVE_TTL * 2],
        ['SET', `sid:${sid}`, '1', ['EX', ACTIVE_TTL]],
      ])

      const seen = Number(results[0] || 0) > 0
      if (seen) {
        total = parseInt(results[1], 10) || 1247
      } else {
        total = parseInt(results[1], 10) || 0
        total = total + 1
        await kvCmd([['SET', KEY, String(total)]])
      }

      const actRes = await kvCmd([['SCARD', SESSIONS]])
      active = parseInt(actRes[0], 10) || 0
    } else {
      const results = await kvCmd([
        ['GET', KEY],
        ['SCARD', SESSIONS],
      ])
      total = parseInt(results[0], 10) || 0
      active = parseInt(results[1], 10) || 0
    }

    return res.status(200).json({ total: total || 1247, active })
  } catch (err) {
    return res.status(500).json({ error: 'kv', detail: String(err && err.message ? err.message : err) })
  }
}
