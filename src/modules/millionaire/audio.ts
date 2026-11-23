/** Audio assets and lazily created elements for Who Wants to Be a Millionaire. Import the controls from `useMillionaireAudio`. */

/** URLs of the Millionaire tracks and sound effects, as in the legacy app. */
export const MILLIONAIRE_SRC = {
  intro: '/assets/intro_track.mp3',
  nameLoop: '/assets/name_selection.mp3',
  nameSelected: '/assets/name_selected.mp3',
  background: {
    1: '/assets/questions_100-1000.mp3',
    2: '/assets/questions_2000-32000.mp3',
    3: '/assets/questions_64000-500000.mp3',
    4: '/assets/questions_1000000.mp3',
  },
  answerPending: '/assets/answer_choice.mp3',
  answerCorrect: '/assets/correct_answer.mp3',
  answerWrong: '/assets/wrong_answer.mp3',
} as const

/** Background track number, from 1 to 4. */
export type BackgroundLevel = 1 | 2 | 3 | 4

/** Every Millionaire audio element. They are created together on first use. */
export interface MillionaireAudioElements {
  /** Title-screen intro, played once. */
  intro: HTMLAudioElement
  /** Looping track while the contestant types a name. */
  nameLoop: HTMLAudioElement
  /** Jingle played after the name is confirmed. */
  nameSelected: HTMLAudioElement
  /** Looping background tracks, one per prize band. */
  background: Record<BackgroundLevel, HTMLAudioElement>
  /** Sound played while an answer is pending. */
  answerPending: HTMLAudioElement
  /** Sound for a correct answer. */
  answerCorrect: HTMLAudioElement
  /** Sound for a wrong answer. */
  answerWrong: HTMLAudioElement
}

let elements: MillionaireAudioElements | undefined

/**
 * Returns the Millionaire audio elements, creating them on the first call.
 * @returns The shared element set.
 */
export function millionaireAudio(): MillionaireAudioElements {
  elements ??= createElements()
  return elements
}

/**
 * Maps a 0-based question index to its background track, as the legacy app does:
 * Q1-Q5 use track 1, Q6-Q10 track 2, Q11-Q14 track 3 and Q15 track 4.
 * @param index - 0-based question index.
 * @returns The background track number.
 */
export function backgroundLevelForQuestion(index: number): BackgroundLevel {
  if (index <= 4) return 1
  if (index <= 9) return 2
  if (index <= 13) return 3
  return 4
}

/**
 * Pauses every Millionaire element and rewinds it. Does nothing when no element was created yet.
 */
export function stopAllMillionaireAudio(): void {
  if (!elements) return
  for (const element of allElements(elements)) {
    element.pause()
    element.currentTime = 0
  }
}

/**
 * Lists every element in the set.
 * @param set - The element set.
 * @returns All elements, in one flat list.
 */
export function allElements(set: MillionaireAudioElements): HTMLAudioElement[] {
  return [
    set.intro,
    set.nameLoop,
    set.nameSelected,
    ...Object.values(set.background),
    set.answerPending,
    set.answerCorrect,
    set.answerWrong,
  ]
}

/**
 * Builds the element set. Runs once, on the first {@link millionaireAudio} call.
 * @returns The new element set.
 */
function createElements(): MillionaireAudioElements {
  const loop = (src: string): HTMLAudioElement => {
    const element = new Audio(src)
    element.loop = true
    return element
  }
  return {
    intro: new Audio(MILLIONAIRE_SRC.intro),
    nameLoop: loop(MILLIONAIRE_SRC.nameLoop),
    nameSelected: new Audio(MILLIONAIRE_SRC.nameSelected),
    background: {
      1: loop(MILLIONAIRE_SRC.background[1]),
      2: loop(MILLIONAIRE_SRC.background[2]),
      3: loop(MILLIONAIRE_SRC.background[3]),
      4: loop(MILLIONAIRE_SRC.background[4]),
    },
    answerPending: new Audio(MILLIONAIRE_SRC.answerPending),
    answerCorrect: new Audio(MILLIONAIRE_SRC.answerCorrect),
    answerWrong: new Audio(MILLIONAIRE_SRC.answerWrong),
  }
}
