import { Loader2, TriangleAlert } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useStore } from './hooks/useStore'
import { UiProvider } from './hooks/useUi'
import { CompaniesPage } from './pages/CompaniesPage'
import { CompanyDetailPage } from './pages/CompanyDetailPage'
import { CriteriaPage } from './pages/CriteriaPage'
import { DashboardPage } from './pages/DashboardPage'
import { DataPage } from './pages/DataPage'
import { JobsPage } from './pages/JobsPage'
import { KanbanPage } from './pages/KanbanPage'
import { ProfilePage } from './pages/ProfilePage'
import { SearchPage } from './pages/SearchPage'

export default function App() {
  const { ready, loadError } = useStore()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500" role="status">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden /> Chargement de vos données locales…
      </div>
    )
  }

  return (
    <UiProvider>
      {loadError && (
        <div role="alert" className="flex items-start gap-2 bg-rose-600 px-4 py-2 text-sm text-white">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Stockage local indisponible : {loadError}. Vos modifications ne seront pas conservées (navigation privée ?).
        </div>
      )}
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="profil" element={<ProfilePage />} />
          <Route path="criteres" element={<CriteriaPage />} />
          <Route path="recherche" element={<SearchPage />} />
          <Route path="offres" element={<JobsPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="entreprises" element={<CompaniesPage />} />
          <Route path="entreprises/:id" element={<CompanyDetailPage />} />
          <Route path="donnees" element={<DataPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </UiProvider>
  )
}
