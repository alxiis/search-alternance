import { Copy, Plus, SlidersHorizontal, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { SearchCriteriaForm } from '../components/SearchCriteriaForm'
import { useStore } from '../hooks/useStore'
import { emptyCriteria } from '../lib/factories'
import { uid } from '../utils/id'
import { cn } from '../utils/text'

export function CriteriaPage() {
  const { data, saveCriteria, deleteCriteria, saveSettings } = useStore()
  const [selectedId, setSelectedId] = useState<string | null>(data.settings.activeCriteriaId ?? data.criteria[0]?.id ?? null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const selected = data.criteria.find((c) => c.id === selectedId) ?? data.criteria[0]
  const activeId = data.settings.activeCriteriaId

  const create = async () => {
    const c = emptyCriteria(`Recherche ${data.criteria.length + 1}`)
    await saveCriteria(c)
    setSelectedId(c.id)
  }

  const duplicate = async () => {
    if (!selected) return
    const copy = { ...selected, id: uid(), name: `${selected.name} (copie)` }
    await saveCriteria(copy)
    setSelectedId(copy.id)
  }

  if (!data.criteria.length) {
    return (
      <div className="card">
        <EmptyState icon={SlidersHorizontal} title="Aucun critère de recherche" description="Créez un profil de recherche (par exemple « Alternance développeur web Toulouse ») : il sera utilisé pour générer vos prompts.">
          <button className="btn-primary" onClick={() => void create()}><Plus className="h-4 w-4" aria-hidden /> Créer un profil de recherche</button>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <aside className="space-y-2" aria-label="Profils de recherche">
        {data.criteria.map((c) => (
          <button key={c.id} onClick={() => setSelectedId(c.id)} className={cn('card flex w-full items-center gap-2 p-3 text-left text-sm', selected?.id === c.id && 'border-brand-500 ring-2 ring-brand-500/20')}>
            <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{c.name || 'Sans nom'}</span>
            {activeId === c.id && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Active</span>}
          </button>
        ))}
        <button className="btn-secondary w-full" onClick={() => void create()}><Plus className="h-4 w-4" aria-hidden /> Nouvelle recherche</button>
      </aside>

      {selected && (
        <section className="card p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <button className="btn-secondary btn-sm" disabled={activeId === selected.id} onClick={() => void saveSettings({ activeCriteriaId: selected.id })}>
              <Star className="h-3.5 w-3.5" aria-hidden /> {activeId === selected.id ? 'Recherche active' : 'Définir comme active'}
            </button>
            <button className="btn-secondary btn-sm" onClick={() => void duplicate()}><Copy className="h-3.5 w-3.5" aria-hidden /> Dupliquer</button>
            <button className="btn-ghost btn-sm ml-auto text-rose-600 hover:bg-rose-50" onClick={() => setConfirmDelete(true)}><Trash2 className="h-3.5 w-3.5" aria-hidden /> Supprimer</button>
          </div>
          <SearchCriteriaForm key={selected.id} criteria={selected} />
        </section>
      )}

      {confirmDelete && selected && (
        <ConfirmDialog
          title="Supprimer cette recherche ?"
          message={`« ${selected.name} » sera supprimée. Vos offres ne sont pas affectées.`}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false)
            void deleteCriteria(selected.id).then(() => setSelectedId(null))
          }}
        />
      )}
    </div>
  )
}
