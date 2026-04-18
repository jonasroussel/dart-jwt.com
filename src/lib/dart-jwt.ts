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

export async function waitForDartJwt(timeoutMs = 5000): Promise<DartJwt> {
  const start = Date.now();
  while (!window.dartJwt || !window.__dartJwtReady) {
    if (Date.now() - start > timeoutMs) throw new Error('dart_jsonwebtoken failed to load');
    await new Promise((r) => setTimeout(r, 50));
  }
  return window.dartJwt;
}

export function isDartJwtReady(): boolean {
  return Boolean(window.dartJwt && window.__dartJwtReady);
}

export async function sign(
  payload: Record<string, unknown>,
  alg: string,
  keyPem: string,
): Promise<SignResult> {
  const api = await waitForDartJwt();
  return JSON.parse(api.sign(JSON.stringify(payload), alg, keyPem)) as SignResult;
}

export async function verify(token: string, alg: string, keyPem: string): Promise<VerifyResult> {
  const api = await waitForDartJwt();
  return JSON.parse(api.verify(token, alg, keyPem)) as VerifyResult;
}

export async function decode(
  token: string,
): Promise<
  | { ok: true; header: Record<string, unknown>; payload: Record<string, unknown> }
  | { ok: false; error: string }
> {
  const api = await waitForDartJwt();
  return JSON.parse(api.decode(token));
}
