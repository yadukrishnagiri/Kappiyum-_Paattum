import { useMemo } from 'react'

export default function SteamEffect({ count = 6 }) {
  const wisps = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        i,
        left: 10 + ((i * 17) % 80),
        duration: 2.4 + ((i * 0.31) % 1.6),
        delay: -((i * 0.41) % 2.5),
        size: 18 + ((i * 5) % 18),
      })),
    [count],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {wisps.map((w) => (
        <span
          key={w.i}
          className="absolute bottom-[28%] rounded-full animate-steam-rise"
          style={{
            left: `${w.left}%`,
            width: `${w.size}px`,
            height: `${w.size}px`,
            background:
              'radial-gradient(circle, rgba(233,213,176,0.5) 0%, rgba(233,213,176,0) 70%)',
            filter: 'blur(4px)',
            animationDuration: `${w.duration}s`,
            animationDelay: `${w.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
