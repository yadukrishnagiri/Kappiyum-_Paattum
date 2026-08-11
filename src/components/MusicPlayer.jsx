import { useEffect, useRef, useState } from 'react'
import { loadPlaylist } from '../playlist'

function fmtTime(s) {
  if (!Number.isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  return new Promise((resolve) => {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev && prev()
      resolve(window.YT)
    }
  })
}

function Waveform({ active }) {
  const bars = [0.42, 0.78, 0.55, 1, 0.68, 0.5, 0.88, 0.46, 0.95, 0.62, 0.82, 0.5, 0.74, 0.9, 0.58]
  return (
    <div className="flex h-6 items-end gap-[3px]" aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[2px] rounded-full"
          style={{
            height: active ? `${h * 100}%` : '18%',
            background: active
              ? 'linear-gradient(to top, #d4a056, #e07b3a)'
              : 'rgba(233,213,176,0.4)',
            transformOrigin: 'bottom',
            animation: active ? `waveBar 1.${(i % 5) + 1}s ease-in-out infinite` : 'none',
            animationDelay: `${i * 0.06}s`,
            boxShadow: active ? '0 0 4px rgba(224,123,58,0.55)' : 'none',
          }}
        />
      ))}
      <style>{`@keyframes waveBar { 0%,100% { transform: scaleY(0.3); opacity: 0.7; } 50% { transform: scaleY(1); opacity: 1; } }`}</style>
    </div>
  )
}

function AlbumCover({ src, playing, swapKey }) {
  return (
    <div className="relative shrink-0" style={{ perspective: '600px' }}>
      <div
        key={swapKey}
        className="relative h-12 w-12 xs:h-14 sm:h-[72px] sm:w-[72px] vinyl-swap"
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, #1a0f0a 0%, #2a1a10 35%, #0d0703 60%, #1a0f0a 100%)',
            boxShadow: playing
              ? '0 0 18px rgba(224,123,58,0.4), 0 4px 12px rgba(0,0,0,0.7)'
              : '0 4px 12px rgba(0,0,0,0.6)',
          }}
        >
          <div
            className="absolute inset-0 rounded-full opacity-50"
            style={{
              background:
                'repeating-radial-gradient(circle, transparent 0px, transparent 3px, rgba(255,255,255,0.04) 3px, rgba(255,255,255,0.04) 4px)',
            }}
          />
          <div
            className="absolute rounded-full overflow-hidden"
            style={{ inset: '14%', animation: playing ? 'vinylSpin 8s linear infinite' : 'none' }}
          >
            {src ? (
              <img src={src} alt="" className="h-full w-full object-cover" />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background:
                    'radial-gradient(circle at 30% 25%, rgba(224,123,58,0.55), rgba(61,36,21,0.95) 70%)',
                }}
              />
            )}
            <div
              className="absolute left-1/2 top-1/2 h-1 w-1 sm:h-1.5 sm:w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-kada-ink"
              style={{ boxShadow: 'inset 0 0 2px rgba(0,0,0,0.8)' }}
            />
            <div
              className="absolute inset-0 pointer-events-none rounded-full"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 40%, transparent 70%, rgba(0,0,0,0.25) 100%)',
              }}
            />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes vinylSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes vinylSwapIn {
          0%   { transform: translateX(120%) rotate(35deg); opacity: 0; }
          60%  { opacity: 1; }
          100% { transform: translateX(0)     rotate(0deg);  opacity: 1; }
        }
        .vinyl-swap {
          animation: vinylSwapIn 0.65s cubic-bezier(0.22, 0.9, 0.3, 1) both;
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .vinyl-swap { animation: none; }
        }
      `}</style>
    </div>
  )
}

function buildShuffledIds(ids, pin = null) {
  const arr = [...ids]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  if (pin) {
    const i = arr.indexOf(pin)
    if (i > 0) {
      const [head] = arr.splice(i, 1)
      arr.unshift(head)
    }
  }
  return arr
}

export default function MusicPlayer() {
  const hostRef = useRef(null)
  const playerRef = useRef(null)
  const rafRef = useRef(0)
  const loadedIdRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [tracks, setTracks] = useState([])
  const [order, setOrder] = useState([])
  const [shuffle, setShuffle] = useState(() => {
    try { return localStorage.getItem('kp_shuffle') === '1' } catch { return false }
  })
  const [currentVideoId, setCurrentVideoId] = useState(null)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [swapKey, setSwapKey] = useState(0)

  useEffect(() => {
    loadPlaylist()
      .then((t) => {
        const list = Array.isArray(t) ? t : []
        setTracks(list)
      })
      .catch(() => setTracks([]))
  }, [])

  useEffect(() => {
    if (tracks.length === 0) return
    setOrder((prev) => {
      const ids = tracks.map((x) => x.videoId).filter(Boolean)
      if (prev.length !== ids.length) {
        return shuffle ? buildShuffledIds(ids, currentVideoId) : ids
      }
      const prevSet = new Set(prev)
      const allKnown = ids.every((id) => prevSet.has(id))
      if (!allKnown) {
        return shuffle ? buildShuffledIds(ids, currentVideoId) : ids
      }
      if (shuffle) return buildShuffledIds(ids, currentVideoId)
      return ids
    })
  }, [tracks, shuffle, currentVideoId])

  useEffect(() => {
    if (!currentVideoId && order.length > 0) setCurrentVideoId(order[0])
  }, [order, currentVideoId])

  useEffect(() => {
    try { localStorage.setItem('kp_shuffle', shuffle ? '1' : '0') } catch {}
  }, [shuffle])

  useEffect(() => {
    let cancelled = false
    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current || playerRef.current) return
      playerRef.current = new YT.Player(hostRef.current, {
        height: '0',
        width: '0',
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (e) => {
            setReady(true)
            try { e.target.unMute() } catch {}
          },
          onStateChange: (e) => {
            if (e.data === 1) setPlaying(true)
            else if (e.data === 2) setPlaying(false)
            else if (e.data === 0) {
              setPlaying(false)
              advanceToNext()
            }
          },
        },
      })
    })
    return () => {
      cancelled = true
      try { playerRef.current && playerRef.current.destroy && playerRef.current.destroy() } catch {}
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    const tick = () => {
      const p = playerRef.current
      if (p && p.getCurrentTime) {
        try {
          setCurrent(p.getCurrentTime() || 0)
          setDuration(p.getDuration() || 0)
        } catch {}
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    const p = playerRef.current
    if (!p || !ready || !currentVideoId) return
    if (loadedIdRef.current === currentVideoId) return
    loadedIdRef.current = currentVideoId
    setSwapKey((k) => k + 1)
    try {
      p.loadVideoById(currentVideoId)
    } catch {}
  }, [currentVideoId, ready])

  const advanceToNext = () => {
    setCurrentVideoId((cur) => {
      const o = orderRef.current
      if (o.length === 0) return cur
      const idx = cur ? o.indexOf(cur) : -1
      const nextIdx = idx < 0 ? 0 : (idx + 1) % o.length
      return o[nextIdx]
    })
  }

  const orderRef = useRef(order)
  useEffect(() => { orderRef.current = order }, [order])

  const toggle = () => {
    const p = playerRef.current
    if (!p || !ready) return
    if (playing) { p.pauseVideo(); setPlaying(false) }
    else { try { p.unMute() } catch {}; setMuted(false); p.playVideo() }
  }
  const next = () => advanceToNext()
  const prev = () => {
    setCurrentVideoId((cur) => {
      const o = orderRef.current
      if (o.length === 0) return cur
      const idx = cur ? o.indexOf(cur) : -1
      const prevIdx = idx < 0 ? 0 : (idx - 1 + o.length) % o.length
      return o[prevIdx]
    })
  }
  const onMuteToggle = () => {
    const p = playerRef.current
    if (!p || !ready) return
    if (muted) { try { p.unMute(); p.setVolume && p.setVolume(70) } catch {}; setMuted(false) }
    else { try { p.mute() } catch {}; setMuted(true) }
  }
  const onSeek = (e) => {
    const p = playerRef.current
    if (!p || !ready || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    try { p.seekTo(pct * duration, true) } catch {}
  }
  const onShuffleToggle = () => setShuffle((s) => !s)

  const track = currentVideoId
    ? tracks.find((t) => t.videoId === currentVideoId) || {}
    : (tracks[0] || {})
  const cover = track.thumbnail || ''
  const progress = duration > 0 ? Math.min(1, current / duration) : 0

  return (
    <div className="relative w-full max-w-[820px]">
      <div ref={hostRef} aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />

      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-full border border-kada-amber/20 backdrop-blur-2xl"
        style={{
          background:
            'linear-gradient(135deg, rgba(42,26,16,0.7) 0%, rgba(26,15,10,0.55) 50%, rgba(42,26,16,0.7) 100%)',
          boxShadow:
            '0 30px 80px -30px rgba(0,0,0,0.85), 0 0 40px -10px rgba(224,123,58,0.25), inset 0 1px 0 rgba(233,213,176,0.08), inset 0 -1px 0 rgba(0,0,0,0.4)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at top, rgba(224,123,58,0.08), transparent 60%)',
          }}
        />

        <div className="relative flex items-center gap-2 px-3 py-2 sm:gap-4 sm:px-5 sm:py-3">
          {/* LEFT: Album artwork */}
          <AlbumCover src={cover} playing={playing} swapKey={swapKey} />

          {/* CENTER: Title + meta */}
          <div className="min-w-0 flex-1 pr-1 sm:pr-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="absolute inline-flex h-full w-full rounded-full bg-kada-ember"
                  style={{ animation: playing ? 'ping 2s cubic-bezier(0,0,0.2,1) infinite' : 'none', opacity: 0.7 }}
                />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-kada-ember" style={{ boxShadow: '0 0 6px rgba(224,123,58,0.9)' }} />
              </span>
              <span className="font-sans text-[9px] sm:text-[11px] uppercase tracking-[0.35em] sm:tracking-[0.45em] text-kada-amber/75">
                {playing ? 'Now Playing' : 'Paused'}
              </span>
            </div>
            <div
              className="mt-0.5 sm:mt-1 truncate font-serif text-sm sm:text-xl text-kada-milk"
              style={{ textShadow: '0 1px 8px rgba(0,0,0,0.7)', letterSpacing: '0.01em' }}
            >
              {track.title || (ready ? 'Old Malayalam Melodies' : 'Pouring chaya...')}
            </div>
            <div className="truncate font-sans text-[9px] sm:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-kada-amber/65">
              {track.artist || 'Various Artists'}
            </div>
          </div>

          {/* RIGHT: waveform + time + volume (desktop only) */}
          <div className="hidden sm:flex shrink-0 flex-col items-end gap-1.5">
            <Waveform active={playing} />
            <div className="flex items-center gap-2 font-sans text-[10px] tabular-nums text-kada-milk/70">
              <span>{fmtTime(current)}</span>
              <span className="text-kada-milk/30">/</span>
              <span className="text-kada-milk/45">{fmtTime(duration)}</span>
            </div>
          </div>

          <button
            onClick={onMuteToggle}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-kada-milk/75 transition hover:bg-kada-milk/10 hover:text-kada-amber"
          >
            {muted ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            )}
          </button>

          {/* SHUFFLE toggle */}
          <button
            onClick={onShuffleToggle}
            aria-label="Shuffle"
            aria-pressed={shuffle}
            title="Shuffle"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:bg-kada-milk/10"
            style={{ color: shuffle ? '#e07b3a' : 'rgba(233,213,176,0.75)' }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>

          {/* PREV button */}
          <button
            onClick={prev}
            aria-label="Previous"
            className="flex h-8 w-8 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-kada-milk/75 transition hover:bg-kada-milk/10 hover:text-kada-amber"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
          </button>

          {/* PLAY BUTTON — large amber gradient with rotating dotted ring */}
          <div className="relative shrink-0">
            {playing && (
              <div
                className="absolute -inset-1.5 animate-spin"
                style={{ animationDuration: '12s' }}
                aria-hidden
              >
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill="none"
                    stroke="rgba(224,123,58,0.35)"
                    strokeWidth="1.5"
                    strokeDasharray="2 8"
                  />
                </svg>
              </div>
            )}
            <button
              onClick={toggle}
              aria-label={playing ? 'Pause' : 'Play'}
              className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-kada-ink transition active:scale-95"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #f0a865 0%, #e07b3a 55%, #a04e1a 100%)',
                boxShadow:
                  '0 0 16px rgba(224,123,58,0.5), 0 3px 10px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.2)',
              }}
            >
              {playing ? (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px] ml-0.5" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
          </div>

          {/* NEXT button */}
          <button
            onClick={next}
            aria-label="Next"
            className="flex h-8 w-8 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-kada-milk/75 transition hover:bg-kada-milk/10 hover:text-kada-amber"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg>
          </button>
        </div>

        {/* Progress bar — full width across the bottom */}
        <div
          className="group relative h-[2px] w-full cursor-pointer overflow-hidden bg-kada-milk/10"
          onClick={onSeek}
        >
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${progress * 100}%`,
              background:
                'linear-gradient(to right, rgba(212,160,86,0.7), #e07b3a 50%, rgba(212,160,86,0.9))',
              boxShadow: '0 0 8px rgba(224,123,58,0.7)',
            }}
          />
        </div>

        {/* Mobile-only time row */}
        <div className="flex sm:hidden items-center justify-between px-3 pb-1.5 pt-0.5 font-sans text-[9px] tabular-nums text-kada-milk/55">
          <span>{fmtTime(current)}</span>
          <span>{fmtTime(duration)}</span>
        </div>
      </div>

      {/* Ambient glow under the player */}
      <div
        className="pointer-events-none absolute inset-x-6 sm:inset-x-10 -bottom-3 sm:-bottom-4 h-6 sm:h-8 rounded-full opacity-50 sm:opacity-60 blur-2xl"
        style={{ background: 'radial-gradient(ellipse, rgba(224,123,58,0.45), transparent 70%)' }}
        aria-hidden
      />
    </div>
  )
}
