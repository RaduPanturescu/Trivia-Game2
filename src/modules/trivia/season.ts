import { defineRepository, STORAGE_KEYS, type Codec } from '@/shared/persistence'
import type { TriviaSeason } from './types'

/** Codec for the season. Any value other than `'2'` reads as season 1, as the legacy app did. */
export const seasonCodec: Codec<TriviaSeason> = {
  decode: (raw) => (raw === '2' ? '2' : '1'),
  encode: (value) => value,
}

/** Selected trivia season. Stored under `triviaSeason` as `'1'` or `'2'`. */
export const useTriviaSeason = defineRepository<TriviaSeason>({
  key: STORAGE_KEYS.triviaSeason,
  codec: seasonCodec,
  defaults: () => '1',
})
