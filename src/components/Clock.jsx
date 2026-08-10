import { useEffect, useState } from 'react'

export default function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }).format(now)

  const day = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Kolkata',
  }).format(now)

  return (
    <div className="font-serif select-none" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
      <div className="text-2xl sm:text-3xl md:text-4xl text-kada-milk font-light tabular-nums tracking-wide">
        {time}
      </div>
      <div className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-kada-amber/70 mt-1">
        {day} · Kerala
      </div>
    </div>
  )
}
