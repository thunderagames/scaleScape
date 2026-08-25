export function installUmamiTracker(document_ref: Document = document): void {
  const script_url = import.meta.env.VITE_UMAMI_SCRIPT_URL
  const website_id = import.meta.env.VITE_UMAMI_WEBSITE_ID
  if (!script_url || !website_id || document_ref.querySelector(`script[data-website-id="${website_id}"]`)) return

  const script = document_ref.createElement('script')
  script.defer = true
  script.src = script_url
  script.dataset.websiteId = website_id
  document_ref.head.append(script)
}
