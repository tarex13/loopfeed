export const requireAuth = (user, nextPath = null) => {
  if (user === undefined) return undefined  // Still loading
  if (!user) {
    const path = nextPath || window.location.pathname
    window.location.href = `/auth?next=${encodeURIComponent(path)}`
    return false
  }
  return true
}
