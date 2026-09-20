import { useState } from 'react'
import { CONTRACT_TYPES, STUDY_LEVELS } from '../data/constants'
import { useAutosave } from '../hooks/useAutosave'
import { useStore } from '../hooks/useStore'
import type { Profile } from '../types'
import { SaveIndicator } from './SaveIndicator'
import { NumberField, SelectField, TagInput, TextArea, TextField } from './fields'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 font-semibold text-foreground">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export function ProfileForm() {
  const { data, saveProfile } = useStore()
  const [p, setP] = useState<Profile>(data.profile)
  const saveState = useAutosave(p, saveProfile)
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setP((cur) => ({ ...cur, [key]: value }))
  const full = 'sm:col-span-2'

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><SaveIndicator state={saveState} /></div>

      <Section title="Identité et recherche">
        <TextField label="Prénom" value={p.firstName} onChange={(v) => set('firstName', v)} />
        <TextField label="Nom" value={p.lastName} onChange={(v) => set('lastName', v)} />
        <TextField label="Formation" value={p.education} onChange={(v) => set('education', v)} placeholder="Ex. : Bachelor Développement web" />
        <SelectField label="Niveau d'études" value={p.studyLevel} onChange={(v) => set('studyLevel', v)} options={['', ...STUDY_LEVELS]} />
        <TextField label="Ville" value={p.city} onChange={(v) => set('city', v)} />
        <NumberField label="Rayon de mobilité (km)" value={p.mobilityRadiusKm} onChange={(v) => set('mobilityRadiusKm', v)} />
        <div className={full}><TextField label="Recherche principale" value={p.mainSearch} onChange={(v) => set('mainSearch', v)} placeholder="Ex. : Alternance développeur web full-stack, rythme 3 jours / 2 jours" /></div>
        <SelectField label="Type de contrat" value={p.contractType} onChange={(v) => set('contractType', v)} options={CONTRACT_TYPES} />
        <TextField label="Disponibilité" value={p.availability} onChange={(v) => set('availability', v)} placeholder="Ex. : septembre 2026" />
      </Section>

      <Section title="Compétences et expérience">
        <div className={full}><TagInput label="Compétences" value={p.skills} onChange={(v) => set('skills', v)} placeholder="Ex. : Gestion de projet" /></div>
        <div className={full}><TagInput label="Technologies" value={p.technologies} onChange={(v) => set('technologies', v)} placeholder="Ex. : React, Python" /></div>
        <NumberField label="Expérience — années" value={p.experienceYears} onChange={(v) => set('experienceYears', v)} />
        <NumberField label="Expérience — mois" value={p.experienceMonths} onChange={(v) => set('experienceMonths', v)} />
        <div className={full}><TextArea label="Expériences" rows={5} value={p.experiences} onChange={(v) => set('experiences', v)} hint="Poste, structure, période, missions et résultats. Un bloc par expérience." /></div>
        <div className={full}><TextArea label="Projets" rows={5} value={p.projects} onChange={(v) => set('projects', v)} hint="Projets scolaires ou personnels, technologies utilisées, liens." /></div>
        <TagInput label="Qualités" value={p.qualities} onChange={(v) => set('qualities', v)} />
        <TagInput label="Centres d'intérêt" value={p.interests} onChange={(v) => set('interests', v)} />
      </Section>

      <Section title="Liens">
        <TextField label="LinkedIn" type="url" value={p.linkedin} onChange={(v) => set('linkedin', v)} />
        <TextField label="GitHub" type="url" value={p.github} onChange={(v) => set('github', v)} />
        <div className={full}><TextField label="Portfolio" type="url" value={p.portfolio} onChange={(v) => set('portfolio', v)} /></div>
      </Section>

      <Section title="Textes complémentaires">
        <div className={full}><TextArea label="Informations complémentaires" rows={3} value={p.extraInfo} onChange={(v) => set('extraInfo', v)} /></div>
        <div className={full}>
          <TextArea label="Texte de mon CV (facultatif)" rows={6} value={p.cvText} onChange={(v) => set('cvText', v)} hint="Le PDF importé n'est pas lu par l'application. Collez ici son texte si vous voulez qu'il soit inclus directement dans les prompts ; sinon joignez le PDF dans Claude." />
        </div>
        <div className={full}>
          <TextArea label="Texte de ma lettre de motivation de base (facultatif)" rows={6} value={p.letterText} onChange={(v) => set('letterText', v)} hint="Sert de référence de style pour les lettres générées." />
        </div>
      </Section>
    </div>
  )
}
