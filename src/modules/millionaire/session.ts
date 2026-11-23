import { ref } from 'vue'

/**
 * Contestant name from the registration screen. Kept in memory only, as in the legacy app. A reload
 * sends the player back to registration because the play route needs a name.
 */
export const contestantName = ref('')
