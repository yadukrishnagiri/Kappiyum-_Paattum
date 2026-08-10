import { useEffect, useRef, useState } from 'react'

function getSessionId() {
  try {
    let id = sessionStorage.getItem('kada_sid')
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) ||
        `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem('kada_sid', id)
    }
    return id
  } catch {
    return `tmp-${Date.now().toString(36)}`
  }
}

function fmt(n) {
  return Number.isFinite(n) ? n.toLocaleString('en-IN') : '—'
}

export default function VisitorCounter() {
  const [total, setTotal] = useState(null)
  const [active, setActive] = useState(null)
  const sessionIdRef = useRef(getSessionId())

  useEffect(() => {
    const sid = sessionIdRef.current
    let cancelled = false

    const ping = async () => {
      try {
        const res = await fetch('/api/counter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid }),
        })
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        if (typeof data.total === 'number') setTotal(data.total)
        if (typeof data.active === 'number') setActive(data.active)
      } catch {
        /* offline / pre-deploy — leave null */
      }
    }

    ping()
    const id = setInterval(ping, 30_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const live = active != null
  const label = live && active > 0 ? `${fmt(active)} here now` : live ? 'just you' : 'connecting…'

  return (
    <div
      className="text-right font-serif select-none"
      style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}
    >
      <div className="flex items-center justify-end gap-2 text-kada-milk/85">
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full rounded-full bg-kada-ember"
            style={{ animation: live ? 'ping 2s cubic-bezier(0,0,0.2,1) infinite' : 'none', opacity: 0.7 }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{
              background: live ? '#e07b3a' : '#9a8a72',
              boxShadow: live ? '0 0 6px rgba(224,123,58,0.9)' : 'none',
            }}
          />
        </span>
        <span className="text-sm sm:text-base tabular-nums tracking-wider">
          {total != null ? fmt(total) : '—'}
        </span>
      </div>
      <div
        className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-kada-amber/70 mt-1"
        style={{ display: 'none' }}
      >
        {label}
      </div>
    </div>
  )
}
