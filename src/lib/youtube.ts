const YT_API = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY!;

export interface YTVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: string; // ISO 8601 e.g. PT12M34S
  durationSeconds: number;
  position: number;
}

export interface YTPlaylist {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  videoCount: number;
  videos: YTVideo[];
}

/** Extract playlist ID from a YouTube URL or raw ID */
export function extractPlaylistId(input: string): string | null {
  try {
    const url = new URL(input);
    return url.searchParams.get("list");
  } catch {
    // Maybe it's already an ID
    if (/^PL[A-Za-z0-9_-]{16,}$/.test(input)) return input;
    return null;
  }
}

/** Convert ISO 8601 duration (PT1H2M3S) to total seconds */
export function isoDurationToSeconds(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    (parseInt(match[1] ?? "0") * 3600) +
    (parseInt(match[2] ?? "0") * 60) +
    parseInt(match[3] ?? "0")
  );
}

/** Format seconds to HH:MM:SS or MM:SS */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Fetch playlist metadata */
async function fetchPlaylistInfo(playlistId: string) {
  const url = `${YT_API}/playlists?part=snippet,contentDetails&id=${playlistId}&key=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json();
  if (!data.items?.length) throw new Error("Playlist not found or is private");
  const item = data.items[0];
  return {
    id: playlistId,
    title: item.snippet.title as string,
    description: item.snippet.description as string,
    thumbnail:
      item.snippet.thumbnails?.maxres?.url ??
      item.snippet.thumbnails?.high?.url ??
      item.snippet.thumbnails?.default?.url ?? "",
    channelName: item.snippet.channelTitle as string,
    videoCount: item.contentDetails.itemCount as number,
  };
}

/** Fetch all playlist items (handles pagination) */
async function fetchPlaylistItems(playlistId: string): Promise<{ videoId: string; title: string; thumbnail: string; position: number }[]> {
  const items: { videoId: string; title: string; thumbnail: string; position: number }[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      part: "snippet",
      playlistId,
      maxResults: "50",
      key: API_KEY,
      ...(pageToken ? { pageToken } : {}),
    });
    const res = await fetch(`${YT_API}/playlistItems?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) break;
    const data = await res.json();
    for (const item of data.items ?? []) {
      const vid = item.snippet.resourceId?.videoId;
      if (!vid) continue;
      items.push({
        videoId: vid,
        title: item.snippet.title as string,
        thumbnail:
          item.snippet.thumbnails?.high?.url ??
          item.snippet.thumbnails?.default?.url ?? `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
        position: item.snippet.position as number,
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
}

/** Fetch video durations in bulk (50 at a time) */
async function fetchVideoDurations(videoIds: string[]): Promise<Record<string, number>> {
  const durations: Record<string, number> = {};
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50).join(",");
    const res = await fetch(
      `${YT_API}/videos?part=contentDetails&id=${chunk}&key=${API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) continue;
    const data = await res.json();
    for (const item of data.items ?? []) {
      durations[item.id] = isoDurationToSeconds(item.contentDetails.duration ?? "PT0S");
    }
  }
  return durations;
}

/** Full playlist fetch: metadata + all videos with durations */
export async function fetchPlaylist(playlistId: string): Promise<YTPlaylist> {
  const [info, items] = await Promise.all([
    fetchPlaylistInfo(playlistId),
    fetchPlaylistItems(playlistId),
  ]);
  const durations = await fetchVideoDurations(items.map((i) => i.videoId));
  const videos: YTVideo[] = items.map((item) => {
    const secs = durations[item.videoId] ?? 0;
    return {
      videoId: item.videoId,
      title: item.title,
      thumbnail: item.thumbnail,
      duration: formatDuration(secs),
      durationSeconds: secs,
      position: item.position,
    };
  });
  return { ...info, videos };
}
