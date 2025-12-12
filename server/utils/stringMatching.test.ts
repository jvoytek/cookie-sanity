import { describe, it, expect } from 'vitest';
import { levenshteinDistance, fuzzyMatch } from './stringMatching';

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('is case insensitive', () => {
    expect(levenshteinDistance('Hello', 'hello')).toBe(0);
    expect(levenshteinDistance('HELLO', 'hello')).toBe(0);
  });

  it('calculates single character insertion', () => {
    expect(levenshteinDistance('hello', 'hellow')).toBe(1);
  });

  it('calculates single character deletion', () => {
    expect(levenshteinDistance('hello', 'hell')).toBe(1);
  });

  it('calculates single character substitution', () => {
    expect(levenshteinDistance('hello', 'hallo')).toBe(1);
  });

  it('calculates multiple edits', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
  });

  it('handles empty strings', () => {
    expect(levenshteinDistance('', 'hello')).toBe(5);
    expect(levenshteinDistance('hello', '')).toBe(5);
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('handles name variations', () => {
    expect(levenshteinDistance('Alice Smith', 'Alice Smyth')).toBe(1);
    expect(levenshteinDistance('Bob Johnson', 'Bob Jonson')).toBe(1);
    expect(levenshteinDistance('Mary Jane', 'Mary Jone')).toBe(1);
  });
});

describe('fuzzyMatch', () => {
  it('returns true for identical strings', () => {
    expect(fuzzyMatch('hello', 'hello')).toBe(true);
  });

  it('returns true for case differences', () => {
    expect(fuzzyMatch('Hello', 'hello')).toBe(true);
  });

  it('returns true for distance within threshold', () => {
    expect(fuzzyMatch('Alice Smith', 'Alice Smyth', 2)).toBe(true);
    expect(fuzzyMatch('Bob Johnson', 'Bob Jonson', 2)).toBe(true);
  });

  it('returns false for distance exceeding threshold', () => {
    expect(fuzzyMatch('Alice Smith', 'Bob Johnson', 2)).toBe(false);
    expect(fuzzyMatch('hello', 'goodbye', 2)).toBe(false);
  });

  it('handles null/undefined values', () => {
    expect(fuzzyMatch(null, null)).toBe(true);
    expect(fuzzyMatch(undefined, undefined)).toBe(true);
    expect(fuzzyMatch('hello', null)).toBe(false);
    expect(fuzzyMatch(null, 'hello')).toBe(false);
  });

  it('uses default max distance of 2', () => {
    expect(fuzzyMatch('hello', 'hallo')).toBe(true); // distance 1
    expect(fuzzyMatch('hello', 'hxllo')).toBe(true); // distance 1
    expect(fuzzyMatch('hello', 'hxllz')).toBe(true); // distance 2
    expect(fuzzyMatch('hello', 'hxyzw')).toBe(false); // distance > 2
  });
});
