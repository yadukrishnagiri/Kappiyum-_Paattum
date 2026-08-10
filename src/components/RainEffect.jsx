export default function RainEffect({ count = 90 }) {
  const drops = Array.from({ length: count }, (_, i) => {
    const left = (i * 13 + (i % 7) * 11) % 100
    const duration = 0.5 + ((i * 0.07) % 0.7)
    const delay = -((i * 0.13) % 2)
    const opacity = 0.25 + ((i * 0.041) % 0.4)
    return { left, duration, delay, opacity, i }
  })

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {drops.map((d) => (
        <span
          key={d.i}
          className="absolute -top-10 w-px h-14 bg-gradient-to-b from-transparent via-white to-white animate-rain-fall"
          style={{
            left: `${d.left}%`,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
            opacity: d.opacity,
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(0,0,0,0.05))',
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  )
}
