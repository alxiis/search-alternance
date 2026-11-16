/**
 * Secteurs proposés en prospection, traduits en codes NAF (nomenclature d'activités de l'INSEE),
 * seul critère d'activité accepté par le registre des entreprises. La liste se complète librement :
 * un code NAF s'écrit « 62.01Z » et se trouve sur la fiche de n'importe quelle entreprise du secteur visé.
 */
export interface SectorPreset {
  id: string
  label: string
  naf: string[]
}

export const SECTOR_PRESETS: SectorPreset[] = [
  { id: 'dev', label: 'Développement et conseil informatique', naf: ['62.01Z', '62.02A', '62.02B', '62.03Z', '62.09Z'] },
  { id: 'software', label: 'Édition de logiciels et jeux vidéo', naf: ['58.21Z', '58.29A', '58.29B', '58.29C'] },
  { id: 'hosting', label: 'Hébergement, données et portails web', naf: ['63.11Z', '63.12Z'] },
  { id: 'com', label: 'Communication, publicité et design', naf: ['73.11Z', '73.12Z', '70.21Z', '74.10Z'] },
  { id: 'consulting', label: 'Conseil en gestion et études de marché', naf: ['70.22Z', '73.20Z'] },
  { id: 'accounting', label: 'Comptabilité, audit et droit', naf: ['69.20Z', '69.10Z'] },
  { id: 'hr', label: 'Ressources humaines et recrutement', naf: ['78.10Z', '78.20Z', '78.30Z'] },
  { id: 'finance', label: 'Banque et assurance', naf: ['64.19Z', '65.12Z', '66.22Z'] },
  { id: 'engineering', label: "Ingénierie et bureaux d'études", naf: ['71.12B', '71.20B', '72.19Z'] },
  { id: 'aero', label: 'Aéronautique et spatial', naf: ['30.30Z'] },
  { id: 'ecommerce', label: 'Vente en ligne', naf: ['47.91A', '47.91B'] },
  { id: 'realestate', label: 'Immobilier', naf: ['68.31Z', '68.32A'] },
  { id: 'building', label: 'Bâtiment et construction', naf: ['41.20A', '41.20B', '43.21A', '43.22A'] },
  { id: 'logistics', label: 'Transport et logistique', naf: ['49.41A', '49.41B', '52.10B', '52.29A', '52.29B'] },
  { id: 'hospitality', label: 'Hôtellerie et restauration', naf: ['55.10Z', '56.10A', '56.10C'] },
]

/** Tranches d'effectif du registre (codes INSEE), regroupées pour l'interface. */
export interface SizePreset {
  id: string
  label: string
  codes: string[]
}

export const SIZE_PRESETS: SizePreset[] = [
  { id: 'tiny', label: '1 à 9 salariés', codes: ['01', '02', '03'] },
  { id: 'small', label: '10 à 49 salariés', codes: ['11', '12'] },
  { id: 'medium', label: '50 à 249 salariés', codes: ['21', '22', '31'] },
  { id: 'large', label: '250 salariés et plus', codes: ['32', '41', '42', '51', '52', '53'] },
]

/** Libellé d'une tranche d'effectif INSEE. */
export const SIZE_LABELS: Record<string, string> = {
  NN: 'Sans salarié',
  '00': 'Sans salarié',
  '01': '1 à 2 salariés',
  '02': '3 à 5 salariés',
  '03': '6 à 9 salariés',
  '11': '10 à 19 salariés',
  '12': '20 à 49 salariés',
  '21': '50 à 99 salariés',
  '22': '100 à 199 salariés',
  '31': '200 à 249 salariés',
  '32': '250 à 499 salariés',
  '41': '500 à 999 salariés',
  '42': '1 000 à 1 999 salariés',
  '51': '2 000 à 4 999 salariés',
  '52': '5 000 à 9 999 salariés',
  '53': '10 000 salariés et plus',
}

/** « 6201z », « 62.01 Z » → « 62.01Z ». Renvoie '' si ce n'est pas un code NAF. */
export function normalizeNaf(value: string): string {
  const m = /^(\d{2})\.?(\d{2})\s?([a-z])$/i.exec(value.trim())
  return m ? `${m[1]}.${m[2]}${(m[3] ?? '').toUpperCase()}` : ''
}
