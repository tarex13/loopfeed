export default function EmbedFallback({ metadata }) {
  if (!metadata) return null

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-6 h-full">
      {metadata.image && (
        <img src={metadata.image} alt="preview" className="rounded mb-3 max-h-40 object-contain" />
      )}
      <h4 className="text-base font-medium text-gray-800 dark:text-white">{metadata.title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mt-1">{metadata.description}</p>
      {metadata.url && (
        <a
          href={metadata.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 underline mt-2"
        >
          {metadata.site || 'View'}
        </a>
      )}
    </div>
  )
}
