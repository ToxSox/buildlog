import { register } from 'node:module'

register('./hooks.mjs', import.meta.url)

// Node kennt keine Object-URLs für Blobs; gezählt wird, was offen ist.
export const openUrls = new Set()
let next = 0
URL.createObjectURL = () => {
  const url = `blob:test/${++next}`
  openUrls.add(url)
  return url
}
URL.revokeObjectURL = (url) => openUrls.delete(url)
globalThis.__APP_VERSION__ = 'test'
