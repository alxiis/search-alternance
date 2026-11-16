import { emptyContact } from '../lib/factories'
import type { Contact } from '../types'
import { normalizeText } from './text'

/** Champs d'un contact venant d'une source externe (import Claude, registre des entreprises). */
export type ContactInput = Pick<Contact, 'name'> & Partial<Pick<Contact, 'role' | 'email' | 'phone' | 'linkedin' | 'source' | 'notes'>>

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Même personne : même adresse e-mail, ou même nom (sans tenir compte des accents ni de la casse). */
function sameContact(a: Contact, b: ContactInput): boolean {
  const mailA = a.email.trim().toLowerCase()
  const mailB = (b.email ?? '').trim().toLowerCase()
  if (mailA && mailB) return mailA === mailB
  const nameA = normalizeText(a.name)
  return nameA !== '' && nameA === normalizeText(b.name)
}

const fill = (current: string, incoming: string | undefined): string => (current.trim() ? current : (incoming ?? '').trim())

/**
 * Ajoute des contacts à une liste sans créer de doublon : un contact déjà connu est seulement complété
 * (ses champs remplis, ses notes et son historique ne sont jamais écrasés).
 */
export function mergeContacts(base: Contact[], incoming: ContactInput[]): Contact[] {
  const result = [...base]
  for (const input of incoming) {
    if (!input.name.trim() && !(input.email ?? '').trim()) continue
    const index = result.findIndex((c) => sameContact(c, input))
    const current = result[index]
    if (current) {
      result[index] = {
        ...current,
        role: fill(current.role, input.role),
        email: fill(current.email, input.email),
        phone: fill(current.phone, input.phone),
        linkedin: fill(current.linkedin, input.linkedin),
        source: fill(current.source, input.source),
        notes: fill(current.notes, input.notes),
      }
    } else {
      result.push({
        ...emptyContact(input.name.trim()),
        role: (input.role ?? '').trim(),
        email: (input.email ?? '').trim(),
        phone: (input.phone ?? '').trim(),
        linkedin: (input.linkedin ?? '').trim(),
        source: (input.source ?? '').trim(),
        notes: (input.notes ?? '').trim(),
      })
    }
  }
  return result
}

/** Date du dernier échange noté avec un contact, ou null. */
export function lastExchange(contact: Contact): string | null {
  return contact.history.reduce<string | null>((latest, e) => (latest === null || e.date > latest ? e.date : latest), null)
}
