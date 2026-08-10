import { useEffect, useRef, useState } from 'react'

const PLAYLIST_ID = 'PLLsxRMbTC-5k'

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

export default function MusicPlayer() {
  const hostRef = useRef(null)
  const playerRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [title, setTitle] = useState('')
  const [muted, setMuted] = useState(false)

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
            e.target.unMute && e.target.unMute()
            try {
              const data = e.target.getVideoData && e.target.getVideoData()
              if (data && data.title) setTitle(data.title)
            } catch {}
          },
          onStateChange: (e) => {
            if (e.data === 1) {
              setPlaying(true)
              try {
                const data = e.target.getVideoData && e.target.getVideoData()
                if (data && data.title) setTitle(data.title)
              } catch {}
            } else if (e.data === 2) {
              setPlaying(false)
            }
          },
        },
      })
    })
    return () => {
      cancelled = true
      try {
        playerRef.current && playerRef.current.destroy && playerRef.current.destroy()
      } catch {}
    }
  }, [])

  const toggle = () => {
    const p = playerRef.current
    if (!p || !ready) return
    if (playing) {
      p.pauseVideo()
      setPlaying(false)
    } else {
      p.unMute && p.unMute()
      setMuted(false)
      p.playVideo()
    }
  }

  const onMuteToggle = () => {
    const p = playerRef.current
    if (!p || !ready) return
    if (muted) {
      p.unMute && p.unMute()
      p.setVolume && p.setVolume(70)
      setMuted(false)
    } else {
      p.mute && p.mute()
      setMuted(true)
    }
  }

  return (
    <div className="flex items-center gap-4 sm:gap-5 px-5 py-3 rounded-full bg-kada-bean/70 backdrop-blur-md border border-kada-amber/15"
         style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(233,213,176,0.06)' }}>
      <div ref={hostRef} aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />

      <button
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
        className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-kada-ember/90 text-kada-ink transition active:scale-95 hover:bg-kada-amber"
        style={{ boxShadow: '0 0 18px rgba(224,123,58,0.45)' }}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="truncate font-serif italic text-sm sm:text-base text-kada-milk">
          {ready ? (title || 'Old Malayalam Melodies') : 'Pouring chaya...'}
        </div>
        <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.3em] text-kada-amber/70">
          <span className={`h-1.5 w-1.5 rounded-full ${playing ? 'bg-kada-ember animate-pulse' : 'bg-kada-milk/40'}`} />
          {playing ? 'now playing' : 'paused'}
        </div>
      </div>

      <button
        onClick={onMuteToggle}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-kada-milk/80 hover:text-kada-amber transition"
      >
        {muted ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
        )}
      </button>
    </div>
  )
}
