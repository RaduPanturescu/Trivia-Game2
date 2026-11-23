/** One multiple-choice question in the legacy shape shared by category trivia and Question of the Day. */
export type QuizQuestion = {
  /** Question text. */
  q: string
  /** Answer texts, in display order. */
  options: string[]
  /** Index into `options` of the correct answer. */
  answer: number
}
