// Thin JS-interop wrapper around `dart_jsonwebtoken`.
// Compiled with `dart compile js` and loaded by the playground.
@JS()
library jwt_wrapper;

import 'dart:convert';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';

import 'package:dart_jsonwebtoken/dart_jsonwebtoken.dart';

JWTAlgorithm _alg(String name) {
  switch (name) {
    case 'HS256':
      return JWTAlgorithm.HS256;
    case 'HS384':
      return JWTAlgorithm.HS384;
    case 'HS512':
      return JWTAlgorithm.HS512;
    case 'RS256':
      return JWTAlgorithm.RS256;
    case 'RS384':
      return JWTAlgorithm.RS384;
    case 'RS512':
      return JWTAlgorithm.RS512;
    case 'PS256':
      return JWTAlgorithm.PS256;
    case 'PS384':
      return JWTAlgorithm.PS384;
    case 'PS512':
      return JWTAlgorithm.PS512;
    case 'ES256':
      return JWTAlgorithm.ES256;
    case 'ES256K':
      return JWTAlgorithm.ES256K;
    case 'ES384':
      return JWTAlgorithm.ES384;
    case 'ES512':
      return JWTAlgorithm.ES512;
    case 'EdDSA':
      return JWTAlgorithm.EdDSA;
  }
  throw ArgumentError('unknown alg $name');
}

bool _isHmac(String alg) => alg.startsWith('HS');
bool _isRsa(String alg) => alg.startsWith('RS') || alg.startsWith('PS');
bool _isEc(String alg) => alg.startsWith('ES');
bool _isEd(String alg) => alg == 'EdDSA';

JWTKey _privateKey(String alg, String pemOrSecret) {
  if (_isHmac(alg)) return SecretKey(pemOrSecret);
  if (_isRsa(alg)) return RSAPrivateKey(pemOrSecret);
  if (_isEc(alg)) return ECPrivateKey(pemOrSecret);
  if (_isEd(alg)) return EdDSAPrivateKey.fromPEM(pemOrSecret);
  throw ArgumentError('unsupported alg $alg');
}

JWTKey _publicKey(String alg, String pemOrSecret) {
  if (_isHmac(alg)) return SecretKey(pemOrSecret);
  if (_isRsa(alg)) return RSAPublicKey(pemOrSecret);
  if (_isEc(alg)) return ECPublicKey(pemOrSecret);
  if (_isEd(alg)) return EdDSAPublicKey.fromPEM(pemOrSecret);
  throw ArgumentError('unsupported alg $alg');
}

/// JSON-encoded result for JS callers.
JSString _sign(JSString payloadJson, JSString alg, JSString keyPem) {
  try {
    final payload = jsonDecode(payloadJson.toDart) as Map<String, dynamic>;
    final jwt = JWT(payload);
    final token = jwt.sign(
      _privateKey(alg.toDart, keyPem.toDart),
      algorithm: _alg(alg.toDart),
    );
    return jsonEncode({'ok': true, 'token': token}).toJS;
  } catch (e) {
    return jsonEncode({'ok': false, 'error': e.toString()}).toJS;
  }
}

JSString _verify(JSString token, JSString alg, JSString keyPem) {
  try {
    final jwt = JWT.verify(
      token.toDart,
      _publicKey(alg.toDart, keyPem.toDart),
      checkHeaderType: false,
    );
    return jsonEncode({
      'ok': true,
      'header': jwt.header,
      'payload': jwt.payload,
    }).toJS;
  } on JWTException catch (e) {
    return jsonEncode({'ok': false, 'error': e.message}).toJS;
  } catch (e) {
    return jsonEncode({'ok': false, 'error': e.toString()}).toJS;
  }
}

JSString _decode(JSString token) {
  try {
    final jwt = JWT.decode(token.toDart);
    return jsonEncode({
      'ok': true,
      'header': jwt.header,
      'payload': jwt.payload,
    }).toJS;
  } catch (e) {
    return jsonEncode({'ok': false, 'error': e.toString()}).toJS;
  }
}

void main() {
  final api = JSObject();
  api.setProperty('sign'.toJS, _sign.toJS);
  api.setProperty('verify'.toJS, _verify.toJS);
  api.setProperty('decode'.toJS, _decode.toJS);
  globalContext.setProperty('dartJwt'.toJS, api);
  globalContext.setProperty('__dartJwtReady'.toJS, true.toJS);
}
