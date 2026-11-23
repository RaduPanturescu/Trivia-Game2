import type { Achievement } from './types'

/** The ten built-in achievements, in legacy display order. All start locked. */
export const BUILT_IN_ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'eu', name: 'JPD to Bangladesh', desc: 'Complete the EU category.', image: '/assets/eu_flag.png', unlocked: false },
  { id: 'hungary', name: 'Bozmeg Orban!', desc: 'Complete the Hungarian Politics category.', image: '/assets/orban.png', unlocked: false },
  { id: 'romania', name: 'Combinatie!', desc: 'Complete the Romanian Politics category.', image: '/assets/romania_ach.png', unlocked: false },
  { id: 'trains', name: "I'm not autistic I swear", desc: 'Complete the Trains category.', image: '/assets/train_ach.png', unlocked: false },
  { id: 'personal', name: 'Amiga + promotion', desc: 'Complete the Radu Questions category.', image: '/assets/cat_ring.png', unlocked: false },
  { id: 'sudoCute', name: 'You so sudoCUTE', desc: 'Win your first Sudoku game.', image: '/assets/sudoku_achievement.png', unlocked: false },
  { id: 'millionaire', name: 'Congrats! you are a Forint millionaire (still poor)', desc: 'Complete the Millionaire game.', image: '/assets/millionaire_achievement.png', unlocked: false },
  { id: 'minesweeper', name: "You the bomb, but I'm the one about to explode", desc: 'Win the Minesweeper game.', image: '/assets/minesweeper_achievement.png', unlocked: false },
  { id: 'mayaOverload', name: '⚠️ Maya Overload ⚠️', desc: 'Click Maya until she overloads.', image: '/assets/Maya_achievement.png', unlocked: false },
  { id: 'hackerAttempt', name: "I'm in!", desc: 'Fail to enter the Dev password 5 times in a row.', image: '/assets/hacker_achievement.png', unlocked: false },
]
