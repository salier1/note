import { useMemo, useState } from 'react';

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function OutlinePanel({ outlineItems, onRemove, onDropHighlight, onExport }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const markdownPreview = useMemo(() => {
    if (!outlineItems.length) {
      return '_拖拽提示节点至此生成大纲_';
    }
    return outlineItems
      .map((item, index) => `${index + 1}. ${item.label} _(at ${formatTime(item.time)})_`)
      .join('\n');
  }, [outlineItems]);

  return (
    <div className="outline-container">
      <div
        className="drop-zone"
        style={{
          borderColor: isDragOver ? '#1C89FF' : undefined,
          background: isDragOver ? 'rgba(28, 137, 255, 0.12)' : undefined
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(event) => {
          setIsDragOver(false);
          onDropHighlight(event);
        }}
      >
        将视频中的亮点拖入此处以构建大纲
      </div>

      <ul className="outline-list">
        {outlineItems.map((item) => (
          <li key={item.id} className="outline-item">
            <div>
              <strong>{item.label}</strong>
              <div className="timestamp">{formatTime(item.time)} · {item.category}</div>
            </div>
            <div className="outline-actions">
              <button type="button" onClick={() => onRemove(item.id)}>
                移除
              </button>
            </div>
          </li>
        ))}
        {outlineItems.length === 0 ? (
          <li style={{ color: '#5f6c8d', fontSize: '0.85rem' }}>暂无大纲内容</li>
        ) : null}
      </ul>

      <div className="config-card">
        <h3 style={{ marginTop: 0, fontSize: '0.9rem', color: '#4c5d8b' }}>Markdown 预览</h3>
        <pre>{markdownPreview}</pre>
      </div>

      <div className="export-buttons">
        <button type="button" onClick={() => onExport('md')}>
          ⬇️ 导出 Markdown
        </button>
        <button type="button" onClick={() => onExport('docx')}>
          ⬇️ 导出 Word
        </button>
      </div>
    </div>
  );
}
