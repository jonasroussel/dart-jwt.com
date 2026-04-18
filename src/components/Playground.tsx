import { useEffect, useRef, useState, type ReactNode } from 'react';
import { sign as dartSign, verify as dartVerify, loadDartJwt } from '../lib/dart-jwt';
import { EXAMPLE_KEYS, isHmac } from '../lib/example-keys';

const makeDefaultPayload = () => {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: '1234567890',
    name: 'Ada Lovelace',
    iss: 'jonasroussel.com',
    iat: now,
    exp: now + 24 * 60 * 60,
    admin: true,
  };
};

const b64urlDecode = (str: string): string => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return atob(str);
  }
};

const JsonView = ({ obj, type }: { obj: unknown; type: 'header' | 'payload' }) => {
  if (!obj) return null;
  const json = JSON.stringify(obj, null, 2);
  const out: ReactNode[] = [];
  let i = 0;
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+\.?\d*)|(true|false|null)|([{}\[\],])/g;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(json)) !== null) {
    if (m.index > last) out.push(<span key={`w${i++}`}>{json.slice(last, m.index)}</span>);
    if (m[1] && m[2]) {
      out.push(
        <span key={i++} className={`jv-key jv-key-${type}`}>
          {m[1]}
        </span>,
      );
      out.push(
        <span key={i++} className="jv-punct">
          {m[2]}
        </span>,
      );
    } else if (m[1]) {
      out.push(
        <span key={i++} className="jv-str">
          {m[1]}
        </span>,
      );
    } else if (m[3]) {
      out.push(
        <span key={i++} className="jv-num">
          {m[3]}
        </span>,
      );
    } else if (m[4]) {
      out.push(
        <span key={i++} className="jv-bool">
          {m[4]}
        </span>,
      );
    } else if (m[5]) {
      out.push(
        <span key={i++} className="jv-punct">
          {m[5]}
        </span>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < json.length) out.push(<span key={`w${i++}`}>{json.slice(last)}</span>);
  return <pre className="jv">{out}</pre>;
};

type ClaimInfo = { name: string; desc: string; isTime?: boolean };
const CLAIM_META: Record<string, ClaimInfo> = {
  iss: { name: 'Issuer', desc: 'Principal that issued the JWT' },
  sub: { name: 'Subject', desc: 'Principal that is the subject' },
  aud: { name: 'Audience', desc: 'Recipients the JWT is intended for' },
  exp: { name: 'Expiration Time', desc: 'After which the JWT must not be accepted', isTime: true },
  nbf: { name: 'Not Before', desc: 'Before which the JWT must not be accepted', isTime: true },
  iat: { name: 'Issued At', desc: 'Time at which the JWT was issued', isTime: true },
  jti: { name: 'JWT ID', desc: 'Unique identifier for the JWT' },
  alg: { name: 'Algorithm', desc: 'Signing algorithm' },
  typ: { name: 'Type', desc: 'Type of token' },
  kid: { name: 'Key ID', desc: 'Hint about which key was used' },
};

const ClaimsBreakdown = ({
  obj,
  type,
}: {
  obj: Record<string, unknown> | null;
  type: 'header' | 'payload';
}) => {
  if (!obj) return null;
  const entries = Object.entries(obj);
  return (
    <div className="claims">
      {entries.map(([k, v]) => {
        const meta = CLAIM_META[k];
        const display = typeof v === 'string' ? v : JSON.stringify(v);
        let timeNote: string | null = null;
        if (meta?.isTime && typeof v === 'number') {
          timeNote = new Date(v * 1000).toUTCString();
        }
        return (
          <div className="claim" key={k}>
            <div className="claim-head">
              <span className={`claim-key claim-key-${type}`}>{k}</span>
              {meta && <span className="claim-name">{meta.name}</span>}
            </div>
            <div className="claim-val">{display}</div>
            {meta && (
              <div className="claim-desc">
                {meta.desc}
                {timeNote && (
                  <>
                    {' '}
                    ·{' '}
                    <span className="mono" style={{ color: 'var(--accent)' }}>
                      {timeNote}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const SegmentedToken = ({ token }: { token: string }) => {
  if (!token) return <span style={{ color: 'var(--fg-mute)' }}>—</span>;
  const parts = token.split('.');
  return (
    <div className="seg-token">
      <span className="seg-h">{parts[0] || ''}</span>
      {parts.length > 1 && (
        <>
          <span className="seg-dot">.</span>
          <span className="seg-p">{parts[1] || ''}</span>
        </>
      )}
      {parts.length > 2 && (
        <>
          <span className="seg-dot">.</span>
          <span className="seg-s">{parts[2] || ''}</span>
        </>
      )}
    </div>
  );
};

type PanelColor = 'header' | 'payload' | 'signature' | 'mixed';

const Panel = ({
  color,
  title,
  children,
  view,
  onView,
  valid,
  validLabel,
  copyText,
}: {
  color: PanelColor;
  title: string;
  children: ReactNode;
  view?: 'json' | 'claims';
  onView?: (v: 'json' | 'claims') => void;
  valid?: boolean;
  validLabel?: string;
  copyText?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const doCopy = () => {
    if (!copyText) return;
    navigator.clipboard?.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className={`pgx-panel pgx-${color}`}>
      <div className="pgx-panel-head">
        <span className="pgx-panel-title">
          <span className={`pgx-dot pgx-dot-${color}`}></span>
          {title}
        </span>
        <div className="pgx-panel-actions">
          {view && onView && (
            <div className="pgx-toggle">
              <button className={view === 'json' ? 'on' : ''} onClick={() => onView('json')}>
                JSON
              </button>
              <button className={view === 'claims' ? 'on' : ''} onClick={() => onView('claims')}>
                Claims
              </button>
            </div>
          )}
          {copyText && (
            <button className="pgx-iconbtn" onClick={doCopy}>
              {copied ? '✓' : '⎘'}
            </button>
          )}
        </div>
      </div>
      <div className="pgx-panel-body">{children}</div>
      {valid !== undefined && (
        <div className={`pgx-valid ${valid ? 'ok' : 'err'}`}>
          <span>{valid ? '✓' : '✗'}</span>
          <span>{validLabel}</span>
        </div>
      )}
    </div>
  );
};

type LoadState = 'loading' | 'ready' | 'error';

export default function Playground() {
  const [mode, setMode] = useState<'decoder' | 'encoder'>('decoder');
  const [alg, setAlg] = useState('HS256');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const ready = loadState === 'ready';

  const [headerText, setHeaderText] = useState(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2),
  );
  const [payloadText, setPayloadText] = useState(() =>
    JSON.stringify(makeDefaultPayload(), null, 2),
  );
  const [encPrivateKey, setEncPrivateKey] = useState(EXAMPLE_KEYS.HS256.private);
  const [encodedToken, setEncodedToken] = useState('');
  const [encStatus, setEncStatus] = useState({ header: true, payload: true, key: true });
  const [encError, setEncError] = useState<string | null>(null);

  const [decodeToken, setDecodeToken] = useState('');
  const decodeTokenDirtyRef = useRef(false);
  const [decPublicKey, setDecPublicKey] = useState(EXAMPLE_KEYS.HS256.public);
  const [decoded, setDecoded] = useState<{
    header: Record<string, unknown> | null;
    payload: Record<string, unknown> | null;
  }>({ header: null, payload: null });
  const [decStatus, setDecStatus] = useState<{
    valid: boolean | null;
    signed: boolean | null;
    msg: string;
  }>({ valid: null, signed: null, msg: '' });
  const [headerView, setHeaderView] = useState<'json' | 'claims'>('json');
  const [payloadView, setPayloadView] = useState<'json' | 'claims'>('json');

  useEffect(() => {
    let cancelled = false;
    loadDartJwt()
      .then(() => {
        if (!cancelled) setLoadState('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // When alg changes: sync header.alg + auto-load example keys for that family.
  const encKeyDirtyRef = useRef(false);
  const decKeyDirtyRef = useRef(false);
  useEffect(() => {
    try {
      const h = JSON.parse(headerText);
      if (h.alg !== alg) {
        const next = { ...h, alg };
        setHeaderText(JSON.stringify(next, null, 2));
      }
    } catch {}
    const preset = EXAMPLE_KEYS[alg];
    if (preset) {
      if (!encKeyDirtyRef.current) setEncPrivateKey(preset.private);
      if (!decKeyDirtyRef.current) setDecPublicKey(preset.public);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alg]);

  // Sign whenever encoder inputs change (runs in both modes so the decoder
  // token stays in sync with the current alg/key unless the user has edited it).
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let hOk = true;
    let pOk = true;
    let h: Record<string, unknown> | undefined;
    let p: Record<string, unknown> | undefined;
    try {
      h = JSON.parse(headerText);
    } catch {
      hOk = false;
    }
    try {
      p = JSON.parse(payloadText);
    } catch {
      pOk = false;
    }
    setEncStatus({ header: hOk, payload: pOk, key: encPrivateKey.trim().length > 0 });
    if (!hOk || !pOk || !h || !p) {
      setEncodedToken('');
      setEncError(null);
      return;
    }
    const useAlg = (h.alg as string) || 'HS256';
    (async () => {
      const res = await dartSign(p!, useAlg, encPrivateKey);
      if (cancelled) return;
      if (res.ok) {
        setEncodedToken(res.token);
        setEncError(null);
        if (!decodeTokenDirtyRef.current) setDecodeToken(res.token);
      } else {
        setEncodedToken('');
        setEncError(res.error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [headerText, payloadText, encPrivateKey, ready]);

  useEffect(() => {
    if (mode !== 'decoder' || !ready) return;
    let cancelled = false;
    const t = decodeToken.trim();
    if (!t) {
      setDecoded({ header: null, payload: null });
      setDecStatus({ valid: null, signed: null, msg: 'paste a token to decode' });
      return;
    }
    const parts = t.split('.');
    if (parts.length < 2) {
      setDecoded({ header: null, payload: null });
      setDecStatus({ valid: false, signed: false, msg: 'malformed token (expected 3 segments)' });
      return;
    }
    let header: Record<string, unknown> | null = null;
    let payload: Record<string, unknown> | null = null;
    try {
      header = JSON.parse(b64urlDecode(parts[0]));
    } catch {}
    try {
      payload = JSON.parse(b64urlDecode(parts[1]));
    } catch {}
    setDecoded({ header, payload });

    if (parts.length !== 3) {
      setDecStatus({ valid: false, signed: false, msg: 'missing signature segment' });
      return;
    }
    if (!header) {
      setDecStatus({ valid: false, signed: false, msg: 'invalid header encoding' });
      return;
    }
    const useAlg = (header.alg as string) || 'HS256';
    (async () => {
      const res = await dartVerify(t, useAlg, decPublicKey);
      if (cancelled) return;
      if (res.ok) {
        setDecStatus({ valid: true, signed: true, msg: `signature verified · ${useAlg}` });
      } else {
        setDecStatus({ valid: true, signed: false, msg: res.error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [decodeToken, decPublicKey, mode, ready]);

  const algFamilyLabel = isHmac(alg) ? 'Secret' : 'PEM Key';
  const keyLabelEncoder = isHmac(alg) ? 'Shared secret' : 'Private key (PEM)';
  const keyLabelDecoder = isHmac(alg) ? 'Shared secret' : 'Public key (PEM)';

  const isEd = alg === 'EdDSA';
  const isEcdsa = alg.startsWith('E') && !isEd;
  const isRsaFamily = alg.startsWith('R') || alg.startsWith('P');
  const pubKeyType = isEd
    ? 'EdDSAPublicKey'
    : isEcdsa
      ? 'ECPublicKey'
      : isRsaFamily
        ? 'RSAPublicKey'
        : 'SecretKey';

  const onAlgChange = (next: string) => {
    // Re-enable key auto-swap for the new family, but preserve the decoder
    // token's dirty flag — if the user pasted a token to verify, changing
    // alg must not wipe it.
    encKeyDirtyRef.current = false;
    decKeyDirtyRef.current = false;
    setAlg(next);
  };

  return (
    <section className="section page" id="playground">
      <div className="heading-cluster">
        <div className="section-label">§ playground</div>
        <h2 className="section-title">Decode and encode JWTs, live.</h2>
        <p className="section-subtitle">
          The real <span className="mono">dart_jsonwebtoken</span> package running in your browser —
          compiled to JavaScript. Sign and verify with every algorithm the library supports.
        </p>
      </div>

      <div className="pgx">
        <div className="pgx-tabs">
          <button
            className={`pgx-tab ${mode === 'decoder' ? 'on' : ''}`}
            onClick={() => setMode('decoder')}
          >
            JWT Decoder
          </button>
          <button
            className={`pgx-tab ${mode === 'encoder' ? 'on' : ''}`}
            onClick={() => setMode('encoder')}
          >
            JWT Encoder
          </button>
          <div className="pgx-tabs-spacer"></div>
          {loadState === 'loading' && <span className="pgx-meta">loading dart…</span>}
          {loadState === 'error' && (
            <span className="pgx-meta" style={{ color: 'var(--red)' }}>
              dart load failed — refresh?
            </span>
          )}
          <span className="pgx-meta">alg</span>
          <select className="pg-select" value={alg} onChange={(e) => onAlgChange(e.target.value)}>
            <optgroup label="HMAC">
              <option>HS256</option>
              <option>HS384</option>
              <option>HS512</option>
            </optgroup>
            <optgroup label="RSA-PKCS1">
              <option>RS256</option>
              <option>RS384</option>
              <option>RS512</option>
            </optgroup>
            <optgroup label="RSA-PSS">
              <option>PS256</option>
              <option>PS384</option>
              <option>PS512</option>
            </optgroup>
            <optgroup label="ECDSA">
              <option>ES256</option>
              <option>ES384</option>
              <option>ES512</option>
              <option>ES256K</option>
            </optgroup>
            <optgroup label="EdDSA">
              <option>EdDSA</option>
            </optgroup>
          </select>
        </div>

        {mode === 'decoder' ? (
          <div className="pgx-grid pgx-grid-decoder">
            <Panel color="mixed" title="Encoded Token" copyText={decodeToken}>
              <textarea
                className="pgx-textarea pgx-token-input"
                value={decodeToken}
                onChange={(e) => {
                  decodeTokenDirtyRef.current = true;
                  setDecodeToken(e.target.value);
                }}
                spellCheck={false}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
              <SegmentedToken token={decodeToken} />
              <div
                className={`pgx-valid ${decStatus.valid ? 'ok' : 'err'}`}
                style={{
                  borderTop: '1px solid var(--line-soft)',
                  marginTop: 12,
                  paddingTop: 10,
                }}
              >
                <span>{decStatus.valid ? '✓' : '✗'}</span>
                <span>{decStatus.valid ? 'Well-formed JWT' : decStatus.msg}</span>
              </div>
              {decStatus.signed !== null && (
                <div className={`pgx-valid ${decStatus.signed ? 'ok' : 'err'}`}>
                  <span>{decStatus.signed ? '✓' : '✗'}</span>
                  <span>{decStatus.signed ? 'Signature Verified' : decStatus.msg}</span>
                </div>
              )}
            </Panel>

            <div className="pgx-stack">
              <Panel
                color="header"
                title="Decoded Header"
                view={headerView}
                onView={setHeaderView}
                copyText={decoded.header ? JSON.stringify(decoded.header, null, 2) : ''}
              >
                {decoded.header ? (
                  headerView === 'json' ? (
                    <JsonView obj={decoded.header} type="header" />
                  ) : (
                    <ClaimsBreakdown obj={decoded.header} type="header" />
                  )
                ) : (
                  <div className="pgx-empty">—</div>
                )}
              </Panel>

              <Panel
                color="payload"
                title="Decoded Payload"
                view={payloadView}
                onView={setPayloadView}
                copyText={decoded.payload ? JSON.stringify(decoded.payload, null, 2) : ''}
              >
                {decoded.payload ? (
                  payloadView === 'json' ? (
                    <JsonView obj={decoded.payload} type="payload" />
                  ) : (
                    <ClaimsBreakdown obj={decoded.payload} type="payload" />
                  )
                ) : (
                  <div className="pgx-empty">—</div>
                )}
              </Panel>

              <Panel color="signature" title={`${algFamilyLabel} — verify`}>
                <div className="pgx-secret-label">{keyLabelDecoder}:</div>
                <textarea
                  className={`pgx-textarea ${isHmac(alg) ? 'pgx-secret-input' : 'pgx-json-input'}`}
                  value={decPublicKey}
                  onChange={(e) => {
                    decKeyDirtyRef.current = true;
                    setDecPublicKey(e.target.value);
                  }}
                  spellCheck={false}
                  rows={isHmac(alg) ? 2 : 8}
                />
              </Panel>
            </div>
          </div>
        ) : (
          <div className="pgx-grid pgx-grid-encoder">
            <div className="pgx-stack">
              <Panel
                color="header"
                title="Header — Algorithm & Token Type"
                valid={encStatus.header}
                validLabel={encStatus.header ? 'Valid header' : 'Invalid JSON'}
              >
                <textarea
                  className="pgx-textarea pgx-json-input"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  spellCheck={false}
                  rows={5}
                />
              </Panel>

              <Panel
                color="payload"
                title="Payload — Data"
                valid={encStatus.payload}
                validLabel={encStatus.payload ? 'Valid payload' : 'Invalid JSON'}
              >
                <textarea
                  className="pgx-textarea pgx-json-input"
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                  spellCheck={false}
                  rows={9}
                />
              </Panel>

              <Panel
                color="signature"
                title={`Sign JWT — ${algFamilyLabel}`}
                valid={encStatus.key}
                validLabel={encStatus.key ? `Valid ${keyLabelEncoder.toLowerCase()}` : 'Empty key'}
              >
                <div className="pgx-secret-label">{keyLabelEncoder}:</div>
                <textarea
                  className={`pgx-textarea ${isHmac(alg) ? 'pgx-secret-input' : 'pgx-json-input'}`}
                  value={encPrivateKey}
                  onChange={(e) => {
                    encKeyDirtyRef.current = true;
                    setEncPrivateKey(e.target.value);
                  }}
                  spellCheck={false}
                  rows={isHmac(alg) ? 2 : 9}
                />
              </Panel>
            </div>

            <Panel color="mixed" title="JWT Signature — Encoded JWT" copyText={encodedToken}>
              <SegmentedToken token={encodedToken} />
              {encError && (
                <div className="pgx-valid err" style={{ marginTop: 12 }}>
                  <span>✗</span>
                  <span>{encError}</span>
                </div>
              )}
              <div className="pgx-secret-label" style={{ marginTop: 18 }}>
                Use it in your Dart code:
              </div>
              <pre className="pgx-snippet">
                <span className="tok-kw">import</span>{' '}
                <span className="tok-str">'package:dart_jsonwebtoken/dart_jsonwebtoken.dart'</span>;
                {'\n\n'}
                {isHmac(alg) ? (
                  <>
                    <span className="tok-kw">final</span> key ={' '}
                    <span className="tok-type">SecretKey</span>(
                    <span className="tok-str">
                      {`'${decPublicKey.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`}
                    </span>
                    );
                  </>
                ) : (
                  <>
                    <span className="tok-kw">final</span> pem ={' '}
                    <span className="tok-str">{`'''\n${decPublicKey}\n'''`}</span>;{'\n'}
                    <span className="tok-kw">final</span> key ={' '}
                    {isEd ? (
                      <>
                        <span className="tok-type">EdDSAPublicKey</span>.
                        <span className="tok-fn">fromPEM</span>(pem)
                      </>
                    ) : (
                      <>
                        <span className="tok-type">{pubKeyType}</span>(pem)
                      </>
                    )}
                    ;
                  </>
                )}
                {'\n\n'}
                <span className="tok-kw">try</span> {'{'}
                {'\n'}
                {'  '}
                <span className="tok-kw">final</span> jwt = <span className="tok-type">JWT</span>.
                <span className="tok-fn">verify</span>(token, key);{'\n'}
                {'  '}
                <span className="tok-fn">print</span>(jwt.payload);{'\n'}
                {'}'} <span className="tok-kw">on</span>{' '}
                <span className="tok-type">JWTExpiredException</span> {'{'}
                {'\n'}
                {'  '}
                <span className="tok-fn">print</span>(<span className="tok-str">'jwt expired'</span>
                );{'\n'}
                {'}'} <span className="tok-kw">on</span>{' '}
                <span className="tok-type">JWTException</span> <span className="tok-kw">catch</span>{' '}
                (ex) {'{'}
                {'\n'}
                {'  '}
                <span className="tok-fn">print</span>(ex.message);{'\n'}
                {'}'}
              </pre>
            </Panel>
          </div>
        )}
      </div>
    </section>
  );
}
