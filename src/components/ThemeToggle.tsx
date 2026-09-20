import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { cn } from '../utils/text'

/** Bouton Jour / Nuit : les deux icônes se croisent en fondu et rotation légère. */
export function ThemeToggle() {
  const { resolved, toggle } = useTheme()
  const dark = resolved === 'dark'
  const label = dark ? 'Passer en mode jour' : 'Passer en mode nuit'

  return (
    <button type="button" onClick={toggle} className="icon-btn relative" aria-label={label} title={label}>
      <Sun className={cn('absolute h-[18px] w-[18px] transition-all duration-200', dark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100')} aria-hidden />
      <Moon className={cn('absolute h-[18px] w-[18px] transition-all duration-200', dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0')} aria-hidden />
    </button>
  )
}
