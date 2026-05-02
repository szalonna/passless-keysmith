export const CHAR_SETS: Record<"alphabet" | "numbers" | "basic" | "extended", string> = {
    alphabet: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers: "0123456789",
    basic: "!?.,;:-_@#$%&*+=()[]{}",
    extended: "\"'`~/\\|<>^",
};

export const DIGEST_CHUNK_SIZE = 32;
export const UINT32_MAX_PLUS_ONE = 0x100000000;
export const UNICODE_SURROGATE_START = 0xd800;
export const UNICODE_SURROGATE_LENGTH = 0x800;
export const UNICODE_SCALAR_COUNT = 0x110000 - UNICODE_SURROGATE_LENGTH;
export const ASSIGNED_VISIBLE_CHAR_RE = /[\p{L}\p{N}\p{P}\p{S}]/u;