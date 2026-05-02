import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCharacterPool,
  CHAR_SETS,
  generatePassword,
  isAllowedAnyUnicodeCodePoint,
  normalizeSiteOrKeyword,
} from "../.test-dist/password-core.js";

function baseConfig() {
  return {
    username: "alice",
    site: "example.com",
    secretPhrase: "my secret",
    version: 1,
    length: 24,
    useAlphabet: true,
    useNumbers: true,
    useBasic: true,
    useExtended: false,
    useAnyUnicode: false,
  };
}

test("buildCharacterPool includes selected charsets", () => {
  const pool = buildCharacterPool(baseConfig());
  for (const ch of CHAR_SETS.alphabet + CHAR_SETS.numbers + CHAR_SETS.basic) {
    assert.equal(pool.includes(ch), true);
  }
  assert.equal(pool.includes("~"), false);
});

test("generatePassword is deterministic for same config", async () => {
  const config = baseConfig();
  const p1 = await generatePassword(config);
  const p2 = await generatePassword(config);
  assert.equal(p1, p2);
});

test("generatePassword changes with version", async () => {
  const c1 = baseConfig();
  const c2 = { ...baseConfig(), version: 2 };
  const p1 = await generatePassword(c1);
  const p2 = await generatePassword(c2);
  assert.notEqual(p1, p2);
});

test("normalizeSiteOrKeyword strips protocol, www, and trailing slash", () => {
  const normalized = normalizeSiteOrKeyword("https://www.example.com/");
  assert.equal(normalized, "example.com");
});

test("normalizeSiteOrKeyword keeps subdomain, path, and query", () => {
  const normalized = normalizeSiteOrKeyword("https://app.example.com/a/b/?x=1&y=2");
  assert.equal(normalized, "app.example.com/a/b/?x=1&y=2");
});

test("normalizeSiteOrKeyword keeps non-URL keyword as-is", () => {
  const normalized = normalizeSiteOrKeyword("my custom keyword");
  assert.equal(normalized, "my custom keyword");
});

test("generatePassword changes with secret phrase", async () => {
  const c1 = baseConfig();
  const c2 = { ...baseConfig(), secretPhrase: "another secret" };
  const p1 = await generatePassword(c1);
  const p2 = await generatePassword(c2);
  assert.notEqual(p1, p2);
});

test("generatePassword treats equivalent normalized URL sites as equal", async () => {
  const c1 = { ...baseConfig(), site: "https://www.example.com/" };
  const c2 = { ...baseConfig(), site: "http://example.com////" };
  const p1 = await generatePassword(c1);
  const p2 = await generatePassword(c2);
  assert.equal(p1, p2);
});

test("generatePassword output uses only chosen characters", async () => {
  const config = { ...baseConfig(), useAlphabet: false, useBasic: false, useNumbers: true };
  const pass = await generatePassword(config);
  for (const ch of pass) {
    assert.equal(CHAR_SETS.numbers.includes(ch), true);
  }
});

test("generatePassword supports any valid unicode characters", async () => {
  const config = {
    ...baseConfig(),
    useAlphabet: false,
    useNumbers: false,
    useBasic: false,
    useAnyUnicode: true,
    length: 40,
  };

  const pass = await generatePassword(config);
  for (const ch of Array.from(pass)) {
    const codePoint = ch.codePointAt(0);
    assert.notEqual(codePoint, undefined);
    assert.equal(isAllowedAnyUnicodeCodePoint(codePoint), true);
  }
});

test("unicode policy excludes private use and rare CJK extension ranges", () => {
  assert.equal(isAllowedAnyUnicodeCodePoint(0xe000), false);
  assert.equal(isAllowedAnyUnicodeCodePoint(0x20000), false);
});

test("generatePassword fails when no charset is selected", async () => {
  const config = {
    ...baseConfig(),
    useAlphabet: false,
    useNumbers: false,
    useBasic: false,
    useExtended: false,
    useAnyUnicode: false,
  };

  await assert.rejects(() => generatePassword(config), /Select at least one character set/);
});
