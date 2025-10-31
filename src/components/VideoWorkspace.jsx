import { useEffect, useMemo, useRef, useState } from 'react';

const COLOR_MAP = {
  summary: '#4C5D8B',
  insight: '#1C89FF',
  question: '#F97316',
  action: '#16A34A'
};

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function VideoWorkspace({
  video,
  onHighlightDragStart,
  onPlaybackUpdate
}) {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    const handler = () => {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onPlaybackUpdate?.(time);
    };

    const player = videoRef.current;
    player.addEventListener('timeupdate', handler);

    return () => {
      player.removeEventListener('timeupdate', handler);
    };
  }, [videoRef, onPlaybackUpdate]);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
  }, [video?.src]);

  const availableHighlights = useMemo(() => {
    if (!video?.highlights) {
      return [];
    }
    return video.highlights.filter((highlight) => highlight.time <= currentTime + 0.5);
  }, [video?.highlights, currentTime]);

  return (
    <div className="video-container">
      <div>
        <label htmlFor="video-select" style={{ fontWeight: 600, color: '#4c5d8b' }}>
          Active video
        </label>
        <p style={{ marginTop: '0.25rem', color: '#5f6c8d' }}>{video?.title ?? 'Select a video'}</p>
      </div>

      <div className="video-player">
        {video ? (
          <video
            ref={videoRef}
            width="100%"
            height="100%"
            controls
            src={video.src}
            poster={video.poster}
          >
            Sorry, your browser does not support embedded videos.
          </video>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#5f6c8d' }}>
            Select a video from the configuration panel to begin.
          </div>
        )}
      </div>

      {video ? (
        <div className="video-meta">
          <span>
            ⏱ Current time <strong>{formatTime(currentTime)}</strong>
          </span>
          <span>
            🎯 Available prompts <strong>{availableHighlights.length}</strong>
          </span>
        </div>
      ) : null}

      <div className="highlight-board" aria-label="AI generated note suggestions">
        {availableHighlights.length === 0 ? (
          <p style={{ color: '#5f6c8d', margin: 0 }}>
            Highlights will appear automatically as the video progresses.
          </p>
        ) : (
          availableHighlights.map((highlight) => {
            const color = COLOR_MAP[highlight.category] ?? '#4C5D8B';
            return (
              <div
                key={highlight.id}
                className={`highlight-token${highlight.shape ? ` highlight-token--${highlight.shape}` : ''}`}
                style={{ '--highlight-color': color }}
                data-shape={highlight.shape}
                draggable
                onDragStart={(event) => {
                  event.currentTarget.classList.add('is-dragging');
                  onHighlightDragStart(event, highlight);
                }}
                onDragEnd={(event) => {
                  event.currentTarget.classList.remove('is-dragging');
                }}
              >
                <div className="highlight-token__shape">
                  <span className="highlight-token__label">{highlight.title ?? highlight.label}</span>
                </div>
                <div className="highlight-token__meta">
                  <span>{formatTime(highlight.time)}</span>
                  <span>{highlight.category}</span>
                </div>
                {highlight.note ? (
                  <div className="highlight-token__tooltip" role="tooltip">
                    <div className="highlight-token__tooltip-title">
                      {highlight.title ?? highlight.label}
                    </div>
                    <p>{highlight.note}</p>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
