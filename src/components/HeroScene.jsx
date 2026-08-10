import heroBg from '/hero.png'

export default function HeroScene() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-kada-ink">
      <img
        src={heroBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: 'saturate(0.95) contrast(1.02)' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(26,15,10,0.55) 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(26,15,10,0.35) 0%, transparent 25%, transparent 65%, rgba(26,15,10,0.7) 100%)',
        }}
      />
    </div>
  )
}
