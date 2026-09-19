import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Toasts, type ToastItem, type ToastKind } from '../components/Toast'
import { uid } from '../utils/id'

interface ToastApi {
  notify: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => setItems((prev) => prev.filter((t) => t.id !== id)), [])

  const notify = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = uid()
      setItems((prev) => [...prev, { id, message, kind }])
      setTimeout(() => dismiss(id), kind === 'error' ? 8000 : 4000)
    },
    [dismiss],
  )

  const api = useMemo(() => ({ notify }), [notify])
  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toasts items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit être utilisé dans <ToastProvider>')
  return ctx
}
