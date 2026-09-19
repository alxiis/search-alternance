import { useState } from 'react'
import { CONTRACT_TYPES, REMOTE_LABELS, STUDY_LEVELS } from '../data/constants'
import { useAutosave } from '../hooks/useAutosave'
import { useStore } from '../hooks/useStore'
import type { RemoteMode, SearchCriteria } from '../types'
import { SaveIndicator } from './SaveIndicator'
import { NumberField, SelectField, TagInput, TextField } from './fields'

/** À remonter avec `key={criteria.id}` pour changer de recherche. */
export function SearchCriteriaForm({ criteria }: { criteria: SearchCriteria }) {
  const { saveCriteria } = useStore()
  const [c, setC] = useState<SearchCriteria>(criteria)
  const saveState = useAutosave(c, saveCriteria)
  const set = <K extends keyof SearchCriteria>(key: K, value: SearchCriteria[K]) => setC((cur) => ({ ...cur, [key]: value }))

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><SaveIndicator state={saveState} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><TextField label="Nom de cette recherche" value={c.name} onChange={(v) => set('name', v)} placeholder="Ex. : Alternance développeur web Toulouse" /></div>
        <TextField label="Métier recherché" value={c.jobTitle} onChange={(v) => set('jobTitle', v)} placeholder="Ex. : Développeur web" />
        <SelectField label="Type de contrat" value={c.contractType} onChange={(v) => set('contractType', v)} options={CONTRACT_TYPES} />
        <div className="sm:col-span-2"><TagInput label="Mots-clés" value={c.keywords} onChange={(v) => set('keywords', v)} /></div>
        <TextField label="Ville" value={c.city} onChange={(v) => set('city', v)} />
        <NumberField label="Rayon (km)" value={c.radiusKm} onChange={(v) => set('radiusKm', v)} />
        <TagInput label="Régions" value={c.regions} onChange={(v) => set('regions', v)} placeholder="Ex. : Occitanie" />
        <SelectField
          label="Télétravail"
          value={c.remote}
          onChange={(v) => set('remote', v as RemoteMode)}
          options={(Object.keys(REMOTE_LABELS) as RemoteMode[]).map((k) => ({ value: k, label: REMOTE_LABELS[k] }))}
        />
        <SelectField label="Niveau d'étude" value={c.studyLevel} onChange={(v) => set('studyLevel', v)} options={['', ...STUDY_LEVELS]} />
        <TextField label="Date de disponibilité" type="date" value={c.availabilityDate} onChange={(v) => set('availabilityDate', v)} />
        <TagInput label="Technologies obligatoires" value={c.requiredTech} onChange={(v) => set('requiredTech', v)} />
        <TagInput label="Technologies appréciées" value={c.preferredTech} onChange={(v) => set('preferredTech', v)} />
      </div>
    </div>
  )
}
