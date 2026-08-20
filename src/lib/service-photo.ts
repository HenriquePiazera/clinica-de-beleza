export function resolveServicePhotoUrl(
  serviceId: string,
  photoUrl: string | null | undefined
): string | null {
  if (!photoUrl) return null
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl
  }
  return `/api/service-photos/${serviceId}`
}

export function isStoragePhotoPath(photoUrl: string | null | undefined): boolean {
  return Boolean(photoUrl && !photoUrl.startsWith('http'))
}
