"use client";

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
    _ytReadyCallbacks?: (() => void)[];
  }
}

export interface YouTubePlayerHandle {
  /** Returns the current playback position in seconds (0 if not ready) */
  getCurrentTime: () => number;
  /** Seeks to the given second */
  seekTo: (seconds: number) => void;
}

interface Props {
  videoId: string;
  playlistId?: string;
  title?: string;
  onPlay?: () => void;
  onEnd?: () => void;
  dark?: boolean;
}

const YouTubePlayer = forwardRef<YouTubePlayerHandle, Props>(function YouTubePlayer(
  { videoId, playlistId, onPlay, onEnd, dark = false },
  ref
) {
  // wrapperRef is a stable div that React owns — YouTube never touches it directly.
  // YouTube will replace a *child* div (created imperatively) with its <iframe>.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);

  // Keep callback refs up-to-date so we never need them in useCallback deps,
  // which would cause the player to reinitialize on every render.
  const onEndRef = useRef(onEnd);
  const onPlayRef = useRef(onPlay);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);
  useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);

  const [embedBlocked, setEmbedBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}${playlistId ? `&list=${playlistId}` : ""}`;

  // Expose player controls to parent via ref
  useImperativeHandle(ref, () => ({
    getCurrentTime: () => {
      try { return playerRef.current?.getCurrentTime() ?? 0; } catch { return 0; }
    },
    seekTo: (seconds: number) => {
      try { playerRef.current?.seekTo(seconds, true); } catch { /* ignore */ }
    },
  }));

  const initPlayer = useCallback(() => {
    if (!wrapperRef.current) return;

    // Destroy previous player instance
    playerRef.current?.destroy();
    playerRef.current = null;

    // Clear any YouTube-injected iframe from the wrapper
    wrapperRef.current.innerHTML = "";

    // Create a fresh target div for YouTube to replace with its <iframe>.
    // This div is NOT in React's VDOM — React won't track or touch it.
    const target = document.createElement("div");
    target.style.width = "100%";
    target.style.height = "100%";
    wrapperRef.current.appendChild(target);

    setEmbedBlocked(false);
    setLoading(true);

    playerRef.current = new window.YT.Player(target, {
      videoId,
      playerVars: {
        list: playlistId,
        rel: 0,
        modestbranding: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => setLoading(false),
        onStateChange: (e: YT.OnStateChangeEvent) => {
          if (e.data === window.YT.PlayerState.PLAYING) onPlayRef.current?.();
          if (e.data === window.YT.PlayerState.ENDED) onEndRef.current?.();
        },
        onError: (e: YT.OnErrorEvent) => {
          setLoading(false);
          if (e.data === 101 || e.data === 150) setEmbedBlocked(true);
        },
      },
    });
  }, [videoId, playlistId]); // onPlay/onEnd intentionally excluded — using refs instead

  useEffect(() => {
    if (!window._ytReadyCallbacks) window._ytReadyCallbacks = [];
    window._ytReadyCallbacks.push(initPlayer);

    if (!window.YT) {
      const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.head.appendChild(script);
      }
      window.onYouTubeIframeAPIReady = () => {
        window._ytReadyCallbacks?.forEach((cb) => cb());
        window._ytReadyCallbacks = [];
      };
    } else if (window.YT.Player) {
      initPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); initPlayer(); };
    }

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [initPlayer]);

  if (embedBlocked) {
    return (
      <div className={`absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center ${dark ? "bg-[#1a1208] text-slate-200" : "bg-slate-900 text-white"}`}>
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-2">
          <span className="material-symbols-outlined text-3xl text-orange-400">block</span>
        </div>
        <div>
          <p className="text-lg font-bold mb-1">Embedding disabled</p>
          <p className="text-sm text-slate-400 max-w-xs">
            The video owner has restricted embedding. Watch it directly on YouTube.
          </p>
        </div>
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          Watch on YouTube
        </a>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined animate-spin text-4xl text-orange-400">
              progress_activity
            </span>
            <p className="text-slate-400 text-sm">Loading video…</p>
          </div>
        </div>
      )}
      {/* React owns this wrapper div. YouTube replaces a child div (created imperatively
          in initPlayer) with its iframe — never touching this element directly. */}
      <div ref={wrapperRef} className="absolute inset-0 w-full h-full" />
    </>
  );
});

export default YouTubePlayer;
