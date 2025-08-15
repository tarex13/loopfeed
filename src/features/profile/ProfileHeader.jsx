import { useUser } from '../../store/useUser'

export default function ProfileHeader({ editable = false }) {
  const { user } = useUser()

  return (
    <div className="flex items-center gap-4 mb-4">
      <img
        src={user?.avatar_url || '/default-avatar.png'}
        className="w-14 h-14 rounded-full object-cover"
        alt="avatar"
      />
      <div>
        <h1 className="text-xl font-semibold">{user?.display_name || 'Unnamed User'}</h1>
        {editable && (
          <p className="text-sm text-gray-500">Click your bio to edit (soon)</p>
        )}
      </div>
    </div>
  )
}
