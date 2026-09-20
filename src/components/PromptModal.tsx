import type { PromptResult } from '../types'
import { Modal } from './Modal'
import { PromptPanel } from './PromptPanel'

interface Props {
  result: PromptResult
  onClose: () => void
  onImport: () => void
}

export function PromptModal({ result, onClose, onImport }: Props) {
  return (
    <Modal title={result.title} onClose={onClose}>
      <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Copiez le prompt puis ouvrez Claude.</li>
        <li>Collez-le, laissez Claude faire ses recherches.</li>
        <li>Copiez le bloc JSON final de sa réponse et revenez cliquer sur « Importer le résultat ».</li>
      </ol>
      <PromptPanel text={result.text} onImport={onImport} />
    </Modal>
  )
}
