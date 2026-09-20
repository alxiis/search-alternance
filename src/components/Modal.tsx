import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '../utils/text'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg' | 'xl'
}

const SIZES = { md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' }

/** Pile des modales ouvertes : seule la plus récente réagit à Échap. */
const openModals: symbol[] = []

export function Modal({ title, onClose, children, footer, size = 'lg' }: Props) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // Capturé au premier rendu, avant qu'un champ de la modale ne prenne le focus.
  const trigger = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null)

  useEffect(() => {
    const token = Symbol('modal')
    openModals.push(token)
    const previous = trigger.current
    const previousOverflow = document.body.style.overflow
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openModals[openModals.length - 1] === token) onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus()
    return () => {
      openModals.splice(openModals.indexOf(token), 1)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      previous?.focus?.()
    }
  }, [])

  return (
    <div className="animate-overlay fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn('animate-panel flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-border bg-card shadow-2xl outline-none sm:max-h-[90vh] sm:rounded-2xl', SIZES[size])}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 id={titleId} className="page-title">{title}</h2>
          <button onClick={onClose} className="btn-ghost -mr-2 h-9 w-9 px-0" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-muted/40 px-5 py-3 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  )
}
