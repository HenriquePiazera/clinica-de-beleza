import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function pathnameFromTarget(targetPath: string): string {
  const withoutHash = targetPath.split('#')[0] ?? targetPath
  return (withoutHash.split('?')[0] ?? withoutHash) || '/'
}

function withRefreshParam(targetPath: string): string {
  const hashIndex = targetPath.indexOf('#')
  const withoutHash = hashIndex >= 0 ? targetPath.slice(0, hashIndex) : targetPath
  const hash = hashIndex >= 0 ? targetPath.slice(hashIndex) : ''
  const [pathname, search = ''] = withoutHash.split('?')
  const params = new URLSearchParams(search)
  params.set('refreshed', String(Date.now()))
  const query = params.toString()
  return `${pathname}?${query}${hash}`
}

export function refreshAndRedirect(
  targetPath: string,
  ...extraPaths: string[]
): never {
  const paths = Array.from(
    new Set([
      pathnameFromTarget(targetPath),
      ...extraPaths.map(pathnameFromTarget),
    ])
  )
  for (const path of paths) {
    revalidatePath(path, 'page')
    revalidatePath(path, 'layout')
  }
  redirect(withRefreshParam(targetPath))
}
