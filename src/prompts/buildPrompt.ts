/**
 * Remplace chaque {{clé}} du template par la valeur correspondante.
 * - {{clé}}  : une valeur absente ou vide devient « Non renseigné », pour que le prompt reste lisible.
 * - {{clé?}} : bloc facultatif, supprimé s'il est vide (section entière, consigne supplémentaire…).
 */
export function buildPrompt(template: string, data: Record<string, string | undefined>): string {
  return template
    .replace(/\{\{\s*(\w+)(\?)?\s*\}\}/g, (_m, key: string, optional: string | undefined) => {
      const value = data[key]?.trim() ?? ''
      return value || (optional ? '' : 'Non renseigné')
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
