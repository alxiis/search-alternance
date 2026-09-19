import { FileManager } from '../components/FileManager'
import { ProfileForm } from '../components/ProfileForm'

export function ProfilePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FileManager />
      <ProfileForm />
    </div>
  )
}
