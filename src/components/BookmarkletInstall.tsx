import { BookmarkPlus, Copy } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useToast } from '../hooks/useToast'
import { copyText } from '../lib/clipboard'
import { bookmarkletCode } from '../services/capture'

/** Bouton de capture à glisser dans la barre de favoris, avec son mode d'emploi. */
export function BookmarkletInstall() {
  const { notify } = useToast()
  const link = useRef<HTMLAnchorElement>(null)
  const appUrl = `${window.location.origin}${window.location.pathname}`
  const code = useMemo(() => bookmarkletCode(appUrl), [appUrl])
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)

  // React refuse les adresses « javascript: » dans le JSX : on la pose directement sur l'élément.
  useEffect(() => {
    link.current?.setAttribute('href', code)
  }, [code])

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-sm font-medium text-foreground">Ajouter une offre en un clic</p>
      <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-xs text-muted-foreground">
        <li>Affichez la barre de favoris de votre navigateur (Ctrl + Maj + B), puis glissez-y le bouton ci-dessous.</li>
        <li>Sur la page d'une offre, cliquez sur ce favori : l'offre s'ouvre ici, déjà remplie (poste, entreprise, lieu, dates, description).</li>
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          ref={link}
          className="btn-primary btn-sm cursor-grab active:cursor-grabbing"
          draggable
          title="Glissez ce bouton dans votre barre de favoris"
          onClick={(e) => {
            e.preventDefault()
            notify('Ne cliquez pas ici : glissez ce bouton dans votre barre de favoris, puis utilisez-le sur une page d’offre.', 'info')
          }}
        >
          <BookmarkPlus className="h-3.5 w-3.5" aria-hidden /> Suivi Alternance
        </a>
        <button
          className="btn-ghost btn-sm"
          title="À coller comme adresse d'un nouveau favori, si le glisser-déposer n'est pas possible"
          onClick={() => void copyText(code).then((ok) => notify(ok ? 'Code copié : créez un favori et collez-le dans son adresse.' : 'Copie impossible.', ok ? 'success' : 'error'))}
        >
          <Copy className="h-3.5 w-3.5" aria-hidden /> Copier le code du favori
        </button>
      </div>
      <p className="hint">
        Rien n'est envoyé à un serveur : le favori transmet à cet onglet ce que la page d'offre affiche déjà. Sélectionnez le texte de l'annonce avant de cliquer si le site ne fournit pas de description.
        {local ? ' Ce bouton pointe vers cette adresse locale : installez-le depuis le site en ligne pour qu’il alimente vos vraies données.' : ''}
      </p>
    </div>
  )
}
