import { booleanCodec, defineRepository, numberCodec, STORAGE_KEYS } from './persistence'

/** Background music on/off, stored as `'true'` / `'false'` under `triviaMusicPref`. */
export const useMusicEnabled = defineRepository({
  key: STORAGE_KEYS.triviaMusicPref,
  codec: booleanCodec,
  defaults: () => true,
})

/** Background music volume (0-1), stored as a decimal string under `triviaMusicVolume`. */
export const useMusicVolume = defineRepository({
  key: STORAGE_KEYS.triviaMusicVolume,
  codec: numberCodec,
  defaults: () => 0.2,
})

/** Sound effects on/off, stored as `'true'` / `'false'` under `triviaSoundPref`. */
export const useSoundEnabled = defineRepository({
  key: STORAGE_KEYS.triviaSoundPref,
  codec: booleanCodec,
  defaults: () => true,
})

/** Sound effects volume (0-1), stored as a decimal string under `triviaSfxVolume`. */
export const useSfxVolume = defineRepository({
  key: STORAGE_KEYS.triviaSfxVolume,
  codec: numberCodec,
  defaults: () => 0.3,
})
