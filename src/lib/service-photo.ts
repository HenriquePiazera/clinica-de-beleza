/** Asset estático em /public (ex.: /services/foo.jpg). */
export function isPublicAssetPath(photoUrl: string | null | undefined): boolean {
  return Boolean(
    photoUrl &&
      photoUrl.startsWith('/') &&
      !photoUrl.startsWith('//') &&
      !photoUrl.startsWith('/api/')
  )
}

export function resolveServicePhotoUrl(
  serviceId: string,
  photoUrl: string | null | undefined
): string | null {
  if (!photoUrl) return null
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl
  }
  // Arquivos em public/ sobem no deploy — não passam pelo storage efêmero.
  if (isPublicAssetPath(photoUrl)) {
    return photoUrl
  }
  return `/api/service-photos/${serviceId}`
}

export function isStoragePhotoPath(photoUrl: string | null | undefined): boolean {
  return Boolean(
    photoUrl &&
      !photoUrl.startsWith('http://') &&
      !photoUrl.startsWith('https://') &&
      !isPublicAssetPath(photoUrl)
  )
}
