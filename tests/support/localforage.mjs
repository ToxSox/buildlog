/**
 * LocalForage-Ersatz für die Store-Tests: hält alles im Speicher und kann
 * gezielt einen vollen Speicher vortäuschen. Ohne ihn bräuchte jeder Test der
 * Speicherpfade einen Browser – und genau die Fehlerfälle (Quota) lassen sich
 * dort kaum auslösen.
 */
export const stores = {}
/** `failSet(storeName, key)` → true lässt dieses Schreiben am Kontingent scheitern. */
export const control = { failSet: null, failGet: null }

function createInstance({ storeName }) {
  const data = (stores[storeName] ||= new Map())
  const tick = () => new Promise((resolve) => setTimeout(resolve, 1))
  return {
    async getItem(key) {
      await tick()
      if (control.failGet?.(storeName, key)) throw new Error('Connection to Indexed Database server lost')
      return data.has(key) ? structuredClone(data.get(key)) : null
    },
    async setItem(key, value) {
      await tick()
      if (control.failSet?.(storeName, key)) {
        const err = new Error('The quota has been exceeded.')
        err.name = 'QuotaExceededError'
        throw err
      }
      data.set(key, value instanceof Blob ? value : structuredClone(value))
      return value
    },
    async removeItem(key) {
      await tick()
      data.delete(key)
    },
    async keys() {
      await tick()
      return [...data.keys()]
    },
    async clear() {
      await tick()
      data.clear()
    },
  }
}

export default { createInstance }
