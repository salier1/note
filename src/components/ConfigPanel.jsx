import { useMemo } from 'react';

export default function ConfigPanel({ config, onConfigUpload, onVideoSelect, selectedVideoId }) {
  const videoOptions = config?.videos ?? [];

  const summary = useMemo(() => {
    if (!config) {
      return '尚未加载配置文件';
    }
    return `视频目录：${config.videoDirectory || '未指定'} · 视频数量：${videoOptions.length}`;
  }, [config, videoOptions.length]);

  return (
    <div className="config-section">
      <div>
        <h2>配置</h2>
        <p>{summary}</p>
      </div>

      <div className="config-card">
        <label
          htmlFor="config-upload"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            fontWeight: 600,
            color: '#4c5d8b'
          }}
        >
          上传配置文件
          <input
            id="config-upload"
            type="file"
            accept="application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (e) => {
                try {
                  const json = JSON.parse(e.target?.result);
                  onConfigUpload(json);
                } catch (error) {
                  console.error('配置文件格式错误', error);
                }
              };
              reader.readAsText(file);
            }}
          />
        </label>
      </div>

      <div className="config-card">
        <h3 style={{ margin: '0 0 0.75rem', color: '#4c5d8b' }}>选择视频</h3>
        {videoOptions.length ? (
          <select
            id="video-select"
            value={selectedVideoId ?? ''}
            onChange={(event) => onVideoSelect(event.target.value)}
            style={{
              padding: '0.65rem',
              borderRadius: '12px',
              border: '1px solid rgba(76, 93, 139, 0.24)',
              fontSize: '0.95rem'
            }}
          >
            <option value="" disabled>
              请选择视频
            </option>
            {videoOptions.map((video) => (
              <option key={video.id} value={video.id}>
                {video.title}
              </option>
            ))}
          </select>
        ) : (
          <p style={{ color: '#5f6c8d' }}>请上传或使用默认配置来加载视频信息。</p>
        )}
      </div>

      {config ? (
        <div className="config-card">
          <h3 style={{ margin: '0 0 0.75rem', color: '#4c5d8b' }}>当前配置</h3>
          <pre>{JSON.stringify(config, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
