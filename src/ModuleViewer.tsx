const IFRAME_ALLOW = 'camera; microphone; autoplay; clipboard-write; fullscreen';

interface ModuleViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

export function ModuleViewer({ url, title, onClose }: ModuleViewerProps) {
  return (
    <div className="viewer">
      <header className="viewer-header">
        <button className="link-button" onClick={onClose}>
          ← Voltar
        </button>
        <span className="viewer-title">{title}</span>
      </header>
      <iframe className="viewer-frame" src={url} title={title} allow={IFRAME_ALLOW} />
    </div>
  );
}
