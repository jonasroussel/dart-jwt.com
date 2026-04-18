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
export const PR = (t: string): Token => ({ t, cls: 'tok-prop' });
export const A = (t: string): Token => ({ t, cls: 'tok-accent' });

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

export const b64urlEncode = (str: string): string => {
  const b = btoa(unescape(encodeURIComponent(str)));
  return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const b64urlDecode = (str: string): string => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return atob(str);
  }
};

export async function hmacSign(alg: string, secret: string, data: string): Promise<string> {
  const algMap: Record<string, string> = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };
  const hash = algMap[alg] || 'SHA-256';
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const bytes = new Uint8Array(sig);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
