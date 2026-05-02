import type { CharacterSetOptions, PasswordConfig } from "./types.js";
import { CHAR_SETS, UNICODE_SURROGATE_START, UNICODE_SURROGATE_LENGTH, DIGEST_CHUNK_SIZE, UINT32_MAX_PLUS_ONE, UNICODE_SCALAR_COUNT, ASSIGNED_VISIBLE_CHAR_RE } from "./constants.js";

const textEncoder = new TextEncoder();

/**
 * Deduplicates characters while preserving the first-seen order.
 */
function toUniqueCharacters(input: string): string[] {
  return Array.from(new Set(Array.from(input)));
}

/**
 * Builds the allowed character pool from enabled character set flags.
 */
export function buildCharacterPool(options: CharacterSetOptions): string[] {
  const combined =
    (options.useAlphabet ? CHAR_SETS.alphabet : "") +
    (options.useNumbers ? CHAR_SETS.numbers : "") +
    (options.useBasic ? CHAR_SETS.basic : "") +
    (options.useExtended ? CHAR_SETS.extended : "");
  return toUniqueCharacters(combined);
}

/**
 * Normalizes "site or keyword" input.
 *
 * URL inputs are normalized by:
 * - stripping protocol
 * - removing leading "www."
 * - preserving hostname + path + query + hash
 * - trimming trailing slashes
 *
 * Non-URL inputs are returned as trimmed plain text.
 */
export function normalizeSiteOrKeyword(value: unknown): string {
  const input = String(value ?? "").trim();
  if (input.length === 0) {
    return "";
  }

  try {
    const url = new URL(input);
    let hostname = url.hostname;
    if (hostname.toLowerCase().startsWith("www.")) {
      hostname = hostname.slice(4);
    }

    const normalized = `${hostname}${url.pathname}${url.search}${url.hash}`;
    return normalized.replace(/\/+$/u, "");
  } catch {
    return input;
  }
}

/**
 * Converts a Unicode scalar index (surrogates removed) back to a real code point.
 */
function codePointFromScalarIndex(index: number): number {
  if (index < UNICODE_SURROGATE_START) {
    return index;
  }
  return index + UNICODE_SURROGATE_LENGTH;
}

function inRange(codePoint: number, start: number, end: number): boolean {
  return codePoint >= start && codePoint <= end;
}

/**
 * Excludes private-use ranges so generated output stays interoperable.
 */
function isPrivateUseCodePoint(codePoint: number): boolean {
  return (
    inRange(codePoint, 0xe000, 0xf8ff) ||
    inRange(codePoint, 0xf0000, 0xffffd) ||
    inRange(codePoint, 0x100000, 0x10fffd)
  );
}

/**
 * Excludes high-plane CJK extension blocks to avoid rare glyph rendering issues.
 */
function isRareCjkExtensionCodePoint(codePoint: number): boolean {
  return (
    inRange(codePoint, 0x20000, 0x2a6df) ||
    inRange(codePoint, 0x2a700, 0x2b73f) ||
    inRange(codePoint, 0x2b740, 0x2b81f) ||
    inRange(codePoint, 0x2b820, 0x2ceaf) ||
    inRange(codePoint, 0x2ceb0, 0x2ebef) ||
    inRange(codePoint, 0x2ebf0, 0x2ee5f) ||
    inRange(codePoint, 0x30000, 0x3134f) ||
    inRange(codePoint, 0x31350, 0x323af)
  );
}

/**
 * Excludes non-character code points defined by Unicode.
 */
function isNonCharacterCodePoint(codePoint: number): boolean {
  return inRange(codePoint, 0xfdd0, 0xfdef) || (codePoint & 0xfffe) === 0xfffe;
}

/**
 * Returns true when a Unicode code point is visible/assigned and not excluded
 * by private-use, rare-extension, or non-character policies.
 */
export function isAllowedAnyUnicodeCodePoint(codePoint: number): boolean {
  if (isPrivateUseCodePoint(codePoint) || isRareCjkExtensionCodePoint(codePoint) || isNonCharacterCodePoint(codePoint)) {
    return false;
  }
  return ASSIGNED_VISIBLE_CHAR_RE.test(String.fromCodePoint(codePoint));
}

/**
 * Concatenates two byte arrays.
 */
function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

/**
 * Computes a SHA-256 digest for the provided bytes.
 */
async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new Error("Web Crypto API is not available in this environment.");
  }
  const hashBuffer = await cryptoApi.subtle.digest("SHA-256", bytes as BufferSource);
  return new Uint8Array(hashBuffer);
}

/**
 * Reads a big-endian uint32 from a byte array.
 */
function uint32FromBytes(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0;
}

/**
 * Infinite deterministic byte stream from SHA-256(seed || counter).
 */
async function* digestByteStream(seedText: string): AsyncGenerator<number, void, undefined> {
  const seedBytes = textEncoder.encode(seedText);
  let counter = 0;

  while (true) {
    const counterBytes = new Uint8Array(8);
    const view = new DataView(counterBytes.buffer);
    view.setUint32(4, counter, false);

    const chunk = await sha256(concatBytes(seedBytes, counterBytes));
    counter += 1;

    for (let i = 0; i < DIGEST_CHUNK_SIZE; i += 1) {
      yield chunk[i];
    }
  }
}

/**
 * Reads the next uint32 from the digest byte stream.
 */
async function nextUint32(stream: AsyncGenerator<number, void, undefined>): Promise<number> {
  const bytes = new Uint8Array(4);
  for (let i = 0; i < 4; i += 1) {
    const step = await stream.next();
    if (step.done || step.value === undefined) {
      throw new Error("Byte stream ended unexpectedly.");
    }
    bytes[i] = step.value;
  }
  return uint32FromBytes(bytes, 0);
}

/**
 * Produces an unbiased random-like index in [0, limit) via rejection sampling.
 */
async function getUniformIndex(stream: AsyncGenerator<number, void, undefined>, limit: number): Promise<number> {
  const maxUnbiased = Math.floor(UINT32_MAX_PLUS_ONE / limit) * limit;

  while (true) {
    const candidate = await nextUint32(stream);
    if (candidate < maxUnbiased) {
      return candidate % limit;
    }
  }
}

/**
 * Generates a deterministic password from user-provided config.
 *
 * Determinism:
 * - same normalized config => same output
 * - any meaningful config change => different output
 *
 * Validation:
 * - length must be positive integer
 * - if unicode mode is disabled, at least one character set must be selected
 */
export async function generatePassword(config: PasswordConfig): Promise<string> {
  const chars = buildCharacterPool(config);
  const useAnyUnicode = Boolean(config.useAnyUnicode);
  const length = Number(config.length);

  if (!Number.isInteger(length) || length < 1) {
    throw new Error("Password length must be a positive integer.");
  }

  if (!useAnyUnicode && chars.length === 0) {
    throw new Error("Select at least one character set.");
  }

  const seed = [
    `u=${config.username}`,
    `s=${normalizeSiteOrKeyword(config.site)}`,
    `p=${config.secretPhrase ?? ""}`,
    `v=${config.version}`,
    `l=${length}`,
    `a=${useAnyUnicode ? 1 : 0}`,
    `c=${chars.join("")}`,
  ].join("|");

  const stream = digestByteStream(seed);
  let password = "";

  for (let i = 0; i < length; i += 1) {
    if (useAnyUnicode) {
      while (true) {
        const scalarIndex = await getUniformIndex(stream, UNICODE_SCALAR_COUNT);
        const codePoint = codePointFromScalarIndex(scalarIndex);
        if (isAllowedAnyUnicodeCodePoint(codePoint)) {
          password += String.fromCodePoint(codePoint);
          break;
        }
      }
    } else {
      const index = await getUniformIndex(stream, chars.length);
      password += chars[index];
    }
  }

  return password;
}

export { CHAR_SETS };
