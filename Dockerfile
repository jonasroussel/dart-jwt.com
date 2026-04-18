# Stage 1 — compile dart_wrapper -> public/jwt.js using the official Dart SDK.
FROM dart:stable AS dart-builder
WORKDIR /dart_wrapper

COPY dart_wrapper/pubspec.yaml ./
RUN dart pub get

COPY dart_wrapper/ ./
RUN dart compile js -O2 -o /out/jwt.js web/jwt.dart

# Stage 2 — build the Astro site. We bring in the Dart output from stage 1,
# so `npm run build`'s `prebuild` hook sees public/jwt.js and skips the
# dart-compile step (dart isn't installed in this stage by design).
FROM node:22-alpine AS builder
WORKDIR /builder

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
COPY --from=dart-builder /out/jwt.js ./public/jwt.js

RUN npm run build

# Stage 3 — serve the static site.
FROM httpd:alpine AS runner
COPY --from=builder /builder/dist/ /usr/local/apache2/htdocs/
