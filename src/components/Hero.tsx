import { useEffect, useState } from 'react';
import { DartCode, Cursor, C, K, T, F, S, N, P, V, type Token } from '../lib/shared';

type Step =
  | { kind: 'prompt'; text: string }
  | { kind: 'code'; lines: Token[][] }
  | { kind: 'run-out' };

const HERO_SCRIPT: Step[] = [
  { kind: 'prompt', text: 'cat sign_and_verify.dart' },
  {
    kind: 'code',
    lines: [
      [C('// Build, sign and verify — all in one file.')],
      [K('final'), V(' jwt '), P('= '), T('JWT'), P('(')],
      [P('  {'), S("'id'"), P(': '), N('42'), P(', '), S("'role'"), P(': '), S("'admin'"), P('},')],
      [V('  issuer'), P(': '), S("'jonasroussel.com'"), P(',')],
      [V('  subject'), P(': '), S("'user_42'"), P(',')],
      [P(');')],
      [{ t: '' }],
      [K('final'), V(' key '), P('= '), T('SecretKey'), P('('), S("'my-secret'"), P(');')],
      [
        K('final'),
        V(' token '),
        P('= '),
        V('jwt'),
        P('.'),
        F('sign'),
        P('(key, '),
        V('expiresIn'),
        P(': '),
        T('Duration'),
        P('('),
        V('hours'),
        P(': '),
        N('24'),
        P('));'),
      ],
      [{ t: '' }],
      [K('final'), V(' verified '), P('= '), T('JWT'), P('.'), F('verify'), P('(token, key);')],
      [F('print'), P('('), S("'payload: "), V('${verified.payload}'), S("'"), P(');')],
    ],
  },
  { kind: 'prompt', text: 'dart run sign_and_verify.dart' },
  { kind: 'run-out' },
];

export default function Hero() {
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState<string[]>(['', '', '', '']);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (step >= HERO_SCRIPT.length) {
      setDone(true);
      return;
    }
    const item = HERO_SCRIPT[step];

    if (item.kind === 'prompt') {
      let i = 0;
      const full = item.text;
      const id = setInterval(() => {
        i++;
        setTyped((prev) => {
          const copy = [...prev];
          copy[step] = full.slice(0, i);
          return copy;
        });
        if (i >= full.length) {
          clearInterval(id);
          setTimeout(() => setStep((s) => s + 1), 450);
        }
      }, 38);
      return () => clearInterval(id);
    }
    const delay = item.kind === 'run-out' ? 200 : 600;
    const id = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(id);
  }, [step]);

  const restart = () => {
    setStep(0);
    setTyped(['', '', '', '']);
    setDone(false);
  };

  const renderStep = (item: Step, i: number) => {
    if (i > step) return null;
    const isLast = i === step;
    if (item.kind === 'prompt') {
      return (
        <div key={i} style={{ marginTop: i > 0 ? 18 : 0 }}>
          <span className="tok-accent">➜ </span>
          <span style={{ color: 'var(--blue)' }}>~/auth </span>
          <span>{typed[i]}</span>
          {isLast && !done && <Cursor />}
        </div>
      );
    }
    if (item.kind === 'code') {
      return (
        <div
          key={i}
          style={{
            marginTop: 10,
            paddingLeft: 12,
            borderLeft: '2px solid var(--line)',
          }}
        >
          <DartCode lines={item.lines} />
        </div>
      );
    }
    if (item.kind === 'run-out') {
      return (
        <div key={i} style={{ marginTop: 10 }}>
          <div style={{ color: 'var(--fg-mute)', fontSize: 12.5 }}>
            <span style={{ color: 'var(--accent)' }}>→ </span>
            <span>signed </span>
            <span style={{ color: 'var(--fg-dim)', wordBreak: 'break-all' }}>
              eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzQyIiwiaXNzIjoiam9uYXNyb3Vzc2VsLmNvbSJ9.Tx7c…
            </span>
          </div>
          <div style={{ marginTop: 8, color: 'var(--accent)' }}>✓ signature valid</div>
          <div style={{ color: 'var(--fg-dim)', marginTop: 4 }}>
            payload:{' '}
            <span style={{ color: 'var(--fg)' }}>
              {`{ id: 42, role: admin, iss: jonasroussel.com, sub: user_42, exp: ${Math.floor(Date.now() / 1000) + 24 * 60 * 60} }`}
            </span>
          </div>
          {done && (
            <div style={{ marginTop: 14 }}>
              <span className="tok-accent">➜ </span>
              <span style={{ color: 'var(--blue)' }}>~/auth </span>
              <Cursor />
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const copy = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    navigator.clipboard?.writeText('dart pub add dart_jsonwebtoken');
    target.textContent = '✓ copied';
    setTimeout(() => {
      target.textContent = 'copy';
    }, 1500);
  };

  return (
    <section className="hero page">
      <div className="hero-grid">
        <div>
          <div className="chip">
            <span className="chip-dot"></span>
            <span>v3.4.0 · null-safe · all algorithms</span>
          </div>
          <h1>
            JSON Web Tokens
            <br />
            for <span className="accent">Dart</span>, done right.
          </h1>
          <p className="tagline">
            An easy-to-use JWT (RFC 7519) implementation for Dart. Sign, decode and verify — every
            standard algorithm, in just a few lines.
          </p>
          <div className="hero-actions">
            <a href="#quickstart" className="btn btn-primary">
              <span>$ get started</span>
              <span className="arr">→</span>
            </a>
            <a
              href="https://pub.dev/packages/dart_jsonwebtoken"
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
            >
              <span>view on pub.dev</span>
              <span className="arr">↗</span>
            </a>
          </div>
          <div className="hero-meta">
            <div>
              <strong>800K+</strong> downloads
            </div>
            <div>
              <strong>357</strong> likes
            </div>
            <div>
              <strong>MIT</strong> licensed
            </div>
            <div>
              <strong>14</strong> algorithms
            </div>
          </div>
        </div>
        <div>
          <div
            className="term reg-corners"
            onClick={restart}
            style={{ cursor: 'pointer' }}
            title="click to replay"
          >
            <div className="term-head">
              <div className="term-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="term-title">— zsh — dart_jsonwebtoken demo —</div>
              <div className="term-actions">
                <span style={{ fontSize: 11 }}>↻ click to replay</span>
              </div>
            </div>
            <div
              className="term-body"
              style={{
                height: 540,
                overflow: 'auto',
                width: '100%',
                minWidth: 0,
              }}
            >
              {HERO_SCRIPT.map((item, i) => renderStep(item, i))}
            </div>
          </div>
        </div>
      </div>

      <div className="install">
        <div className="install-tabs">
          <div className="install-tab active">pub</div>
        </div>
        <div className="install-code">
          <span className="prompt">$</span>
          <span>dart pub add dart_jsonwebtoken</span>
        </div>
        <button className="install-copy" onClick={copy}>
          copy
        </button>
      </div>
    </section>
  );
}
