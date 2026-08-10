export default function Title() {
  return (
    <div className="flex flex-col items-center text-center select-none animate-flicker-in">
      <h1
        className="font-ml text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold text-kada-milk leading-none"
        style={{
          textShadow:
            '0 0 30px rgba(224,123,58,0.45), 0 2px 12px rgba(0,0,0,0.7)',
          letterSpacing: '0.02em',
        }}
      >
        കാപ്പിയും പാട്ടും
      </h1>
      <div
        className="my-3 h-px w-24"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(233,213,176,0.6), transparent)',
        }}
      />
      <p
        className="font-serif italic text-lg sm:text-xl md:text-2xl text-kada-amber/90 tracking-widest"
        style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}
      >
        Kappiyum Paattum
      </p>
      <p className="mt-2 font-serif text-xs sm:text-sm text-kada-milk/50 tracking-[0.4em] uppercase">
        Coffee & Songs
      </p>
    </div>
  )
}
