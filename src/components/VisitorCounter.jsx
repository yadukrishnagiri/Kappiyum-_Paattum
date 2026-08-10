import { useEffect, useRef, useState } from 'react'

const KEY = 'kada_visitors_v1'

function readCount() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? parseInt(raw, 10) : NaN
    return Number.isFinite(parsed) ? parsed : 1247
  } catch {
    return 1247
  }
}

function writeCount(n) {
  try { localStorage.setItem(KEY, String(n)) } catch {}
}

export default function VisitorCounter() {
  const [count, setCount] = useState(readCount)
  const visited = useRef(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem('kada_saw')) return
    } catch { return }
    visited.current = true
    try { sessionStorage.setItem('kada_saw', '1') } catch {}
    setCount((c) => {
      const next = c + 1
      writeCount(next)
      return next
    })
  }, [])

  return (
    <div className="text-right font-serif select-none" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
      <div className="flex items-center justify-end gap-2 text-kada-milk/80">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kada-ember opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-kada-ember" />
        </span>
        <span className="text-sm sm:text-base tabular-nums tracking-wider">
          {count.toLocaleString('en-IN')}
        </span>
      </div>
      <div className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-kada-amber/70 mt-1">
        visitors here
      </div>
    </div>
  )
}
