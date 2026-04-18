import { useState } from 'react';

const FAQS = [
  {
    q: 'Does this work in Flutter and on the server?',
    a: 'Yes. The package is pure Dart and runs on the VM, Flutter mobile, Flutter desktop, and Flutter web. Asymmetric algorithms rely on pointycastle, which is cross-platform.',
  },
  {
    q: 'Which algorithms are supported?',
    a: 'All standard JWA algorithms: HS256/384/512, RS256/384/512, PS256/384/512, ES256/256K/384/512, and EdDSA on ed25519. Fourteen in total.',
  },
  {
    q: 'How do I handle expired tokens?',
    a: 'The verify() call throws JWTExpiredException for expired tokens and JWTException for invalid signatures. Catch them separately to return proper HTTP status codes.',
  },
  {
    q: 'Can I decode a token without a key?',
    a: 'Yes — use JWT.decode(token) to inspect the header and payload. Never use it for authorization; always call JWT.verify() for tokens you trust.',
  },
  {
    q: 'How do I supply RSA / EC keys?',
    a: 'Pass PEM content as a string to RSAPrivateKey, RSAPublicKey, ECPrivateKey, ECPublicKey, or EdDSA* constructors. Use RSAPublicKey.cert() to extract from an X.509 certificate.',
  },
  {
    q: 'Is it compatible with jwt.io?',
    a: 'Yes. The library produces fully spec-compliant JWTs per RFC 7519, so tokens round-trip cleanly with jwt.io and every other compliant implementation.',
  },
  {
    q: 'Where do I report issues?',
    a: 'Open an issue on the GitHub repository linked from the pub.dev listing. Bug reports, feature requests, and PRs are all welcome.',
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section page" id="faq">
      <div className="heading-cluster">
        <div className="section-label">§ frequently asked</div>
        <h2 className="section-title">Questions that come up often.</h2>
      </div>
      <div className="faq-list">
        {FAQS.map((item, i) => (
          <div key={i} className={`faq-item ${open === i ? 'open' : ''}`}>
            <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
              <span>
                <span
                  style={{
                    color: 'var(--fg-mute)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    marginRight: 16,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                {item.q}
              </span>
              <span className="faq-toggle">+</span>
            </button>
            <div className="faq-a">{item.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
