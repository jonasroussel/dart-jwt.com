// Thin TypeScript wrapper around the compiled `dart_jsonwebtoken` library.
// The compiled output (/public/jwt.js) sets window.dartJwt once its main() runs.

type RawResult = string;

interface DartJwt {
  sign(payloadJson: string, alg: string, keyPem: string): RawResult;
  verify(token: string, alg: string, keyPem: string): RawResult;
  decode(token: string): RawResult;
}

declare global {
  interface Window {
    dartJwt?: DartJwt;
    __dartJwtReady?: boolean;
  }
}

export type SignResult = { ok: true; token: string } | { ok: false; error: string };

export type VerifyResult =
  | { ok: true; header: Record<string, unknown>; payload: Record<string, unknown> }
  | { ok: false; error: string };

let loadPromise: Promise<DartJwt> | null = null;

// Inject /jwt.js on demand so the 514 KB bundle only downloads on pages that
// actually call into it (i.e. the playground). Returns the same promise on
// subsequent calls, then resolves once `window.dartJwt` is populated.
export function loadDartJwt(timeoutMs = 10000): Promise<DartJwt> {
  if (window.dartJwt && window.__dartJwtReady) return Promise.resolve(window.dartJwt);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<DartJwt>((resolve, reject) => {
    if (!document.querySelector('script[data-dart-jwt]')) {
      const tag = document.createElement('script');
      tag.src = '/jwt.js';
      tag.async = true;
      tag.dataset.dartJwt = 'true';
      tag.onerror = () => reject(new Error('failed to load /jwt.js'));
      document.head.appendChild(tag);
    }

    const start = Date.now();
    const tick = () => {
      if (window.dartJwt && window.__dartJwtReady) {
        resolve(window.dartJwt);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('dart_jsonwebtoken load timed out'));
        return;
      }
      setTimeout(tick, 50);
    };
    tick();
  }).catch((err) => {
    loadPromise = null;
    throw err;
  });

  return loadPromise;
}

export function isDartJwtReady(): boolean {
  return Boolean(window.dartJwt && window.__dartJwtReady);
}

function parseResult<T>(raw: string): T | { ok: false; error: string } {
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    return { ok: false, error: `malformed response from dart_jsonwebtoken: ${String(e)}` };
  }
}

export async function sign(
  payload: Record<string, unknown>,
  alg: string,
  keyPem: string,
): Promise<SignResult> {
  try {
    const api = await loadDartJwt();
    return parseResult<SignResult>(api.sign(JSON.stringify(payload), alg, keyPem));
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function verify(token: string, alg: string, keyPem: string): Promise<VerifyResult> {
  try {
    const api = await loadDartJwt();
    return parseResult<VerifyResult>(api.verify(token, alg, keyPem));
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function decode(
  token: string,
): Promise<
  | { ok: true; header: Record<string, unknown>; payload: Record<string, unknown> }
  | { ok: false; error: string }
> {
  try {
    const api = await loadDartJwt();
    return parseResult(api.decode(token));
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
