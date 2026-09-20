/**
 * Teintes de badges et d'icônes, avec leur variante sombre (fond translucide + texte clair,
 * pour rester lisible sans couleurs criardes). À utiliser au lieu de classes de couleur en dur.
 */
export type Tone = 'neutral' | 'sky' | 'indigo' | 'violet' | 'amber' | 'teal' | 'cyan' | 'rose' | 'emerald' | 'lime'

export const TONE_BADGE: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300',
  sky: 'bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-400/15 dark:text-indigo-300',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-300',
  cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-300',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300',
  lime: 'bg-lime-100 text-lime-800 dark:bg-lime-400/15 dark:text-lime-300',
}

/** Pastille pleine (points de statut, colonnes Kanban). */
export const TONE_DOT: Record<Tone, string> = {
  neutral: 'bg-slate-400',
  sky: 'bg-sky-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  rose: 'bg-rose-500',
  emerald: 'bg-emerald-500',
  lime: 'bg-lime-500',
}
