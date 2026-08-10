import { useEffect, useRef, useState } from 'react'
import { loadPlaylist, PLAYLIST_ID } from '../playlist'

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
  return (
    <div className="flex h-4 items-end gap-[2px]" aria-hidden>
      {[0.45, 0.9, 0.6, 1, 0.7, 0.55, 0.85, 0.5, 0.95, 0.65].map((h, i) => (
        <span
          key={i}
          className="w-[1.5px] rounded-full bg-kada-ember/85"
          style={{
            height: active ? `${h * 100}%` : '20%',
            transformOrigin: 'bottom',
            animation: active
              ? `wave 1.${(i % 4) + 1}s ease-in-out infinite`
              : 'none',
            animationDelay: `${i * 0.07}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.35); opacity: 0.6; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default function MusicPlayer() {
  const hostRef = useRef(null)
  const playerRef = useRef(null)
  const rafRef = useRef(0)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [tracks, setTracks] = useState([])
  const [index, setIndex] = useState(0)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    loadPlaylist().then((t) => {
      setTracks(Array.isArray(t) ? t : [])
    }).catch(() => setTracks([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current || playerRef.current) return
      playerRef.current = new YT.Player(hostRef.current, {
        height: '0',
        width: '0',
        playerVars: {
          listType: 'playlist',
          list: PLAYLIST_ID,
          loop: 1,
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
            if (e.data === 1) {
              setPlaying(true)
              try {
                const idx = e.target.getPlaylistIndex ? e.target.getPlaylistIndex() : 0
                if (typeof idx === 'number' && idx >= 0) setIndex(idx)
              } catch {}
            } else if (e.data === 2 || e.data === 0) {
              setPlaying(false)
            }
          },
        },
      })
    })
    return () => {
      cancelled = true
      try { playerRef.current && playerRef.current.destroy && playerRef.current.destroy() } catch {}
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

  const toggle = () => {
    const p = playerRef.current
    if (!p || !ready) return
    if (playing) { p.pauseVideo(); setPlaying(false) }
    else {
      try { p.unMute() } catch {}
      setMuted(false)
      p.playVideo()
    }
  }
  const next = () => { try { playerRef.current && playerRef.current.nextVideo && playerRef.current.nextVideo() } catch {} }
  const prev = () => { try { playerRef.current && playerRef.current.previousVideo && playerRef.current.previousVideo() } catch {} }
  const onMuteToggle = () => {
    const p = playerRef.current
    if (!p || !ready) return
    if (muted) { try { p.unMute(); p.setVolume && p.setVolume(70) } catch {} ; setMuted(false) }
    else { try { p.mute() } catch {} ; setMuted(true) }
  }
  const onSeek = (e) => {
    const p = playerRef.current
    if (!p || !ready || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    try { p.seekTo(pct * duration, true) } catch {}
  }

  const track = tracks[index] || {}
  const cover = track.thumbnail || ''
  const progress = duration > 0 ? Math.min(1, current / duration) : 0

  return (
    <div
      className="relative w-full max-w-2xl rounded-2xl border border-kada-amber/15 bg-kada-bean/55 px-3 py-2.5 sm:px-4 sm:py-3 backdrop-blur-xl"
      style={{ boxShadow: '0 14px 50px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(233,213,176,0.06)' }}
    >
      <div ref={hostRef} aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Left: album cover */}
        <div className="relative shrink-0">
          <div
            className="relative h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-lg border border-kada-amber/20"
            style={{ boxShadow: playing ? '0 0 22px rgba(224,123,58,0.35)' : '0 4px 14px rgba(0,0,0,0.55)' }}
          >
            {cover ? (
              <img
                src={cover}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700"
                style={{ transform: playing ? 'rotate(0deg)' : 'rotate(0deg)' }}
              />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background:
                    'radial-gradient(circle at 30% 30%, rgba(224,123,58,0.5), rgba(61,36,21,0.95) 70%)',
                }}
              />
            )}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.08), transparent 40%, rgba(0,0,0,0.25))',
              }}
            />
          </div>
          {playing && (
            <span
              className="absolute -inset-1 rounded-lg pointer-events-none"
              style={{ boxShadow: '0 0 0 1px rgba(224,123,58,0.25), 0 0 22px rgba(224,123,58,0.35)' }}
            />
          )}
        </div>

        {/* Center: title, artist, waveform */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${playing ? 'bg-kada-ember animate-pulse' : 'bg-kada-milk/40'}`} />
            <span className="font-sans text-[10px] sm:text-[11px] uppercase tracking-[0.4em] text-kada-amber/70">
              {playing ? 'Now Playing' : 'Paused'}
            </span>
            <span className="ml-2 text-kada-amber/40"><Waveform active={playing} /></span>
          </div>
          <div className="mt-0.5 truncate font-serif text-sm sm:text-base text-kada-milk">
            {track.title || (ready ? 'Old Malayalam Melodies' : 'Pouring chaya...')}
          </div>
          <div className="truncate font-sans text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-kada-amber/60">
            {track.artist || 'Various Artists'}
          </div>

          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <span className="font-sans text-[10px] tabular-nums text-kada-milk/70">{fmtTime(current)}</span>
            <div
              className="group relative h-1 flex-1 cursor-pointer overflow-hidden rounded-full bg-kada-milk/15"
              onClick={onSeek}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-kada-amber via-kada-ember to-kada-amber"
                style={{ width: `${progress * 100}%`, boxShadow: '0 0 8px rgba(224,123,58,0.55)' }}
              />
              <span
                className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-kada-milk opacity-0 transition group-hover:opacity-100"
                style={{ left: `calc(${progress * 100}% - 5px)` }}
              />
            </div>
            <span className="font-sans text-[10px] tabular-nums text-kada-milk/50">{fmtTime(duration)}</span>
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <CtrlBtn onClick={prev} label="Previous">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
          </CtrlBtn>
          <button
            onClick={toggle}
            aria-label={playing ? 'Pause' : 'Play'}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-kada-ember text-kada-ink transition active:scale-95 hover:bg-kada-amber"
            style={{ boxShadow: '0 0 18px rgba(224,123,58,0.5), inset 0 1px 0 rgba(255,255,255,0.2)' }}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <CtrlBtn onClick={next} label="Next">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg>
          </CtrlBtn>
          <CtrlBtn onClick={onMuteToggle} label={muted ? 'Unmute' : 'Mute'}>
            {muted ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            )}
          </CtrlBtn>
        </div>
      </div>
    </div>
  )
}

function CtrlBtn({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-kada-milk/80 transition hover:bg-kada-milk/10 hover:text-kada-amber"
    >
      {children}
    </button>
  )
}
