# Passless Keysmith

Passless Keysmith is a deterministic, client-side password generator.

URL: [passless-keysmith.com](https://passless-keysmith.com)

For the same input configuration, it always produces the same password. It has no backend dependency and the production artifact is a single `dist/index.html` file with inline CSS and JS.

## Why this project exists

- Avoid storing passwords in a database or password file.
- Regenerate passwords on demand from remembered inputs.
- Keep deployment simple: one portable HTML file.

## How password generation works

The core algorithm lives in `src/password-core.ts` and is reused by app UI and tests.

High-level flow:

1. Build allowed character pool from selected options.
2. Normalize site input (`https://www.example.com/` -> `example.com`).
3. Build deterministic seed string from config fields.
4. Produce a deterministic byte stream using repeated `SHA-256(seed || counter)`.
5. Map stream bytes to output characters using unbiased sampling.
6. If `useAnyUnicode` is enabled, sample from Unicode scalar space and filter disallowed code points.

Determinism guarantees:

- same config -> same output
- changed username/site/secret/version/length/options -> different output (practically)

## Project structure

- `src/template.html`: HTML template used for build-time inlining
- `src/styles.css`: source stylesheet
- `src/app.ts`: browser UI behavior and event wiring
- `src/password-core.ts`: typed deterministic password algorithm
- `src/types.ts`: shared type definitions
- `src/constants.ts`: constants used by core algorithm
- `scripts/build.mjs`: production build (`dist/index.html`)
- `scripts/build-test-core.mjs`: test-only bundle output (`.test-dist/password-core.js`)
- `tests/password-core.test.js`: Node unit tests for core
- `tests/browser-tests.html`: browser-run test page
- `dist/index.html`: final production artifact
- `APP.md`: original requirement notes

## Requirements

- Node.js 20+ (tested with Node 22)
- pnpm

## Install

```bash
pnpm install
```

## Build

Creates a single deployable file:

```bash
pnpm run build
```

Output:

- `dist/index.html`

Notes:

- CSS is loaded from `src/styles.css` and inlined into template.
- TS UI code is bundled and inlined into template script slot.

## Run tests

### Node tests

```bash
pnpm test
```

This runs:

1. `pnpm run build:test-core` to produce `.test-dist/password-core.js`
2. `node --test tests/password-core.test.js`

### Browser tests

```bash
pnpm run test:browser
```

Then open:

- `http://localhost:4173/tests/browser-tests.html`

## Public core API

From `src/password-core.ts`:

- `buildCharacterPool(options: CharacterSetOptions): string[]`
- `normalizeSiteOrKeyword(value: unknown): string`
- `isAllowedAnyUnicodeCodePoint(codePoint: number): boolean`
- `generatePassword(config: PasswordConfig): Promise<string>`
- `CHAR_SETS`

Main types from `src/types.ts`:

- `CharacterSetOptions`
- `PasswordConfig`

## Security and privacy notes

- Password generation happens locally in browser runtime.
- No password material is sent to a backend by this app itself.
- Generated passwords are deterministic from inputs, so secret phrase quality matters.
- The app includes a privacy notice and privacy-policy overlay in UI.

## Maintenance tips

- Keep algorithm logic in `src/password-core.ts` as single source of truth.
- Keep UI logic (`src/app.ts`) separate from deterministic core.
- If you change seed fields/order or charset constants, outputs will change.
- Update tests whenever behavior changes intentionally.

## Common commands

```bash
pnpm run build          # build dist/index.html
pnpm run build:test-core  # build .test-dist/password-core.js for tests
pnpm test               # run Node tests
pnpm run test:browser   # serve project for browser tests
```
