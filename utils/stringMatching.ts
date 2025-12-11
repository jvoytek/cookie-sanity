/**
 * Calculate the Levenshtein distance between two strings.
 * The Levenshtein distance is the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one word into the other.
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns The Levenshtein distance between the two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  // Handle null/undefined cases
  if (!str1 || !str2) {
    return Math.max(str1?.length || 0, str2?.length || 0);
  }

  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Quick exit for identical strings
  if (s1 === s2) return 0;

  const len1 = s1.length;
  const len2 = s2.length;

  // Quick exit for empty strings
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Create a matrix to store distances
  const matrix: number[][] = [];

  // Initialize first column (delete all chars from str1)
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  // Initialize first row (insert all chars from str2)
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Check if two strings match with a fuzzy tolerance using Levenshtein distance.
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @param maxDistance - Maximum allowed Levenshtein distance (default: 2)
 * @returns True if the strings match within the tolerance
 */
export function fuzzyMatch(
  str1: string | null | undefined,
  str2: string | null | undefined,
  maxDistance: number = 2,
): boolean {
  if (!str1 || !str2) return str1 === str2;
  return levenshteinDistance(str1, str2) <= maxDistance;
}
