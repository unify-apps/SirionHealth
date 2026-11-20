/** Titles and labels are Title Case across the app ("Product Adoption", "Needs Attention").
 *  Short joining words stay lower unless first; acronyms (CSM, NRR, IT) and words already capitalised are kept. */
const SMALL = /^(a|an|and|as|at|by|for|in|of|on|or|per|the|to|vs|via)$/i
export const titleCase = (s: string) =>
  s.replace(/[A-Za-z][\w'’-]*/g, (w, i: number) => (i > 0 && SMALL.test(w) ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1)))

/** Title Case a node only when it is plain text; elements pass through. */
export const tc = <T,>(n: T): T => (typeof n === 'string' ? (titleCase(n) as T) : n)
