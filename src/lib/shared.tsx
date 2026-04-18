import type { CSSProperties, ReactNode } from 'react';

export type Token = { t: string; cls?: string };

export const K = (t: string): Token => ({ t, cls: 'tok-kw' });
export const T = (t: string): Token => ({ t, cls: 'tok-type' });
export const F = (t: string): Token => ({ t, cls: 'tok-fn' });
export const S = (t: string): Token => ({ t, cls: 'tok-str' });
export const N = (t: string): Token => ({ t, cls: 'tok-num' });
export const C = (t: string): Token => ({ t, cls: 'tok-cmt' });
export const P = (t: string): Token => ({ t, cls: 'tok-punct' });
export const V = (t: string): Token => ({ t, cls: 'tok-var' });

export const DartCode = ({ lines }: { lines: Token[][] }) => {
  const style: CSSProperties = { margin: 0, fontFamily: 'var(--font-mono)' };
  return (
    <pre style={style}>
      {lines.map((line, i) => (
        <div key={i} style={{ minHeight: '1.7em', lineHeight: '1.7' }}>
          {line.map((tok, j) => (
            <span key={j} className={tok.cls || ''}>
              {tok.t}
            </span>
          ))}
        </div>
      ))}
    </pre>
  );
};

export const Cursor = (): ReactNode => <span className="cursor"></span>;
