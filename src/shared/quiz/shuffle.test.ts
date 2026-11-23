import { describe, expect, it } from 'vitest'
import { shuffle } from './shuffle'

describe('shuffle', () => {
  it('returns the same items in a different array', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = shuffle(input)
    expect(result).not.toBe(input)
    expect([...result].sort((a, b) => a - b)).toEqual(input)
  })

  it('does not mutate the input array', () => {
    const input = ['a', 'b', 'c', 'd']
    const snapshot = [...input]
    shuffle(input)
    expect(input).toEqual(snapshot)
  })

  it('handles an empty array', () => {
    expect(shuffle([])).toEqual([])
  })

  it('keeps duplicates in the multiset', () => {
    const result = shuffle(['x', 'x', 'y'])
    expect([...result].sort()).toEqual(['x', 'x', 'y'])
  })
})
