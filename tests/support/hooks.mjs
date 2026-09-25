/** Lenkt `import localforage` der Stores auf den Speicher-Ersatz um. */
export async function resolve(specifier, context, next) {
  if (specifier === 'localforage') {
    return { url: new URL('./localforage.mjs', import.meta.url).href, shortCircuit: true }
  }
  return next(specifier, context)
}
