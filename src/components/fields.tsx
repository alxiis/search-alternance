import { X } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { unique } from '../utils/text'

interface FieldProps {
  label: string
  hint?: string
  required?: boolean
  children: (id: string) => ReactNode
}

export function Field({ label, hint, required, children }: FieldProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="ml-0.5 text-rose-600" aria-hidden>*</span>}
      </label>
      {children(id)}
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
  required?: boolean
  type?: string
  placeholder?: string
  list?: string
  autoFocus?: boolean
}

export function TextField({ label, value, onChange, hint, required, type = 'text', placeholder, list, autoFocus }: TextFieldProps) {
  return (
    <Field label={label} hint={hint} required={required}>
      {(id) => (
        <input id={id} className="input" type={type} value={value} placeholder={placeholder} list={list} required={required} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  )
}

export function NumberField({ label, value, onChange, hint, min = 0 }: { label: string; value: number; onChange: (v: number) => void; hint?: string; min?: number }) {
  return (
    <Field label={label} hint={hint}>
      {(id) => <input id={id} className="input" type="number" min={min} value={value} onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))} />}
    </Field>
  )
}

export function TextArea({ label, value, onChange, hint, rows = 4, placeholder }: { label: string; value: string; onChange: (v: string) => void; hint?: string; rows?: number; placeholder?: string }) {
  return (
    <Field label={label} hint={hint}>
      {(id) => <textarea id={id} className="input" rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </Field>
  )
}

export function SelectField({ label, value, onChange, options, hint }: { label: string; value: string; onChange: (v: string) => void; options: Array<string | { value: string; label: string }>; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => {
            const opt = typeof o === 'string' ? { value: o, label: o || '—' } : o
            return <option key={opt.value} value={opt.value}>{opt.label}</option>
          })}
        </select>
      )}
    </Field>
  )
}

/** Saisie de liste : Entrée ou virgule ajoute une étiquette. */
export function TagInput({ label, value, onChange, hint, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; hint?: string; placeholder?: string }) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const parts = draft.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
    if (parts.length) onChange(unique([...value, ...parts]))
    setDraft('')
  }

  return (
    <Field label={label} hint={hint ?? 'Entrée ou virgule pour ajouter'}>
      {(id) => (
        <div className="rounded-lg border border-slate-300 bg-white p-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
          <div className="flex flex-wrap gap-1.5">
            {value.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {tag}
                <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Retirer ${tag}`} className="rounded hover:bg-brand-100">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              id={id}
              className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-slate-400"
              value={draft}
              placeholder={placeholder}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  commit()
                } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
              }}
            />
          </div>
        </div>
      )}
    </Field>
  )
}
