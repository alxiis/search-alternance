import { Modal } from './Modal'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirmer', danger = true, onConfirm, onCancel }: Props) {
  return (
    <Modal
      title={title}
      size="md"
      onClose={onCancel}
      footer={
        <>
          <button className="btn-secondary" onClick={onCancel}>Annuler</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  )
}
