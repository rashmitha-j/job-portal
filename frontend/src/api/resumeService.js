import api from './client'

// Resumes need the JWT, so they can't be plain links: fetch the PDF and open it in a new tab.
// Must be called directly from a click handler so the new tab isn't blocked as a popup.
export async function openResume(key) {
  const tab = window.open('', '_blank')
  try {
    const { data } = await api.get(`/resumes/${key}`, { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    if (tab) {
      tab.opener = null
      tab.location.href = url
    } else {
      window.location.assign(url)
    }
    // Give the tab time to load before releasing the blob
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    tab?.close()
    throw err
  }
}
