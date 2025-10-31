import { useCallback, useEffect, useMemo, useState } from 'react';
import ConfigPanel from './components/ConfigPanel.jsx';
import VideoWorkspace from './components/VideoWorkspace.jsx';
import OutlinePanel from './components/OutlinePanel.jsx';

const DEMO_CONFIG_PATH = '/config/demo-config.json';

function downloadFile({ filename, content, mimeType = 'text/plain' }) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function App() {
  const [config, setConfig] = useState(null);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [outlineItems, setOutlineItems] = useState([]);
  const [lastPlaybackTime, setLastPlaybackTime] = useState(0);

  useEffect(() => {
    fetch(DEMO_CONFIG_PATH)
      .then((response) => response.json())
      .then((json) => {
        setConfig(json);
        setSelectedVideoId(json.videos?.[0]?.id ?? null);
      })
      .catch((error) => {
        console.error('无法加载默认配置', error);
      });
  }, []);

  const selectedVideo = useMemo(() => {
    if (!config?.videos || !selectedVideoId) {
      return null;
    }
    return config.videos.find((video) => video.id === selectedVideoId) ?? null;
  }, [config, selectedVideoId]);

  const handleConfigUpload = useCallback((json) => {
    setConfig(json);
    setSelectedVideoId(json.videos?.[0]?.id ?? null);
    setOutlineItems([]);
  }, []);

  const handleVideoSelect = useCallback((videoId) => {
    setSelectedVideoId(videoId);
    setOutlineItems([]);
  }, []);

  const handleHighlightDragStart = useCallback((event, highlight) => {
    event.dataTransfer.setData('application/json', JSON.stringify(highlight));
    event.dataTransfer.effectAllowed = 'copyMove';
  }, []);

  const findHighlight = useCallback((items, id) => {
    for (const item of items) {
      if (item.id === id) {
        return true;
      }
      if (item.children?.length && findHighlight(item.children, id)) {
        return true;
      }
    }
    return false;
  }, []);

  const addHighlightToTree = useCallback((items, highlight, targetId, dropType) => {
    if (!targetId) {
      return { items: [...items, highlight], inserted: true };
    }

    const addAsChild = (nodes) => {
      let inserted = false;
      const nextNodes = nodes.map((node) => {
        if (node.id === targetId) {
          inserted = true;
          const children = Array.isArray(node.children) ? node.children : [];
          return {
            ...node,
            children: [...children, highlight]
          };
        }
        if (node.children?.length) {
          const { items: childItems, inserted: childInserted } = addAsChild(node.children);
          if (childInserted) {
            inserted = true;
            return {
              ...node,
              children: childItems
            };
          }
        }
        return node;
      });
      return { items: nextNodes, inserted };
    };

    const addAsSibling = (nodes) => {
      let inserted = false;
      const nextNodes = nodes.reduce((acc, node) => {
        if (inserted) {
          acc.push(node);
          return acc;
        }
        if (node.id === targetId) {
          inserted = true;
          acc.push(node);
          acc.push(highlight);
          return acc;
        }
        if (node.children?.length) {
          const { items: childItems, inserted: childInserted } = addAsSibling(node.children);
          if (childInserted) {
            inserted = true;
            acc.push({
              ...node,
              children: childItems
            });
            return acc;
          }
        }
        acc.push(node);
        return acc;
      }, []);
      return { items: nextNodes, inserted };
    };

    if (dropType === 'child') {
      return addAsChild(items);
    }
    return addAsSibling(items);
  }, []);

  const removeHighlightFromTree = useCallback((items, id) => {
    let removed = false;
    const filtered = items
      .map((item) => {
        if (item.id === id) {
          removed = true;
          return null;
        }
        if (item.children?.length) {
          const { items: childItems, removed: childRemoved } = removeHighlightFromTree(item.children, id);
          if (childRemoved) {
            removed = true;
            return {
              ...item,
              children: childItems
            };
          }
        }
        return item;
      })
      .filter(Boolean);
    return { items: filtered, removed };
  }, []);

  const handleDropHighlight = useCallback(
    (event, { targetId = null, dropType = 'sibling' } = {}) => {
      event.preventDefault();
      const highlightData = event.dataTransfer.getData('application/json');
      if (!highlightData) {
        return;
      }
      try {
        const highlight = JSON.parse(highlightData);
        setOutlineItems((prev) => {
          if (findHighlight(prev, highlight.id)) {
            return prev;
          }

          const normalizedHighlight = {
            ...highlight,
            time: highlight.time ?? lastPlaybackTime,
            children: []
          };

          const { items: updatedItems, inserted } = addHighlightToTree(prev, normalizedHighlight, targetId, dropType);
          if (inserted) {
            return updatedItems;
          }
          return [...prev, normalizedHighlight];
        });
      } catch (error) {
        console.error('无法解析拖拽数据', error);
      }
    },
    [addHighlightToTree, findHighlight, lastPlaybackTime]
  );

  const handleRemoveOutlineItem = useCallback((id) => {
    setOutlineItems((prev) => removeHighlightFromTree(prev, id).items);
  }, [removeHighlightFromTree]);

  const handleExport = useCallback(
    (format) => {
      if (!outlineItems.length) {
        return;
      }

      const title = config?.export?.outlineTitle ?? 'Video Notes';
      const lines = [`# ${title}`, ''];

      const appendLines = (items, depth = 0) => {
        items.forEach((item, index) => {
          const prefix = depth === 0 ? `${index + 1}.` : '-';
          lines.push(
            `${'  '.repeat(depth)}${prefix} ${item.label} (时间戳 ${Math.round(item.time)}s, 类型 ${
              item.category ?? 'unknown'
            })`
          );
          if (item.children?.length) {
            appendLines(item.children, depth + 1);
          }
        });
      };

      appendLines(outlineItems);
      const content = lines.join('\n');

      if (format === 'md') {
        downloadFile({ filename: `${title.replace(/\s+/g, '-')}.md`, content, mimeType: 'text/markdown' });
      } else {
        downloadFile({ filename: `${title.replace(/\s+/g, '-')}.docx`, content, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      }
    },
    [config?.export?.outlineTitle, outlineItems]
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>NotePilot · 视频学习智能助手</h1>
          <p style={{ margin: 0, color: '#5f6c8d' }}>
            拖拽 AI 生成的亮点，快速生成结构化大纲。
          </p>
        </div>
        <div style={{ color: '#4c5d8b', fontWeight: 600 }}>Demo Prototype</div>
      </header>

      <div className="main-layout">
        <section className="panel">
          <ConfigPanel
            config={config}
            onConfigUpload={handleConfigUpload}
            onVideoSelect={handleVideoSelect}
            selectedVideoId={selectedVideoId}
          />
        </section>

        <section className="panel" style={{ borderRight: 'none' }}>
          <VideoWorkspace
            video={selectedVideo}
            onHighlightDragStart={handleHighlightDragStart}
            onPlaybackUpdate={(time) => setLastPlaybackTime(time)}
          />
        </section>

        <section className="panel">
          <h2>大纲</h2>
          <OutlinePanel
            outlineItems={outlineItems}
            onRemove={handleRemoveOutlineItem}
            onDropHighlight={handleDropHighlight}
            onExport={handleExport}
          />
        </section>
      </div>
    </div>
  );
}
