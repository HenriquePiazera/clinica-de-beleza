import { FICTITIOUS_DATA_NOTICE } from '@/lib/brand'

export function FictitiousDataBanner() {
  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900 sm:text-sm"
    >
      {FICTITIOUS_DATA_NOTICE}
    </div>
  )
}
