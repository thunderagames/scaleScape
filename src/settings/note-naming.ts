export type NoteNamingStyle = 'letter' | 'solfege'

const LETTER_TO_SOLFEGE: Readonly<Record<string, string>> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si'
}

/**
 * Map a note name string from letter notation to solfège.
 * Handles accidentals (#, b) by preserving them after the solfège root.
 * Also handles tuning name prefixes like "Low " and "High ".
 *
 * Examples:
 *   displayNoteName('C', 'solfege')     → 'Do'
 *   displayNoteName('F#', 'solfege')    → 'Fa#'
 *   displayNoteName('Db', 'solfege')    → 'Reb'
 *   displayNoteName('Low E', 'solfege') → 'Low Mi'
 *   displayNoteName('C', 'letter')      → 'C'
 */
export function displayNoteName(text: string, naming: NoteNamingStyle): string {
  if (naming === 'letter') return text
  if (!text) return text
  // Handle tuning prefixes: "Low E" → "Low Mi", "High E" → "High Mi"
  for (const prefix of ['Low ', 'High ']) {
    if (text.startsWith(prefix)) {
      const note_part = text.slice(prefix.length)
      const letter = note_part[0]!
      const accidental = note_part.slice(1)
      const solfege = LETTER_TO_SOLFEGE[letter] ?? note_part
      return `${prefix}${solfege}${accidental}`
    }
  }
  const letter = text[0]!
  const accidental = text.slice(1)
  const solfege = LETTER_TO_SOLFEGE[letter] ?? text
  return `${solfege}${accidental}`
}
