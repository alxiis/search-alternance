import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '../utils/text'

export type ToastKind = 'success' | 'error' | 'info'
export interface ToastItem {
  id: string
  message: string
  kind: ToastKind
}

const STYLES: Record<ToastKind, { box: string; icon: typeof Info }> = {
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: CheckCircle2 },
  error: { box: 'border-rose-200 bg-rose-50 text-rose-900', icon: AlertTriangle },
  info: { box: 'border-slate-200 bg-white text-slate-800', icon: Info },
}

export function Toasts({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6" aria-live="polite">
      {items.map((t) => {
        const { box, icon: Icon } = STYLES[t.kind]
        return (
          <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'} className={cn('pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-3 text-sm shadow-lg', box)}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p className="flex-1">{t.message}</p>
            <button onClick={() => onDismiss(t.id)} className="rounded p-0.5 opacity-60 hover:opacity-100" aria-label="Fermer la notification">
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
