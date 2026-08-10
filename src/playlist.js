const PLAYLIST_ID = 'PLLsxRMbTC-5k'
const API_KEY = import.meta.env.VITE_YT_API_KEY || 'PLACEHOLDER_ADD_REAL_KEY'

const ENDPOINT = 'https://www.googleapis.com/youtube/v3/playlistItems'
const VIDEO_ENDPOINT = 'https://www.googleapis.com/youtube/v3/videos'

let cache = null

export async function loadPlaylist() {
  if (cache) return cache

  if (!API_KEY || API_KEY.startsWith('PLACEHOLDER')) {
    cache = [
      {
        videoId: 'dQw4w9WgXcQ',
        title: 'Old Malayalam Melodies',
        artist: 'Various Artists',
        thumbnail: '',
        duration: 0,
      },
    ]
    return cache
  }

  const items = []
  let pageToken = ''
  while (true) {
    const url = new URL(ENDPOINT)
    url.searchParams.set('part', 'contentDetails,snippet')
    url.searchParams.set('maxResults', '50')
    url.searchParams.set('playlistId', PLAYLIST_ID)
    url.searchParams.set('key', API_KEY)
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const res = await fetch(url)
    if (!res.ok) throw new Error(`playlistItems ${res.status}`)
    const data = await res.json()

    for (const it of data.items || []) {
      const videoId = it.contentDetails?.videoId
      const title = it.snippet?.title || ''
      const thumb =
        it.snippet?.thumbnails?.high?.url ||
        it.snippet?.thumbnails?.medium?.url ||
        it.snippet?.thumbnails?.default?.url ||
        ''
      items.push({ videoId, title, thumb })
    }
    if (!data.nextPageToken) break
    pageToken = data.nextPageToken
  }

  if (items.length === 0) return []

  const ids = items.map((i) => i.videoId).filter(Boolean).join(',')
  const durUrl = new URL(VIDEO_ENDPOINT)
  durUrl.searchParams.set('part', 'contentDetails,status')
  durUrl.searchParams.set('id', ids)
  durUrl.searchParams.set('key', API_KEY)
  const dRes = await fetch(durUrl)
  const dData = dRes.ok ? await dRes.json() : { items: [] }

  const byId = new Map((dData.items || []).map((v) => [v.id, v]))
  cache = items.map((i) => {
    const v = byId.get(i.videoId)
    return {
      videoId: i.videoId,
      title: i.title,
      artist: 'Various Artists',
      thumbnail: i.thumb,
      duration: v?.contentDetails ? parseISO8601(v.contentDetails.duration) : 0,
      embeddable: v?.status?.embeddable !== false,
    }
  })
  return cache
}

function parseISO8601(d) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(d || '')
  if (!m) return 0
  const h = parseInt(m[1] || '0', 10)
  const mn = parseInt(m[2] || '0', 10)
  const s = parseInt(m[3] || '0', 10)
  return h * 3600 + mn * 60 + s
}

export { PLAYLIST_ID }
