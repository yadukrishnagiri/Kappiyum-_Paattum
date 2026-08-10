import { kv } from '@vercel/kv'

const KEY = 'kappiyum_visitors'
const SESSIONS = 'kappiyum_active_sessions'
const ACTIVE_TTL = 90

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  try {
    if (req.method === 'POST') {
      const sessionId = (req.body && req.body.sessionId) || ''
      if (!sessionId) return res.status(400).json({ error: 'sessionId required' })

      const seen = await kv.sismember(SESSIONS, sessionId)
      let total = await kv.get(KEY)
      if (typeof total !== 'number') total = 1247

      if (!seen) {
        await kv.sadd(SESSIONS, sessionId)
        await kv.expire(SESSIONS, ACTIVE_TTL * 2)
        total = await kv.incr(KEY)
      }
      await kv.set(`s:${sessionId}`, '1', { ex: ACTIVE_TTL })

      const active = await kv.scard(SESSIONS)
      return res.status(200).json({ total, active })
    }

    if (req.method === 'GET') {
      const total = await kv.get(KEY)
      const active = await kv.scard(SESSIONS)
      return res.status(200).json({
        total: typeof total === 'number' ? total : 1247,
        active: typeof active === 'number' ? active : 0,
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: 'kv error', detail: String(err) })
  }
}
