import { useMemo, useState } from 'react'
import { useStore } from '../hooks/useStore'
import { buildCoverLetterPrompt, LETTER_FORMATS, type LetterFormat } from '../prompts/generateCoverLetter'
import { Modal } from './Modal'
import { PromptPanel } from './PromptPanel'
import { TextArea } from './fields'

interface Props {
  jobId: string
  onClose: () => void
  onImport: () => void
}

export function LetterModal({ jobId, onClose, onImport }: Props) {
  const { data } = useStore()
  const [formats, setFormats] = useState<LetterFormat[]>(['full', 'short', 'email', 'linkedin'])
  const [extra, setExtra] = useState('')
  const job = data.jobs.find((j) => j.id === jobId)
  const company = data.companies.find((c) => c.id === job?.companyId)

  const text = useMemo(
    () => (job ? buildCoverLetterPrompt(data.profile, job, company, formats, extra) : ''),
    [data.profile, job, company, formats, extra],
  )

  if (!job) return null
  const toggle = (f: LetterFormat) => setFormats((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))

  return (
    <Modal title={`Lettre de motivation — ${company?.name ?? job.title}`} onClose={onClose}>
      <fieldset className="mb-4">
        <legend className="label">Formats à générer</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {(Object.keys(LETTER_FORMATS) as LetterFormat[]).map((f) => (
            <label key={f} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-indigo-600" checked={formats.includes(f)} onChange={() => toggle(f)} />
              {LETTER_FORMATS[f].label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mb-4">
        <TextArea label="Consignes supplémentaires (facultatif)" rows={2} value={extra} onChange={setExtra} placeholder="Ex. : insister sur mon projet de fin d'année, ton plus direct…" />
      </div>
      {!job.analysis && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Cette offre n'a pas encore été analysée : la lettre s'appuiera uniquement sur votre profil et sur l'offre. Une analyse préalable donne de meilleurs résultats.
        </p>
      )}
      <PromptPanel text={text} onImport={onImport} />
    </Modal>
  )
}
