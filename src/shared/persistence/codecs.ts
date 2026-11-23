import type { Codec } from './types'

/** Passes strings through unchanged. */
export const stringCodec: Codec<string> = {
  decode: (raw) => raw,
  encode: (value) => value,
}

/** Stores booleans as `'true'` / `'false'`, matching legacy `String(boolean)`. */
export const booleanCodec: Codec<boolean> = {
  decode: (raw) => raw === 'true',
  encode: (value) => String(value),
}

/** Stores numbers as plain decimal strings. Throws on NaN so repositories fall back to defaults. */
export const numberCodec: Codec<number> = {
  decode(raw) {
    const value = parseFloat(raw)
    if (Number.isNaN(value)) throw new Error(`Not a number: ${raw}`)
    return value
  },
  encode: (value) => String(value),
}

/**
 * Stores values as JSON text. Decoding does not validate the shape; callers own that.
 * @returns A codec for values of type `T`.
 */
export function jsonCodec<T>(): Codec<T> {
  return {
    decode: (raw) => JSON.parse(raw) as T,
    encode: (value) => JSON.stringify(value),
  }
}
