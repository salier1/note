import { useMemo, useState } from 'react';

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

function OutlineItem({ item, onRemove, onDropHighlight }) {
  const [dropMode, setDropMode] = useState(null);

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const mode = offsetX > rect.width * 0.5 ? 'child' : 'sibling';
    setDropMode(mode);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragLeave = (event) => {
    event.stopPropagation();
    setDropMode(null);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onDropHighlight(event, { targetId: item.id, dropType: dropMode ?? 'sibling' });
    setDropMode(null);
  };

  return (
    <li className={`outline-item${dropMode ? ` outline-item--${dropMode}` : ''}`}>
      <div
        className="outline-item-card"
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`outline-drop-label${dropMode ? ' outline-drop-label--visible' : ''}`}>
          {dropMode === 'child' ? '松开以添加为子项' : '松开以添加到同级'}
        </div>
        <div>
          <strong>{item.label}</strong>
          <div className="timestamp">{formatTime(item.time)} · {item.category}</div>
        </div>
        <div className="outline-actions">
          <button type="button" onClick={() => onRemove(item.id)}>
            移除
          </button>
        </div>
      </div>

      {item.children?.length ? (
        <ul className="outline-sublist">
          {item.children.map((child) => (
            <OutlineItem
              key={child.id}
              item={child}
              onRemove={onRemove}
              onDropHighlight={onDropHighlight}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function OutlinePanel({ outlineItems, onRemove, onDropHighlight, onExport }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const markdownPreview = useMemo(() => {
    if (!outlineItems.length) {
      return '_拖拽提示节点至此生成大纲_';
    }

    const lines = [];
    const buildLines = (items, depth = 0) => {
      items.forEach((item, index) => {
        const prefix = depth === 0 ? `${index + 1}.` : '-';
        lines.push(`${'  '.repeat(depth)}${prefix} ${item.label} _(at ${formatTime(item.time)})_`);
        if (item.children?.length) {
          buildLines(item.children, depth + 1);
        }
      });
    };

    buildLines(outlineItems);
    return lines.join('\n');
  }, [outlineItems]);

  return (
    <div className="outline-container">
      <div
        className={`drop-zone${isDragOver ? ' drop-zone--active' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDragLeave={(event) => {
          const nextTarget = event.relatedTarget;
          if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
            setIsDragOver(false);
          }
        }}
        onDrop={(event) => {
          setIsDragOver(false);
          onDropHighlight(event, { targetId: null, dropType: 'sibling' });
        }}
      >
        <span className="drop-zone__text">将视频中的亮点拖入此处以构建大纲</span>
        {isDragOver ? (
          <div className="drop-zone__overlay">
            <div className="drop-zone__overlay-content">
              <span className="drop-zone__overlay-icon" aria-hidden="true">
                📌
              </span>
              松开以添加到大纲
            </div>
          </div>
        ) : null}
      </div>

      <ul className="outline-list">
        {outlineItems.map((item) => (
          <OutlineItem key={item.id} item={item} onRemove={onRemove} onDropHighlight={onDropHighlight} />
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
