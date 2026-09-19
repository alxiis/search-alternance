/**
 * Remplace chaque {{clé}} du template par la valeur correspondante.
 * Une clé absente ou vide devient « Non renseigné » pour que le prompt reste lisible.
 */
export function buildPrompt(template: string, data: Record<string, string | undefined>): string {
  return template
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => data[key]?.trim() || 'Non renseigné')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
