import { useEffect, useState } from 'react';

const ACCENT_PRESETS = [
  { id: 'green', value: '#7dff9e', label: 'matrix' },
  { id: 'cyan', value: '#5eead4', label: 'cyan' },
  { id: 'amber', value: '#fbbf24', label: 'amber' },
  { id: 'rose', value: '#fb7185', label: 'rose' },
  { id: 'violet', value: '#a78bfa', label: 'violet' },
  { id: 'sky', value: '#60a5fa', label: 'sky' },
];

export default function Tweaks() {
  const [active, setActive] = useState(false);
  const [accent, setAccent] = useState('#7dff9e');

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const t = (e.data as { type?: string })?.type;
      if (t === '__activate_edit_mode') setActive(true);
      if (t === '__deactivate_edit_mode') setActive(false);
    };
    window.addEventListener('message', onMsg);
    try {
      window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    } catch {}
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
  }, [accent]);

  const setAndPersist = (v: string) => {
    setAccent(v);
    try {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { accent: v } }, '*');
    } catch {}
  };

  if (!active) return null;
  return (
    <div className="tweaks">
      <div className="tweaks-head">
        <span>// tweaks</span>
        <span style={{ color: 'var(--fg-mute)' }}>v1</span>
      </div>
      <div className="tweak-row">
        <label>accent color</label>
        <div className="swatches">
          {ACCENT_PRESETS.map((p) => (
            <div
              key={p.id}
              className={`swatch ${accent.toLowerCase() === p.value.toLowerCase() ? 'active' : ''}`}
              style={{ background: p.value, color: p.value }}
              title={p.label}
              onClick={() => setAndPersist(p.value)}
            />
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <label>custom</label>
        <input
          type="color"
          value={accent}
          onChange={(e) => setAndPersist(e.target.value)}
          style={{
            width: '100%',
            height: 32,
            border: '1px solid var(--line)',
            borderRadius: 4,
            background: 'transparent',
          }}
        />
      </div>
    </div>
  );
}
