import { ExternalLink, History, Link2, Mail, MessageSquarePlus, Pencil, Phone, Plus, Sparkles, Trash2, UserRound } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { CHANNEL_LABELS } from '../data/constants'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { useUi } from '../hooks/useUi'
import { emptyContact } from '../lib/factories'
import { buildContactMessagePrompt, MESSAGE_KINDS, type MessageKind } from '../prompts/contactMessage'
import type { Company, Contact, ContactChannel, ContactEvent } from '../types'
import { isEmail, lastExchange } from '../utils/contacts'
import { formatDate, today } from '../utils/dates'
import { uid } from '../utils/id'
import { peopleSearchLinks } from '../utils/peopleSearch'
import { ensureProtocol, isHttpUrl } from '../utils/url'
import { ConfirmDialog } from './ConfirmDialog'
import { Modal } from './Modal'
import { PromptPanel } from './PromptPanel'
import { SelectField, TextArea, TextField } from './fields'

const CHANNELS = Object.keys(CHANNEL_LABELS) as ContactChannel[]

function ContactFormModal({ initial, onSave, onClose }: { initial: Contact; onSave: (c: Contact) => void; onClose: () => void }) {
  const [c, setC] = useState(initial)
  const set = <K extends keyof Contact>(key: K, value: Contact[K]) => setC((cur) => ({ ...cur, [key]: value }))
  const emailError = c.email.trim() && !isEmail(c.email) ? 'Adresse e-mail invalide.' : null
  const linkedin = ensureProtocol(c.linkedin)
  const linkedinError = linkedin && !isHttpUrl(linkedin) ? 'Adresse invalide.' : null
  const valid = c.name.trim() !== '' && !emailError && !linkedinError

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (valid) onSave({ ...c, name: c.name.trim(), role: c.role.trim(), email: c.email.trim(), phone: c.phone.trim(), linkedin, source: c.source.trim(), notes: c.notes.trim() })
  }

  return (
    <Modal
      title={initial.name ? 'Modifier le contact' : 'Ajouter un contact'}
      size="md"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" form="contact-form" className="btn-primary" disabled={!valid}>Enregistrer</button>
        </>
      }
    >
      <form id="contact-form" className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
        <TextField label="Nom" required value={c.name} onChange={(v) => set('name', v)} autoFocus />
        <TextField label="Fonction" value={c.role} onChange={(v) => set('role', v)} placeholder="Ex. : Chargée de recrutement" />
        <TextField label="E-mail professionnel" type="email" value={c.email} onChange={(v) => set('email', v)} error={emailError} />
        <TextField label="Téléphone" type="tel" value={c.phone} onChange={(v) => set('phone', v)} />
        <div className="sm:col-span-2"><TextField label="Profil LinkedIn" type="url" value={c.linkedin} onChange={(v) => set('linkedin', v)} placeholder="https://www.linkedin.com/in/…" error={linkedinError} /></div>
        <div className="sm:col-span-2"><TextField label="Source" value={c.source} onChange={(v) => set('source', v)} placeholder="Ex. : LinkedIn, salon, ancien élève, site de l'entreprise" hint="D'où vient ce contact : utile pour personnaliser votre message." /></div>
        <div className="sm:col-span-2"><TextArea label="Notes" rows={3} value={c.notes} onChange={(v) => set('notes', v)} /></div>
      </form>
    </Modal>
  )
}

function EventForm({ onAdd, onCancel }: { onAdd: (e: ContactEvent) => void; onCancel: () => void }) {
  const [date, setDate] = useState(today())
  const [channel, setChannel] = useState<ContactChannel>('email')
  const [note, setNote] = useState('')
  return (
    <form
      className="mt-3 grid gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        onAdd({ id: uid(), date: date || today(), channel, note: note.trim() })
      }}
    >
      <TextField label="Date" type="date" value={date} onChange={setDate} />
      <SelectField label="Canal" value={channel} onChange={(v) => setChannel(v as ContactChannel)} options={CHANNELS.map((c) => ({ value: c, label: CHANNEL_LABELS[c] }))} />
      <div className="sm:col-span-2"><TextField label="Résumé" value={note} onChange={setNote} placeholder="Ex. : candidature spontanée envoyée ; réponse : rappeler en janvier" autoFocus /></div>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" className="btn-ghost btn-sm" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn-primary btn-sm">Noter l'échange</button>
      </div>
    </form>
  )
}

/** Prompt de message (candidature spontanée, prise de contact, relance, remerciement) : la réponse est un texte à copier. */
export function ContactMessageModal({ company, contact, initialKind = 'first', onClose }: { company: Company; contact?: Contact; initialKind?: MessageKind; onClose: () => void }) {
  const { data } = useStore()
  const [kind, setKind] = useState<MessageKind>(initialKind)
  const [jobId, setJobId] = useState('')
  const [extra, setExtra] = useState('')
  const jobs = data.jobs.filter((j) => j.companyId === company.id)
  const job = jobs.find((j) => j.id === jobId)
  const text = useMemo(
    () => buildContactMessagePrompt(kind, data.profile, company, contact, job, extra),
    [kind, data.profile, company, contact, job, extra],
  )

  return (
    <Modal title={`Message — ${contact?.name || company.name}`} onClose={onClose}>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <SelectField label="Type de message" value={kind} onChange={(v) => setKind(v as MessageKind)} options={(Object.keys(MESSAGE_KINDS) as MessageKind[]).map((k) => ({ value: k, label: MESSAGE_KINDS[k].label }))} />
        {jobs.length > 0 && (
          <SelectField label="Offre concernée (facultatif)" value={jobId} onChange={setJobId} options={[{ value: '', label: 'Aucune : démarche spontanée' }, ...jobs.map((j) => ({ value: j.id, label: j.title || j.url || 'Offre sans titre' }))]} />
        )}
        <div className="sm:col-span-2"><TextArea label="Consignes supplémentaires (facultatif)" rows={2} value={extra} onChange={setExtra} placeholder="Ex. : mentionner notre rencontre au salon de l'alternance ; ton plus direct…" /></div>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">Copiez ce prompt dans Claude : il répond par un e-mail et un message LinkedIn prêts à envoyer. Pensez ensuite à noter l'échange sur la fiche du contact.</p>
      <PromptPanel text={text} />
    </Modal>
  )
}

function ContactCard({ contact, onEdit, onDelete, onAddEvent, onRemoveEvent, onMessage }: {
  contact: Contact
  onEdit: () => void
  onDelete: () => void
  onAddEvent: (e: ContactEvent) => void
  onRemoveEvent: (id: string) => void
  onMessage: () => void
}) {
  const [logging, setLogging] = useState(false)
  const last = lastExchange(contact)
  const history = [...contact.history].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <li className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{contact.name}</p>
          <p className="text-xs text-muted-foreground">{contact.role || 'Fonction inconnue'}{contact.source ? ` · ${contact.source}` : ''}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button className="btn-ghost h-8 w-8 px-0" onClick={onEdit} aria-label={`Modifier ${contact.name}`}><Pencil className="h-3.5 w-3.5" /></button>
          <button className="btn-ghost h-8 w-8 px-0 text-danger hover:bg-danger-soft" onClick={onDelete} aria-label={`Supprimer ${contact.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {(contact.email || contact.phone || contact.linkedin) && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {contact.email && <a className="inline-flex items-center gap-1 text-accent-foreground hover:underline" href={`mailto:${contact.email}`}><Mail className="h-3 w-3" aria-hidden />{contact.email}</a>}
          {contact.phone && <a className="inline-flex items-center gap-1 text-accent-foreground hover:underline" href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}><Phone className="h-3 w-3" aria-hidden />{contact.phone}</a>}
          {isHttpUrl(contact.linkedin) && <a className="inline-flex items-center gap-1 text-accent-foreground hover:underline" href={contact.linkedin} target="_blank" rel="noopener noreferrer"><Link2 className="h-3 w-3" aria-hidden />LinkedIn</a>}
        </div>
      )}
      {contact.notes && <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">{contact.notes}</p>}

      <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <History className="h-3 w-3" aria-hidden />
        {last ? `Dernier échange le ${formatDate(last)}` : 'Aucun échange noté'}
      </p>
      {history.length > 0 && (
        <ul className="mt-1 space-y-1 border-l-2 border-border pl-3">
          {history.map((e) => (
            <li key={e.id} className="group flex items-start justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{formatDate(e.date)}</span> · {CHANNEL_LABELS[e.channel]}{e.note ? ` — ${e.note}` : ''}
              </span>
              <button className="shrink-0 text-muted-foreground opacity-60 hover:text-danger hover:opacity-100" onClick={() => onRemoveEvent(e.id)} aria-label="Retirer cet échange"><Trash2 className="h-3 w-3" /></button>
            </li>
          ))}
        </ul>
      )}

      {logging ? (
        <EventForm onCancel={() => setLogging(false)} onAdd={(e) => { onAddEvent(e); setLogging(false) }} />
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-secondary btn-sm" onClick={() => setLogging(true)}><MessageSquarePlus className="h-3.5 w-3.5" aria-hidden /> Noter un échange</button>
          <button className="btn-secondary btn-sm" onClick={onMessage}><Sparkles className="h-3.5 w-3.5" aria-hidden /> Rédiger un message</button>
        </div>
      )}
    </li>
  )
}

/** Carnet de contacts d'une entreprise : interlocuteurs, historique des échanges, liens de recherche et prompts. */
export function ContactsSection({ company }: { company: Company }) {
  const { data, updateCompany, setProspectStatus } = useStore()
  const { notify } = useToast()
  const { findContacts } = useUi()
  const [editing, setEditing] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState<Contact | null>(null)
  const [messageFor, setMessageFor] = useState<Contact | null>(null)

  const activeCriteria = data.criteria.find((c) => c.id === data.settings.activeCriteriaId) ?? data.criteria[0]
  const links = peopleSearchLinks({ company: company.name, city: company.location, school: data.profile.school, jobTitle: activeCriteria?.jobTitle })
  const save = (contacts: Contact[]) => updateCompany(company.id, { contacts }).catch(() => undefined)

  const saveContact = (c: Contact) => {
    const exists = company.contacts.some((x) => x.id === c.id)
    void save(exists ? company.contacts.map((x) => (x.id === c.id ? c : x)) : [...company.contacts, c])
    setEditing(null)
  }

  const addEvent = async (contact: Contact, event: ContactEvent) => {
    await save(company.contacts.map((x) => (x.id === contact.id ? { ...x, history: [...x.history, event] } : x)))
    // Un premier échange noté vaut prise de contact : le parcours de prospection avance tout seul.
    if (company.prospectStatus === 'to_contact') {
      await setProspectStatus(company.id, 'contacted').catch(() => undefined)
      notify('Échange noté. L’entreprise passe en « Contactée », avec une relance programmée.')
    }
  }

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-foreground">Contacts ({company.contacts.length})</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary btn-sm" onClick={() => findContacts(company.id)} title="Prompt : Claude cherche les bons interlocuteurs et la voie officielle de candidature"><Sparkles className="h-3.5 w-3.5" aria-hidden /> Trouver des interlocuteurs</button>
          <button className="btn-primary btn-sm" onClick={() => setEditing(emptyContact())}><Plus className="h-3.5 w-3.5" aria-hidden /> Ajouter un contact</button>
        </div>
      </div>

      <div className="card mb-3 p-4">
        <p className="text-sm font-medium text-foreground">Chercher soi-même</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Recherches pré-remplies sur le nom de l'entreprise. Ajoutez ensuite la personne retenue avec « Ajouter un contact ».
          {data.profile.school ? '' : ' Renseignez votre école dans votre profil pour obtenir aussi la recherche d’anciens élèves.'}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {links.map((l) => (
            <li key={l.label}>
              <a className="btn-secondary btn-sm" href={l.url} target="_blank" rel="noopener noreferrer" title={l.hint}>{l.label} <ExternalLink className="h-3 w-3" aria-hidden /></a>
            </li>
          ))}
        </ul>
      </div>

      {company.contacts.length === 0 ? (
        <div className="card flex items-center gap-3 p-4 text-sm text-muted-foreground">
          <UserRound className="h-5 w-5 shrink-0" aria-hidden />
          Aucun contact pour l'instant. Une candidature adressée à une personne nommée est généralement mieux reçue qu'un envoi à une adresse générique.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {company.contacts.map((c) => (
            <ContactCard
              key={c.id}
              contact={c}
              onEdit={() => setEditing(c)}
              onDelete={() => setDeleting(c)}
              onMessage={() => setMessageFor(c)}
              onAddEvent={(e) => void addEvent(c, e)}
              onRemoveEvent={(id) => void save(company.contacts.map((x) => (x.id === c.id ? { ...x, history: x.history.filter((h) => h.id !== id) } : x)))}
            />
          ))}
        </ul>
      )}

      {editing && <ContactFormModal initial={editing} onSave={saveContact} onClose={() => setEditing(null)} />}
      {messageFor && <ContactMessageModal company={company} contact={messageFor} onClose={() => setMessageFor(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Supprimer ce contact ?"
          message={`${deleting.name} et l'historique de vos échanges seront supprimés.`}
          confirmLabel="Supprimer"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            void save(company.contacts.filter((x) => x.id !== deleting.id))
            setDeleting(null)
          }}
        />
      )}
    </section>
  )
}
