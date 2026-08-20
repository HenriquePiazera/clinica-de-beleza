export function FormErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="border-destructive/50 bg-destructive/10 text-destructive mb-4 rounded-lg border px-4 py-3 text-sm"
    >
      {message}
    </div>
  )
}
