import { useState } from 'react';
import { DartCode, C, K, T, F, S, N, P, V, type Token } from '../lib/shared';

type Tab = { id: string; label: string; file: string; lines: Token[][] };

const QS_TABS: Tab[] = [
  {
    id: 'sign',
    label: '01 · Sign',
    file: 'sign.dart',
    lines: [
      [C('// 1. Build a JWT with your payload.')],
      [K('final'), V(' jwt '), P('= '), T('JWT'), P('({')],
      [V("  'id'"), P(': '), N('123'), P(',')],
      [V("  'server'"), P(': {')],
      [V("    'id'"), P(': '), S("'3e4fc296'"), P(',')],
      [V("    'loc'"), P(': '), S("'euw-2'"), P(',')],
      [V('  }'), P(',')],
      [P('});')],
      [{ t: '' }],
      [C('// 2. Sign it (default HS256).')],
      [
        K('final'),
        V(' token '),
        P('= '),
        V('jwt'),
        P('.'),
        F('sign'),
        P('('),
        T('SecretKey'),
        P('('),
        S("'secret passphrase'"),
        P('));'),
      ],
      [{ t: '' }],
      [F('print'), P('('), S("'Signed: "), V('$token'), S("'"), P(');')],
    ],
  },
  {
    id: 'verify',
    label: '02 · Verify',
    file: 'verify.dart',
    lines: [
      [C('// Verify a token. Throws on expiry or bad signature.')],
      [K('try'), P(' {')],
      [K('  final'), V(' jwt '), P('= '), T('JWT'), P('.'), F('verify'), P('(')],
      [V('    token'), P(',')],
      [T('    SecretKey'), P('('), S("'secret passphrase'"), P('),')],
      [P('  );')],
      [{ t: '' }],
      [F('  print'), P('('), S("'Payload: "), V('${jwt.payload}'), S("'"), P(');')],
      [P('} '), K('on'), T(' JWTExpiredException'), P(' {')],
      [F('  print'), P('('), S("'jwt expired'"), P(');')],
      [P('} '), K('on'), T(' JWTException'), V(' '), K('catch'), P(' (ex) {')],
      [F('  print'), P('(ex.message);'), C('  // invalid signature')],
      [P('}')],
    ],
  },
  {
    id: 'decode',
    label: '03 · Decode',
    file: 'decode.dart',
    lines: [
      [C('// Inspect without verifying — never trust for auth.')],
      [K('final'), V(' jwt '), P('= '), T('JWT'), P('.'), F('decode'), P('(token);')],
      [{ t: '' }],
      [F('print'), P('('), S("'Header:  "), V('${jwt.header}'), S("'"), P(');')],
      [F('print'), P('('), S("'Payload: "), V('${jwt.payload}'), S("'"), P(');')],
      [{ t: '' }],
      [C('// ⚠ Never use .decode for authorization — always call .verify when you need trust.')],
    ],
  },
  {
    id: 'keys',
    label: '04 · Keys',
    file: 'keys.dart',
    lines: [
      [C('// HS256 / HS384 / HS512')],
      [K('final'), V(' hmac '), P('= '), T('SecretKey'), P('('), S("'secret passphrase'"), P(');')],
      [{ t: '' }],
      [C('// RS256 / RS384 / RS512 / PS256 / PS384 / PS512')],
      [K('final'), V(' rsa '), P('= '), T('RSAPrivateKey'), P("('''")],
      [V('-----BEGIN RSA PRIVATE KEY-----')],
      [V('MIIEogIBAAKCAQEAq5QLAv9kYTgelg1IhC17KdfUoinkw…')],
      [V('-----END RSA PRIVATE KEY-----')],
      [V("'''"), P(');')],
      [{ t: '' }],
      [C('// ES256 / ES256K / ES384 / ES512')],
      [K('final'), V(' ec '), P('= '), T('ECPrivateKey'), P('('), V('pem'), P(');')],
      [{ t: '' }],
      [C('// EdDSA (ed25519)')],
      [
        K('final'),
        V(' ed '),
        P('= '),
        T('EdDSAPrivateKey'),
        P('.'),
        F('fromPEM'),
        P('('),
        V('pem'),
        P(');'),
      ],
    ],
  },
];

export default function Quickstart() {
  const [tab, setTab] = useState(0);
  const current = QS_TABS[tab];
  return (
    <section className="section page" id="quickstart">
      <div className="heading-cluster">
        <div className="section-label">§ quickstart</div>
        <h2 className="section-title">Three functions and keys. That's the whole API.</h2>
        <p className="section-subtitle">
          Everything you need to issue, inspect and authenticate tokens. The rest of your auth code
          just uses them.
        </p>
      </div>

      <div className="term">
        <div className="term-head">
          <div className="term-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="term-title">{current.file}</div>
          <div className="term-actions">
            <span>dart 3.x</span>
          </div>
        </div>
        <div className="qs-tabs">
          {QS_TABS.map((t, i) => (
            <button
              key={t.id}
              className={`qs-tab ${i === tab ? 'active' : ''}`}
              onClick={() => setTab(i)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="term-body" style={{ minHeight: 320 }}>
          <DartCode lines={current.lines} />
        </div>
      </div>
    </section>
  );
}
