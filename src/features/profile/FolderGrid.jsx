export default function FolderGrid({ folders }) {
  if (!folders.length) return <div className="text-gray-500">No folders yet.</div>

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {folders.map((folder) => (
        <div
          key={folder.id}
          className="border rounded p-4 bg-white dark:bg-gray-800 hover:shadow cursor-pointer transition"
          onClick={() => window.location.href = `/folder/${folder.id}`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-lg font-semibold">📁 {folder.name}</span>
            {folder.is_public && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                Public
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">Created on {new Date(folder.created_at).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  )
}
