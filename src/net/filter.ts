const BAD = ['fuck', 'shit', 'bitch', 'bastard', 'dick', 'pussy', 'asshole', 'nigga', 'nigger', 'whore', 'mumu', 'ode', 'olodo', 'ashawo', 'werey', 'ewu', 'oloshi', 'dindin', 'mugu'];
const RE = new RegExp(`\\b(${BAD.join('|')})\\b`, 'gi');

/** Trim, cap length and mask common insults (English + Pidgin/Yoruba slurs). */
export function cleanText(text: string, max = 120): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, max).replace(RE, (w) => '*'.repeat(w.length));
}
